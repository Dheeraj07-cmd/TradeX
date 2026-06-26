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
        return newsRepository.findTop5BySymbolOrderByTimestampDesc(symbol);
    }

    @GetMapping("/global")
    public List<NewsArticle> getGlobalMarketNews() {
        return newsRepository.findTop20ByOrderByTimestampDesc();
    }
}