package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "news_articles")
public class NewsArticle {

    @Id
    private String id;

    private String symbol;
    private String headline;
    private String summary;
    private String sentimentLabel;
    private int sentimentScore;
    private long timestamp;
}
