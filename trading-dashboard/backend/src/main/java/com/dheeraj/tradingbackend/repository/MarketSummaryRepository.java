package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.MarketSummary;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MarketSummaryRepository extends MongoRepository<MarketSummary, String> {
     MarketSummary findFirstByOrderByTimestampDesc();
}
