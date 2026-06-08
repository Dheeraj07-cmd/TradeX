package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.NewsArticle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsRepository extends MongoRepository<NewsArticle, String> {

    List<NewsArticle> findBySymbolOrderByTimestampDesc(String symbol);
    List<NewsArticle> findTop20ByOrderByTimestampDesc();
    List<NewsArticle> findTop5BySymbolOrderByTimestampDesc(String symbol);
}