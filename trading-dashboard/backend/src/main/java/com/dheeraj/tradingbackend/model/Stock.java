package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "stocks")
public class Stock {
    @Id
    private String id;
    @Indexed(unique = true)
    private String symbol;
    private String companyName;
    @Indexed(unique = true)
    private String instrumentKey;
    private String sector;
    private double currentPrice;
    private double changePercent;
    private long volume;
    private double high52;
    private double low52;

}