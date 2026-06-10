package com.dheeraj.tradingbackend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "market_summaries")
public class MarketSummary {
    @Id
    private String id;
    private String summaryText;
    @Indexed
    private long timestamp;

    public MarketSummary(String summaryText, long timestamp) {
        this.summaryText = summaryText;
        this.timestamp = timestamp;
    }
}