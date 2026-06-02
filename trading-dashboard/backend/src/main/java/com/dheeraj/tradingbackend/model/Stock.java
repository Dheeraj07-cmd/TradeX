package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "stocks")
public class Stock {
    @Id
    private String id;
    private String symbol;
    private String companyName;
    private String sector;
    private double currentPrice;
    private double changePercent;
    private long volume;
    private double high52;
    private double low52;

}