package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Candle;
import com.dheeraj.tradingbackend.repository.CandleRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chart")
public class ChartController {

    private final CandleRepository candleRepository;

    public ChartController(CandleRepository candleRepository) {
        this.candleRepository = candleRepository;
    }

    @GetMapping("/{symbol}/{timeframe}")
    public List<Candle> getHistoricalData(@PathVariable String symbol, @PathVariable String timeframe) {
        return candleRepository.findBySymbolAndTimeframeOrderByTimeAsc(symbol, timeframe);
    }
}