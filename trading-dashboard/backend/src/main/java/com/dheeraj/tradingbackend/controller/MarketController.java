package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.config.MarketConfig;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/market")
@CrossOrigin
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
    public synchronized Map<String, Object> getMarketStatus() {

        // Check Indian Standard Time (IST)
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        ZonedDateTime now = ZonedDateTime.now(istZone);
        LocalTime time = now.toLocalTime();
        DayOfWeek day = now.getDayOfWeek();

        // Prevent market opening on Saturdays and Sundays
        boolean isWeekday = day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
        boolean isTradingHours = time.isAfter(LocalTime.of(9, 14)) && time.isBefore(LocalTime.of(15, 31));

        boolean isOpen = MarketConfig.FORCE_MARKET_OPEN || (isWeekday && isTradingHours);

        long currentTime = System.currentTimeMillis();

        // Only fluctuate if market is open && 3 seconds passed
        if (isOpen && (currentTime - lastUpdateMillis > 3000)) {
            currentNifty += (random.nextDouble() * 10 - 5);
            currentBankNifty += (random.nextDouble() * 30 - 15);
            currentSensex += (random.nextDouble() * 40 - 20);

            lastUpdateMillis = currentTime;
        }

        // Calculate live changes
        double niftyChange = currentNifty - BASE_NIFTY;
        double bankNiftyChange = currentBankNifty - BASE_BANKNIFTY;
        double sensexChange = currentSensex - BASE_SENSEX;

        // Round to exactly 2 decimal places to prevent messy UI numbers
        List<Map<String, Object>> indices = List.of(
                Map.of("name", "NIFTY 50", "price", Math.round(currentNifty * 100.0) / 100.0,
                        "change", Math.round(niftyChange * 100.0) / 100.0,
                        "percent", Math.round((niftyChange / BASE_NIFTY) * 10000.0) / 100.0),

                Map.of("name", "BANKNIFTY", "price", Math.round(currentBankNifty * 100.0) / 100.0,
                        "change", Math.round(bankNiftyChange * 100.0) / 100.0,
                        "percent", Math.round((bankNiftyChange / BASE_BANKNIFTY) * 10000.0) / 100.0),

                Map.of("name", "SENSEX", "price", Math.round(currentSensex * 100.0) / 100.0,
                        "change", Math.round(sensexChange * 100.0) / 100.0,
                        "percent", Math.round((sensexChange / BASE_SENSEX) * 10000.0) / 100.0)
        );

        return Map.of(
                "isOpen", isOpen,
                "status", isOpen ? "MARKET OPEN" : "MARKET CLOSED",
                "indices", indices
        );
    }
}