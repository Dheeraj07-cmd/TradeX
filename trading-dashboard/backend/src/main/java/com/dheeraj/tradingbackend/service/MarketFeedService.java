package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.dto.MarketDashboardResponse;
import com.dheeraj.tradingbackend.dto.MarketDashboardResponse.*;
import com.dheeraj.tradingbackend.dto.StockContext;
import com.dheeraj.tradingbackend.model.MarketSummary;
import com.dheeraj.tradingbackend.model.NewsArticle;
import com.dheeraj.tradingbackend.repository.MarketSummaryRepository;
import com.dheeraj.tradingbackend.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MarketFeedService {

    private final MarketDataProvider marketDataProvider;
    private final NewsRepository newsRepository;
    private final MarketSummaryRepository summaryRepository;

    public MarketDashboardResponse buildDashboard() {
        // Fetch latest 20 news article
        List<NewsArticle> recentNews = newsRepository.findTop20ByOrderByTimestampDesc();
        List<StockContext> activeStocks = marketDataProvider.getTopMovingStocksContext(50);

        List<StockOverview> allStocks = new ArrayList<>();
        List<MoverDTO> gainers = new ArrayList<>();
        List<MoverDTO> losers = new ArrayList<>();
        List<TrendingStockDTO> trendingStocks = new ArrayList<>();
        List<MarketPressureDTO> pressureList = new ArrayList<>();
        List<SentimentRankDTO> sentimentList = new ArrayList<>();
        Map<String, List<Double>> sectorPerformanceMap = new HashMap<>();

        for (StockContext stock : activeStocks) {
            allStocks.add(new StockOverview(stock.symbol(), stock.currentPrice(), stock.priceChange()));
            trendingStocks.add(new TrendingStockDTO(stock.symbol(), stock.interestScore()));

            sectorPerformanceMap.computeIfAbsent(stock.sector(), k -> new ArrayList<>()).add(stock.priceChange());

            if (stock.priceChange() > 0) gainers.add(new MoverDTO(stock.symbol(), stock.currentPrice(), stock.priceChange()));
            else losers.add(new MoverDTO(stock.symbol(), stock.currentPrice(), stock.priceChange()));

            int buyPercent = (int) Math.min(95, Math.max(5, 50 + ((stock.marketBias() - 1.0) * 100)));
            pressureList.add(new MarketPressureDTO(stock.symbol(), buyPercent, 100 - buyPercent));
        }

        gainers.sort((a, b) -> Double.compare(b.priceChange(), a.priceChange()));
        losers.sort((a, b) -> Double.compare(a.priceChange(), b.priceChange()));

        // Defensive Sorting for Trending Stocks
        trendingStocks.sort((a, b) -> Double.compare(b.interestScore(), a.interestScore()));

        LinkedHashMap<String, Double> sortedSectorHeatmap = sectorPerformanceMap.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        Map<String, Integer> symbolSentimentMap = new HashMap<>();
        for (NewsArticle article : recentNews) {
            symbolSentimentMap.putIfAbsent(article.getSymbol(), article.getSentimentScore());
        }

        symbolSentimentMap.forEach((symbol, score) -> sentimentList.add(new SentimentRankDTO(symbol, score)));
        sentimentList.sort((a, b) -> Integer.compare(b.score(), a.score()));

        // Fetch dynamic summary, fallback if DB is empty
        MarketSummary latestSummary = summaryRepository.findFirstByOrderByTimestampDesc();
        String aiSummaryText = latestSummary != null ? latestSummary.getSummaryText() : "Market data initializing. Gathering institutional flow characteristics...";

        return new MarketDashboardResponse(
                allStocks, recentNews,
                gainers.stream().limit(5).collect(Collectors.toList()),
                losers.stream().limit(5).collect(Collectors.toList()),
                trendingStocks.stream().limit(5).collect(Collectors.toList()),
                sentimentList.stream().limit(5).collect(Collectors.toList()),
                pressureList.stream().limit(5).collect(Collectors.toList()),
                sortedSectorHeatmap, aiSummaryText
        );
    }
}