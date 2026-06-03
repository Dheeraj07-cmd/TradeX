package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.Candle;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface CandleRepository extends MongoRepository<Candle, String> {
    List<Candle> findBySymbolAndTimeframeOrderByTimeAsc(String symbol, String timeframe);
    boolean existsBySymbol(String symbol);
    Optional<Candle> findFirstBySymbolAndTimeframeOrderByTimeDesc(String symbol, String timeframe);
}