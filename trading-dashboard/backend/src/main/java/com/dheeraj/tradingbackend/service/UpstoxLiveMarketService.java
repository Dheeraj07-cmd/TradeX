package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.config.MarketConfig;
import com.dheeraj.tradingbackend.dto.StockContext;
import com.dheeraj.tradingbackend.model.Candle;
import com.dheeraj.tradingbackend.model.Stock;
import com.dheeraj.tradingbackend.repository.CandleRepository;
import com.dheeraj.tradingbackend.repository.StockRepository;
import com.upstox.ApiClient;
import com.upstox.Configuration;
import com.upstox.feeder.MarketDataStreamerV3;
import com.upstox.feeder.MarketUpdateV3;
import com.upstox.feeder.constants.Mode;
import com.upstox.feeder.listener.OnMarketUpdateV3Listener;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@Primary
@RequiredArgsConstructor
public class UpstoxLiveMarketService implements MarketDataProvider {

    private final StockRepository stockRepository;
    private final CandleRepository candleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;
    private final UpstoxAuthService authService;

    private MarketDataStreamerV3 streamer;
    private List<Stock> cachedStocks = List.of();

    private final Map<String, String> instrumentToSymbol = new ConcurrentHashMap<>();
    private final Map<String, Double> livePriceCache = new ConcurrentHashMap<>();
    private final Map<String, Double> liveChangeCache = new ConcurrentHashMap<>();
    private final Map<String, Long> liveVolumeCache = new ConcurrentHashMap<>();

    private long lastLogTime = 0;

    @PostConstruct
    public void init() {
        refreshStockCache();
        String existingToken = authService.getAccessToken();

        if (existingToken != null) {
            authService.applyTokenToGlobalClient(existingToken);
            initializeLiveStream();
        } else {
            System.out.println("⚠️ Upstox init paused: Waiting for OAuth callback.");
        }
    }

    @Scheduled(fixedRate = 300000)
    public void refreshStockCache() {
        try {
            cachedStocks = stockRepository.findAll();
            Set<String> updatedInstrumentKeys = new HashSet<>();

            cachedStocks.forEach(stock -> {
                if (stock.getInstrumentKey() != null) {
                    instrumentToSymbol.put(stock.getInstrumentKey(), stock.getSymbol());
                    updatedInstrumentKeys.add(stock.getInstrumentKey());
                }
            });

            if (streamer != null && !updatedInstrumentKeys.isEmpty()) {
                streamer.subscribe(updatedInstrumentKeys, Mode.LTPC);
            }
        } catch (Exception e) {
            System.err.println("⚠️ MongoDB cache reload failure: " + e.getMessage());
        }
    }

    public void initializeLiveStream() {
        try {
            Set<String> instrumentKeys = new HashSet<>(instrumentToSymbol.keySet());
            if (instrumentKeys.isEmpty()) return;

            ApiClient defaultClient = Configuration.getDefaultApiClient();
            streamer = new MarketDataStreamerV3(defaultClient, instrumentKeys, Mode.LTPC);
            streamer.autoReconnect(true, 5, 100);

            streamer.setOnMarketUpdateListener(new OnMarketUpdateV3Listener() {
                @Override
                public void onUpdate(MarketUpdateV3 marketUpdate) {
                    processLiveTick(marketUpdate);
                }
            });

            streamer.connect();
            System.out.println("Connecting to Upstox Market Data Streamer in LTPC Mode");
        } catch (Exception e) {
            System.err.println("Failed to init Upstox Stream: " + e.getMessage());
        }
    }


