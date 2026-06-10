package com.dheeraj.tradingbackend.dto;

import com.dheeraj.tradingbackend.model.NewsArticle;
import java.util.List;
import java.util.Map;

public record MarketDashboardResponse(
        List<StockOverview> allStocks,
        List<NewsArticle> latestNews,
        List<MoverDTO> topGainers,
        List<MoverDTO> topLosers,
        List<TrendingStockDTO> trendingStocks,
        List<SentimentRankDTO> sentimentLeaderboard,
        List<MarketPressureDTO> buySellPressure,
        Map<String, Double> sectorHeatmap,
        String aiMarketSummary
) {
    public record StockOverview(String symbol, double currentPrice, double priceChange) {}
    public record MoverDTO(String symbol, double currentPrice, double priceChange) {}
    public record TrendingStockDTO(String symbol, double interestScore) {} // NEW
    public record SentimentRankDTO(String symbol, int score) {}
    public record MarketPressureDTO(String symbol, int buyPercent, int sellPercent) {}
}