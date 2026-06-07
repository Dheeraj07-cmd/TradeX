package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.config.MarketConfig;
import com.dheeraj.tradingbackend.model.Candle;
import com.dheeraj.tradingbackend.model.Stock;
import com.dheeraj.tradingbackend.repository.CandleRepository;
import com.dheeraj.tradingbackend.repository.StockRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MarketSimulatorService {

    private final StockRepository stockRepository;
    private final CandleRepository candleRepository;
    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private volatile List<Stock> cachedStocks = List.of();
    private final Random random = new Random();
    private final Map<String, Double> volatilityMap = new ConcurrentHashMap<>();
    private final Map<String, Double> stockBiasMap = new ConcurrentHashMap<>();

    public MarketSimulatorService(StockRepository stockRepository,
                                  CandleRepository candleRepository,
                                  StringRedisTemplate redisTemplate,
                                  SimpMessagingTemplate messagingTemplate) {
        this.stockRepository = stockRepository;
        this.candleRepository = candleRepository;
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        try {
            System.out.println("Loading stocks into RAM Cache...");
            cachedStocks = stockRepository.findAll();
        }
        catch (Exception e) {
            cachedStocks = List.of();
            System.out.println("⚠️ Could not load stocks at startup");
        }

        // Define custom volatility for specific
        volatilityMap.put("RELIANCE", 0.0010);
        volatilityMap.put("TCS", 0.0015);
        volatilityMap.put("HDFCBANK", 0.0012);
        volatilityMap.put("TATAMOTORS", 0.0040); // High volatility
        volatilityMap.put("SBIN", 0.0030);       // High volatility
        volatilityMap.put("ZOMATO", 0.0050);     // Extreme volatility

        for (Stock stock : cachedStocks) {
            stockBiasMap.put(stock.getSymbol(), 1.0);
        }
    }

    // Refresh RAM cache every 5 minutes so new DB stocks start ticking dynamically
    @Scheduled(fixedRate = 300000)
    public void refreshStockCache() {
        try {
            cachedStocks = stockRepository.findAll();

            for (Stock stock : cachedStocks) {
                volatilityMap.putIfAbsent(stock.getSymbol(), 0.002);
                stockBiasMap.putIfAbsent(stock.getSymbol(), 1.0);
            }
            System.out.println("🔄 RAM Cache Refreshed. Tracking " + cachedStocks.size() + " stocks.");
        } catch (Exception e) {
            System.out.println("⚠️ Mongo Atlas error during cache refresh: " + e.getMessage());
        }
    }

    // Fast lane (Runs every 3s)
    // Here data will not save in DB
    @Scheduled(fixedRate = 3000)
    public void simulateMarketMovement() {
        if (!isMarketOpen()) {
//            System.out.println("Market Closed");
            return;
        }

        if (cachedStocks == null || cachedStocks.isEmpty()) return;
        for (Stock stock : cachedStocks) {
            String symbol = stock.getSymbol();
            String redisKey = "live_price:" + symbol;

                // Get latest live price from Redis
            try {
                String cachedPriceStr = redisTemplate.opsForValue().get(redisKey);
                double currentPrice = (cachedPriceStr != null) ? Double.parseDouble(cachedPriceStr) : stock.getCurrentPrice();

                // Apply dynamic volatility based on stock
                double volatility = volatilityMap.getOrDefault(symbol, 0.002);
                double bias = stockBiasMap.getOrDefault(symbol, 1.0);
                double directionalBias = (bias - 1.0) * 0.5;
                double changePercent = ((random.nextDouble() - 0.5) + directionalBias) * volatility;

                double newPrice = currentPrice + (currentPrice * changePercent);
                newPrice = Math.round(newPrice * 100.0) / 100.0;

                // Save to Redis
                redisTemplate.opsForValue().set(redisKey, String.valueOf(newPrice));
                messagingTemplate.convertAndSend("/topic/price/" + symbol, newPrice);

                generateAndBroadcastMarketDepth(symbol, newPrice);
            } catch (Exception e) {
                System.out.println("Redis error for " + symbol + " : " + e.getMessage());
            }
        }
        messagingTemplate.convertAndSend("/topic/market-update", "tick");
        messagingTemplate.convertAndSend("/topic/portfolio/update", "tick");
//        System.out.println("Market Tick");
    }

    private void generateAndBroadcastMarketDepth(String symbol, double cmp) {
        java.util.List<java.util.Map<String, Object>> bids = new java.util.ArrayList<>();
        java.util.List<java.util.Map<String, Object>> asks = new java.util.ArrayList<>();

        long totalBidQty = 0;
        long totalAskQty = 0;
        double tickSize = Math.max(0.05, cmp * 0.00005);
        tickSize = Math.round(tickSize * 100.0) / 100.0;

        double bias = stockBiasMap.getOrDefault(symbol, 1.0);
        // Base bias to simulate order imbalance (Buy/Sell pressure)
        bias += (random.nextDouble() - 0.5) * 0.02;
        bias = Math.max(0.7, Math.min(1.3, bias));
        stockBiasMap.put(symbol, bias);

        for (int i = 1; i <= 5; i++) {
            // Fixed spreads around CMP
            double bidPrice = Math.round((cmp - (i * tickSize)) * 100.0) / 100.0;
            double askPrice = Math.round((cmp + (i * tickSize)) * 100.0) / 100.0;

            // Liquidity Clustering: Higher volume closest to CMP
            long baseQty = (long) ((20000 / i) + random.nextInt(2000));
            long bidQty = (long) (baseQty * bias);
            long askQty = (long) (baseQty * (2.0 - bias));

            int bidOrders = random.nextInt(15) + (20 / i);
            int askOrders = random.nextInt(15) + (20 / i);

            totalBidQty += bidQty;
            totalAskQty += askQty;

            bids.add(java.util.Map.of("price", bidPrice, "qty", bidQty, "orders", bidOrders));
            asks.add(java.util.Map.of("price", askPrice, "qty", askQty, "orders", askOrders));
        }

        // Safe and precise operator precedence
        double bestAsk = (double) asks.get(0).get("price");
        double bestBid = (double) bids.get(0).get("price");
        double spread = Math.round((bestAsk - bestBid) * 100.0) / 100.0;

        java.util.Map<String, Object> depthPack = java.util.Map.of(
                "symbol", symbol,
                "bids", bids,
                "asks", asks,
                "totalBidQty", totalBidQty,
                "totalAskQty", totalAskQty,
                "spread", spread
        );
        messagingTemplate.convertAndSend("/topic/depth/" + symbol, depthPack);
    }

    // Slow lane (Runs every 10s) (Syncs to MongoDB every 10s)
    @Scheduled(fixedRate = 10000)
    public void syncCandlesToDatabase() {
        if (!isMarketOpen()) return;
        if (cachedStocks == null || cachedStocks.isEmpty()) return;

        for (Stock stock : cachedStocks) {
            try {
                String symbol = stock.getSymbol();
                String cachedPriceStr = redisTemplate.opsForValue().get("live_price:" + symbol);

                if (cachedPriceStr != null) {
                    double livePrice = Double.parseDouble(cachedPriceStr);
                    updateLatestCandle(symbol, "1D", livePrice);
                    updateLatestCandle(symbol, "1W", livePrice);
                    updateLatestCandle(symbol, "1M", livePrice);
                    updateLatestCandle(symbol, "1Y", livePrice);
                }
            }
            catch (Exception ignored) {}
        }
    }


    // Update current candle OHLC
    private void updateLatestCandle(String symbol, String timeframe, double newPrice) {
        try{
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
                    if (isModified) {
                        candleRepository.save(latest);
                    }
                });
        } catch (Exception ignored) {}
    }

    // 1D -> New candle every 5 minutes
    @Scheduled(cron = "0 */5 * * * *")
    public void generate1DCandles() { createNewCandlesForTimeframe("1D"); }

    // 1W -> New candle every 1 hour (HH:00)
    @Scheduled(cron = "0 0 * * * *")
    public void generate1WCandles() { createNewCandlesForTimeframe("1W"); }

    // 1M -> New candle every day at market close (15:30)
    @Scheduled(cron = "0 30 15 * * *")
    public void generate1MCandles() { createNewCandlesForTimeframe("1M"); }

    // 1Y -> New candle every week (Friday at market close 15:30)
    @Scheduled(cron = "0 30 15 * * FRI")
    public void generate1YCandles() { createNewCandlesForTimeframe("1Y"); }

    private void createNewCandlesForTimeframe(String timeframe) {
        // Daily and Weekly candles generate (every 5 min, every hour), so skip isMarketOpen check for them
        if (!isMarketOpen() && !timeframe.equals("1M") && !timeframe.equals("1Y")) return;

        System.out.println("Generating New " + timeframe + " Candles...");

        if (cachedStocks == null || cachedStocks.isEmpty()) return;
        long currentTime = System.currentTimeMillis() / 1000;

        for (Stock stock : cachedStocks) {
            try {

                String symbol = stock.getSymbol();
                String cachedPriceStr = redisTemplate.opsForValue().get("live_price:" + symbol);
                double livePrice = (cachedPriceStr != null) ? Double.parseDouble(cachedPriceStr) : stock.getCurrentPrice();

                candleRepository.save(new Candle(symbol, timeframe, currentTime, livePrice, livePrice, livePrice, livePrice));
            } catch (Exception ignored) {}
        }
    }

    private boolean isMarketOpen() {
        if (MarketConfig.FORCE_MARKET_OPEN) return true;

        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalTime now = LocalTime.now(istZone);

        return now.isAfter(LocalTime.of(9, 15)) && now.isBefore(LocalTime.of(15, 30));
    }

    public Map<String, Object> getHighestMovingStockContext() {
        if (cachedStocks == null || cachedStocks.isEmpty()) {
            return Map.of();
        }

        String targetSymbol = null;
        double maxScore = -1;
        double targetPrice = 0;
        double targetChangePercent = 0;
        double targetBias = 1.0;

        for (Stock stock : cachedStocks) {
            String symbol = stock.getSymbol();
            double basePrice = stock.getCurrentPrice();

            try {
                String cachedPriceStr = redisTemplate.opsForValue().get("live_price:" + symbol);
                if (cachedPriceStr == null) continue;

                double currentPrice = Double.parseDouble(cachedPriceStr);
                // Calculate session percentage change
                double changePercent = basePrice != 0 ? ((currentPrice - basePrice) / basePrice) * 100.0 : 0.0;
                double bias = stockBiasMap.getOrDefault(symbol, 1.0);

                // looks for either price movement OR heavy order flow imbalance
                double interestScore = Math.abs(changePercent) + (Math.abs(bias - 1.0) * 50.0);

                if (interestScore > maxScore) {
                    maxScore = interestScore;
                    targetSymbol = symbol;
                    targetPrice = currentPrice;
                    targetChangePercent = changePercent;
                    targetBias = bias;
                }
            } catch (Exception ignored) {}
        }

        if (targetSymbol == null) return Map.of();

        Map<String, Object> context = new HashMap<>();
        context.put("symbol", targetSymbol);
        context.put("currentPrice", targetPrice);
        context.put("priceChange", targetChangePercent);
        context.put("marketBias", targetBias);
        return context;
    }
}