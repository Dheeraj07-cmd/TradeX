package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.Watchlist;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WatchlistRepository extends MongoRepository<Watchlist, String> {

    List<Watchlist> findByUserIdAndListName(String userId, String listName);
    Optional<Watchlist> findByUserIdAndSymbolAndListName(String userId, String symbol, String listName);
    List<Watchlist> findByUserId(String userId);
    void deleteByUserIdAndSymbol(String userId, String symbol);

}