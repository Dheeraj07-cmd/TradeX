package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.dto.MarketDashboardResponse;
import com.dheeraj.tradingbackend.service.MarketFeedService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/market-feed")
public class MarketFeedController {

    private final MarketFeedService marketFeedService;

    public MarketFeedController(MarketFeedService marketFeedService) {
        this.marketFeedService = marketFeedService;
    }

    @GetMapping("/overview")
    public MarketDashboardResponse getMarketOverview() {
        return marketFeedService.buildDashboard();
    }
}