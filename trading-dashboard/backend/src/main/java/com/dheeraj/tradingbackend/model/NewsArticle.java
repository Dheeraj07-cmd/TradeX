package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "news_articles")
public class NewsArticle {

    @Id
    private String id;
    @Indexed(unique = true)
    private String uniqueKey;
    @Indexed
    private String symbol;
    private String headline;
    private String summary;
    private String sentimentLabel;
    private int sentimentScore;
    @Indexed
    private long timestamp;

    // Automatically delete documents after 7 days
    @Indexed(expireAfter = "7d")
    private Date createdAt = new Date();
}