    // Fast Memory Layer
    private void processLiveTick(MarketUpdateV3 marketUpdate) {
        if (marketUpdate == null || marketUpdate.getFeeds() == null) return;

        if (System.currentTimeMillis() - lastLogTime > 10000) {
            System.out.println("Receiving live Upstox ticks...");
            lastLogTime = System.currentTimeMillis();
        }

        marketUpdate.getFeeds().forEach((instrumentKey, feed) -> {
            try {
                MarketUpdateV3.LTPC ltpc = feed.getLtpc();
                if (ltpc == null) return;

                String symbol = instrumentToSymbol.get(instrumentKey);
                if (symbol == null) return;

                double currentPrice = ltpc.getLtp();
                double closePrice = ltpc.getCp();
                double changePercent = closePrice > 0 ? ((currentPrice - closePrice) / closePrice) * 100.0 : 0.0;

                livePriceCache.put(instrumentKey, currentPrice);
                liveChangeCache.put(instrumentKey, changePercent);
                liveVolumeCache.put(instrumentKey, ltpc.getLtq());

            } catch (Exception ignored) {
            }
        });
    }

    @Scheduled(fixedRate = 2000)
    public void broadcastThrottledUpdates() {
        if (livePriceCache.isEmpty()) return;
        boolean hasUpdates = false;

        Map<String, String> hashUpdates = new HashMap<>();

        for (Map.Entry<String, Double> entry : livePriceCache.entrySet()) {
            String symbol = instrumentToSymbol.get(entry.getKey());
            if (symbol == null) continue;

            Double currentPrice = entry.getValue();
            hashUpdates.put(symbol, String.valueOf(currentPrice));

            messagingTemplate.convertAndSend("/topic/price/" + symbol, currentPrice);
//            generateAndBroadcastMockDepth(symbol, currentPrice);
            hasUpdates = true;
        }

        if (hasUpdates) {
            try {
                // Save map block to Redis Hash
                redisTemplate.opsForHash().putAll("live_prices", hashUpdates);
            } catch (Exception ignored) {}

            messagingTemplate.convertAndSend("/topic/market-prices", hashUpdates);

            // Keep message broker alive for background listeners
            messagingTemplate.convertAndSend("/topic/market-update", "tick");
        }
    }

    @Override
    public List<StockContext> getTopMovingStocksContext(int limit) {
        if (cachedStocks.isEmpty() || livePriceCache.isEmpty()) return List.of();
        List<StockContext> list = new ArrayList<>();

        for (Stock stock : cachedStocks) {
            String key = stock.getInstrumentKey();
            if (key == null || !livePriceCache.containsKey(key)) continue;

            double price = livePriceCache.get(key);
            double change = liveChangeCache.getOrDefault(key, 0.0);
            long volume = liveVolumeCache.getOrDefault(key, 0L);

            double bias = 1.0 + (change / 100.0);
            double score = (Math.abs(change) * 10) + (volume > 0 ? Math.log10(volume) : 0);

            list.add(new StockContext(stock.getSymbol(), stock.getSector() != null ? stock.getSector() : "OTHER", price, change, bias, score));
        }

        list.sort((a, b) -> Double.compare(b.interestScore(), a.interestScore()));
        return list.size() > limit ? list.subList(0, limit) : list;
    }

    private void generateAndBroadcastMockDepth(String symbol, double cmp) {
        List<Map<String, Object>> bids = new ArrayList<>();
        List<Map<String, Object>> asks = new ArrayList<>();
        ThreadLocalRandom localRandom = ThreadLocalRandom.current();
        double tickSize = Math.max(0.05, cmp * 0.0005);
        long totalBidQty = 0, totalAskQty = 0;

        for (int i = 1; i <= 5; i++) {
            double bidPrice = Math.round((cmp - (i * tickSize)) * 100.0) / 100.0;
            double askPrice = Math.round((cmp + (i * tickSize)) * 100.0) / 100.0;
            long bidQty = (long) ((10000 / i) + localRandom.nextInt(1000));
            long askQty = (long) ((10000 / i) + localRandom.nextInt(1000));
            totalBidQty += bidQty;
            totalAskQty += askQty;

            bids.add(Map.of("price", bidPrice, "qty", bidQty, "orders", localRandom.nextInt(10) + 5));
            asks.add(Map.of("price", askPrice, "qty", askQty, "orders", localRandom.nextInt(10) + 5));
        }

        messagingTemplate.convertAndSend("/topic/depth/" + symbol, Map.of(
                "symbol", symbol, "bids", bids, "asks", asks,
                "totalBidQty", totalBidQty, "totalAskQty", totalAskQty,
                "spread", Math.round(((double) asks.get(0).get("price") - (double) bids.get(0).get("price")) * 100.0) / 100.0
        ));
    }

