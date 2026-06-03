package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "historical_candles")
public class Candle {
    @Id
    private String id;

    private String symbol;
    private String timeframe;

    private long time;
    private double open;
    private double high;
    private double low;
    private double close;

    public Candle(String symbol, String timeframe, long time, double open, double high, double low, double close) {
        this.symbol = symbol;
        this.timeframe = timeframe;
        this.time = time;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
    }
}