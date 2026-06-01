package com.dheeraj.tradingbackend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "positions")
public class Position {

    @Id
    private String id;

    private String userId;
    private String product;
    private String name;
    private int qty;
    private double avg;
    private double price;
    private String net;
    private String day;
    private boolean isLoss;

}

