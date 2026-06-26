package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Stock;
import com.dheeraj.tradingbackend.repository.StockRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
public class StockController {

    private final StockRepository stockRepository;
    private final StringRedisTemplate redisTemplate;

    public StockController(StockRepository stockRepository, StringRedisTemplate redisTemplate ) {
        this.stockRepository = stockRepository;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/search")
    public List<Stock> searchStocks(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        List<Stock> results = stockRepository.searchStocks(query);
        applyLivePrices(results);

        return results;
    }

    @GetMapping("/{symbol}")
    public Stock getStockBySymbol(@PathVariable String symbol) {
        Stock stock = stockRepository
                .searchStocks(symbol)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        applyLivePrice(stock);

        return stock;
    }

    @GetMapping("/all")
    public List<Stock> getAllStocks() {
        List<Stock> stocks = stockRepository.findAll();
        applyLivePrices(stocks);
        return stocks;
    }

    private void applyLivePrice(Stock stock) {
        Object livePriceObj = redisTemplate.opsForHash().get("live_prices", stock.getSymbol());

        if (livePriceObj != null) {
            try {
                stock.setCurrentPrice(Double.parseDouble(livePriceObj.toString()));
            } catch (Exception ignored) {}
        }
    }

    private void applyLivePrices(List<Stock> stocks) {
        for (Stock stock : stocks) {
            applyLivePrice(stock);
        }
    }
}