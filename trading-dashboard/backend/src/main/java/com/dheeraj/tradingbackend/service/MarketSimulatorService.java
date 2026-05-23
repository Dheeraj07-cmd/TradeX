package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.Holding;
import com.dheeraj.tradingbackend.model.Position;
import com.dheeraj.tradingbackend.model.Watchlist;
import com.dheeraj.tradingbackend.repository.HoldingRepository;
import com.dheeraj.tradingbackend.repository.PositionRepository;
import com.dheeraj.tradingbackend.repository.WatchlistRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class MarketSimulatorService {

    private final HoldingRepository holdingRepository;
    private final PositionRepository positionRepository;
    private final WatchlistRepository watchlistRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final Random random = new Random();

    public MarketSimulatorService(HoldingRepository holdingRepository,
                                  PositionRepository positionRepository,
                                  WatchlistRepository watchlistRepository,
                                  SimpMessagingTemplate messagingTemplate) {
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.watchlistRepository = watchlistRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 3000)
    @Transactional
    public void simulateMarketMovement() {

        List<Holding> holdings = holdingRepository.findAll();
        List<Position> positions = positionRepository.findAll();
        List<Watchlist> watchlists = watchlistRepository.findAll();

        Map<String, Double> currentPrices = new HashMap<>();

        for (Holding h : holdings)
            currentPrices.putIfAbsent(h.getName(), h.getPrice());

        for (Position p : positions)
            currentPrices.putIfAbsent(p.getName(), p.getPrice());

        for (Watchlist w : watchlists)
            currentPrices.putIfAbsent(w.getSymbol(), w.getPrice());

        Map<String, Double> newMarketPrices = new HashMap<>();
        for (Map.Entry<String, Double> entry : currentPrices.entrySet()) {
            String symbol = entry.getKey();
            double oldPrice = entry.getValue();

            double changePercent = (random.nextDouble() - 0.5) * 0.01;
            double newPrice = oldPrice + (oldPrice * changePercent);
            newMarketPrices.put(symbol, Math.round(newPrice * 100.0) / 100.0);
        }

        for (Holding h : holdings) h.setPrice(newMarketPrices.get(h.getName()));
        holdingRepository.saveAll(holdings);

        for (Position p : positions) {
            p.setPrice(newMarketPrices.get(p.getName()));
            double pnl = (p.getPrice() - p.getAvg()) * p.getQty();
            p.setNet(String.format("%.2f", pnl));
            p.setDay(p.getNet());
            p.setLoss(pnl < 0);
        }
        positionRepository.saveAll(positions);

        for (Watchlist w : watchlists) {
            double oldPrice = w.getPrice();
            double newPrice = newMarketPrices.get(w.getSymbol());
            w.setPrice(newPrice);

            double calcChange = ((newPrice - oldPrice) / oldPrice) * 100;
            w.setChangePercent(Math.round(calcChange * 100.0) / 100.0);
        }
        watchlistRepository.saveAll(watchlists);

        watchlists.stream()
                .map(Watchlist::getUserId)
                .distinct()
                .forEach(userId ->
                        messagingTemplate.convertAndSend("/topic/portfolio/" + userId, "market-update")
                );
    }
}
