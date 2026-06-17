package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.dto.StockContext;
import java.util.List;

public interface MarketDataProvider {
    List<StockContext> getTopMovingStocksContext(int limit);
}