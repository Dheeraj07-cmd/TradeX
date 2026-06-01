package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.config.MarketConfig;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final Random random = new Random();

    // (Yesterday Close) base prices
    private final double BASE_NIFTY = 22519.40;
    private final double BASE_BANKNIFTY = 48494.95;
    private final double BASE_SENSEX = 74221.06;

    private double currentNifty = BASE_NIFTY;
    private double currentBankNifty = BASE_BANKNIFTY;
    private double currentSensex = BASE_SENSEX;
    private long lastUpdateMillis = 0;

    @GetMapping("/status")
    public Map<String, Object> getMarketStatus() {

        // Check Indian Standard Time (IST)
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalTime now = LocalTime.now(istZone);
        boolean isOpen = MarketConfig.FORCE_MARKET_OPEN ||
                (now.isAfter(LocalTime.of(9, 15)) && now.isBefore(LocalTime.of(15, 30)));

        long currentTime = System.currentTimeMillis();

        // Only fluctuate if market is open AND 3 seconds passed since last fluctuation
        if (isOpen && (currentTime - lastUpdateMillis > 3000)) {
            currentNifty += (random.nextDouble() * 10 - 5);
            currentBankNifty += (random.nextDouble() * 30 - 15);
            currentSensex += (random.nextDouble() * 40 - 20);

            lastUpdateMillis = currentTime; // Lock for next 3 seconds
        }

        // Calculate live changes
        double niftyChange = currentNifty - BASE_NIFTY;
        double bankNiftyChange = currentBankNifty - BASE_BANKNIFTY;
        double sensexChange = currentSensex - BASE_SENSEX;

        // Package data for React
        List<Map<String, Object>> indices = List.of(
                Map.of("name", "NIFTY 50", "price", currentNifty, "change", niftyChange, "percent", (niftyChange / BASE_NIFTY) * 100),
                Map.of("name", "BANKNIFTY", "price", currentBankNifty, "change", bankNiftyChange, "percent", (bankNiftyChange / BASE_BANKNIFTY) * 100),
                Map.of("name", "SENSEX", "price", currentSensex, "change", sensexChange, "percent", (sensexChange / BASE_SENSEX) * 100)
        );

        return Map.of(
                "marketOpen", isOpen,
                "statusMessage", isOpen ? "MARKET OPEN" : "MARKET CLOSED",
                "indices", indices
        );
    }
}