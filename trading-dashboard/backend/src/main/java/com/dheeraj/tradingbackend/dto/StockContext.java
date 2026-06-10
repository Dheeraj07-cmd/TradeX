package com.dheeraj.tradingbackend.dto;

public record StockContext(
        String symbol,
        String sector,
        double currentPrice,
        double priceChange,
        double marketBias,
        double interestScore
) {}