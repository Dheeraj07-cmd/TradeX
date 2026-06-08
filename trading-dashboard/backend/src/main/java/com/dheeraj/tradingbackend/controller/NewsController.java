package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.NewsArticle;
import com.dheeraj.tradingbackend.repository.NewsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {

    private final NewsRepository newsRepository;

    public NewsController(NewsRepository newsRepository) {
        this.newsRepository = newsRepository;
    }

    @GetMapping("/{symbol}")
    public List<NewsArticle> getLatestNewsForSymbol(@PathVariable String symbol) {
        // Fetch 5 recent AI articles for the specific stock
        return newsRepository.findTop5BySymbolOrderByTimestampDesc(symbol);
    }

    @GetMapping("/global")
    public List<NewsArticle> getGlobalMarketNews() {
        // Fetch top 20 recent articles across the entire market
        return newsRepository.findTop20ByOrderByTimestampDesc();
    }
}