    // Historical Chart Candle Generator
    private boolean isMarketOpen() {
        if (MarketConfig.FORCE_MARKET_OPEN) return true;
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalTime now = LocalTime.now(istZone);
        return !now.isBefore(LocalTime.of(9, 15)) && now.isBefore(LocalTime.of(15, 30));
    }

    @Scheduled(fixedRate = 60000)
    public void syncCandlesToDatabase() {
        if (!isMarketOpen() || cachedStocks.isEmpty()) return;
        for (Stock stock : cachedStocks) {
            try {
                String symbol = stock.getSymbol();
                Object cachedPriceObj = redisTemplate.opsForHash().get("live_prices", symbol);
                if (cachedPriceObj != null) {
                    double livePrice = Double.parseDouble(cachedPriceObj.toString());
                    updateLatestCandle(symbol, "5M", livePrice);
                    updateLatestCandle(symbol, "1H", livePrice);
                    updateLatestCandle(symbol, "1D", livePrice);
                    updateLatestCandle(symbol, "1W", livePrice);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private void updateLatestCandle(String symbol, String timeframe, double newPrice) {
        try {
            candleRepository.findFirstBySymbolAndTimeframeOrderByTimeDesc(symbol, timeframe)
                    .ifPresent(latest -> {
                        boolean isModified = false;
                        if (latest.getClose() != newPrice) {
                            latest.setClose(newPrice);
                            isModified = true;
                        }
                        if (newPrice > latest.getHigh()) {
                            latest.setHigh(newPrice);
                            isModified = true;
                        }
                        if (newPrice < latest.getLow()) {
                            latest.setLow(newPrice);
                            isModified = true;
                        }
                        if (isModified) candleRepository.save(latest);
                    });
        } catch (Exception ignored) {}
    }

    @Scheduled(cron = "0 */5 * * * *") // Every 5 minutes
    public void generate5MinCandles() {
        createNewCandlesForTimeframe("5M");
    }

    @Scheduled(cron = "0 0 * * * *") // At minute 0 of every hour
    public void generate1HourCandles() {
        createNewCandlesForTimeframe("1H");
    }

    @Scheduled(cron = "0 30 15 * * MON-FRI") // At 15:30 PM everyday
    public void generate1DayCandles() {
        createNewCandlesForTimeframe("1D");
    }

    @Scheduled(cron = "0 30 15 * * FRI") // At 15:30 PM on Fridays
    public void generate1WeekCandles() {
        createNewCandlesForTimeframe("1W");
    }


    private void createNewCandlesForTimeframe(String timeframe) {
        // Daily and Weekly candles only generate if market is open at exactly 15:30
        if (!isMarketOpen() && (timeframe.equals("1D") || timeframe.equals("1W"))) return;
        if (cachedStocks.isEmpty()) return;

        long currentTime = System.currentTimeMillis() / 1000;
        for (Stock stock : cachedStocks) {
            try {
                String symbol = stock.getSymbol();
                Object cachedPriceObj = redisTemplate.opsForHash().get("live_prices", symbol);double livePrice = (cachedPriceObj != null) ? Double.parseDouble(cachedPriceObj.toString()) : stock.getCurrentPrice();
                candleRepository.save(new Candle(symbol, timeframe, currentTime, livePrice, livePrice, livePrice, livePrice));
            } catch (Exception ignored) {}
        }
    }

    @Scheduled(fixedRate = 4000)
    public void broadcastMarketDepth() {
        if (livePriceCache.isEmpty()) return;

        for (Map.Entry<String, Double> entry : livePriceCache.entrySet()) {
            String symbol = instrumentToSymbol.get(entry.getKey());
            if (symbol != null) {
                generateAndBroadcastMockDepth(symbol, entry.getValue());
            }
        }
    }
}