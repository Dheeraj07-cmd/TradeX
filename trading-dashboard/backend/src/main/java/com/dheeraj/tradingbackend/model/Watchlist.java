package com.dheeraj.tradingbackend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "watchlist")
public class Watchlist {

    @Id
    private String id;
    private String userId;
    private String symbol;
    private String companyName;
    private double basePrice;
    private double price;
    private double changePercent;
    private String listName = "Watchlist 1";

}