package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Stock;
import com.dheeraj.tradingbackend.model.Watchlist;
import com.dheeraj.tradingbackend.repository.StockRepository;
import com.dheeraj.tradingbackend.repository.WatchlistRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/watchlist")
@CrossOrigin
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;
    private final StockRepository stockRepository;
    private final StringRedisTemplate redisTemplate;

    public WatchlistController(
            WatchlistRepository watchlistRepository,
            StockRepository stockRepository,
            StringRedisTemplate redisTemplate) {
        this.watchlistRepository = watchlistRepository;
        this.stockRepository = stockRepository;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Watchlist>> getWatchlist(HttpServletRequest request, @RequestParam(required = false, defaultValue = "Watchlist 1") String listName) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or missing token");
        }

        List<Watchlist> watchlists = watchlistRepository.findByUserIdAndListName(userId, listName);
        applyLivePrices(watchlists);
        return ResponseEntity.ok(watchlists);
    }

    @GetMapping("/tabs")
    public ResponseEntity<List<String>> getWatchlistTabs(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        List<Watchlist> allItems = watchlistRepository.findByUserId(userId);

        List<String> tabs = allItems.stream()
                .map(Watchlist::getListName)
                .distinct()
                .toList();

        // If user has no stocks give them the default tab
        if (tabs.isEmpty()) {
            tabs = List.of("Watchlist 1");
        }

        return ResponseEntity.ok(tabs);
    }

    @PostMapping("/add/{symbol}")
    public ResponseEntity<?> addToWatchlist(@PathVariable String symbol, @RequestParam(required = false, defaultValue = "Watchlist 1") String listName, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");

            // Check if it already exists in THIS specific list
            if (watchlistRepository.findByUserIdAndSymbolAndListName(userId, symbol, listName).isPresent()) {
                return ResponseEntity.badRequest().body("Stock is already in " + listName + "!");
            }

            List<Stock> searchResults = stockRepository.searchStocks(symbol);
            if (searchResults.isEmpty()) {
                return ResponseEntity.badRequest().body("Stock not found in database.");
            }

            Stock stock = searchResults.get(0);
            Watchlist item = new Watchlist();
            item.setUserId(userId);
            item.setSymbol(stock.getSymbol());
            item.setPrice(stock.getCurrentPrice());
            item.setBasePrice(stock.getCurrentPrice());
            item.setListName(listName);
            item.setCompanyName(stock.getCompanyName());

            watchlistRepository.save(item);
            return ResponseEntity.ok(Map.of("message", symbol + " added to " + listName + "!"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error adding to watchlist: " + e.getMessage());
        }
    }

    @DeleteMapping("/remove/{symbol}")
    public ResponseEntity<?> removeFromWatchlist(
            @PathVariable String symbol,
            @RequestParam(required = false, defaultValue = "Watchlist 1") String listName,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");

        // Remove it ONLY from specific list
        Optional<Watchlist> item = watchlistRepository.findByUserIdAndSymbolAndListName(userId, symbol, listName);
        item.ifPresent(watchlistRepository::delete);

        return ResponseEntity.ok(Map.of("message", symbol + " removed from " + listName + "."));
    }

    private void applyLivePrices(List<Watchlist> watchlists) {
        for (Watchlist watchlist : watchlists) {
            Object livePriceObj = redisTemplate.opsForHash().get("live_prices", watchlist.getSymbol());

            if (livePriceObj != null) {
                try {
                    double latestPrice = Double.parseDouble(livePriceObj.toString());
                    watchlist.setPrice(latestPrice);

                    // Calculate strictly against the locked basePrice
                    double base = watchlist.getBasePrice();
                    if (base > 0) {
                        double changePercent = ((latestPrice - base) / base) * 100;
                        watchlist.setChangePercent(Math.round(changePercent * 100.0)/ 100.0);
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}