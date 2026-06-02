package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.Stock;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface StockRepository extends MongoRepository<Stock, String> {

    @Query("{ '$or': [ { 'symbol': { $regex: ?0, $options: 'i' } }, { 'companyName': { $regex: ?0, $options: 'i' } } ] }")
    List<Stock> searchStocks(String keyword);
}