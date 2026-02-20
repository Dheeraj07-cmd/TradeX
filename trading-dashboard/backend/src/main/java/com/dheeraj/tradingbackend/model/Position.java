package com.dheeraj.tradingbackend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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

    public Position() {}

    // getters & setters
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getProduct() {
        return product;
    }
    public void setProduct(String product) {
        this.product = product;
    }

    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }

    public int getQty() {
        return qty;
    }
    public void setQty(int qty) {
        this.qty = qty;
    }

    public double getAvg() {
        return avg;
    }
    public void setAvg(double avg) {
        this.avg = avg;
    }

    public double getPrice() {
        return price;
    }
    public void setPrice(double price) {
        this.price = price;
    }

    public String getNet() {
        return net;
    }
    public void setNet(String net) {
        this.net = net;
    }

    public String getDay() {
        return day;
    }
    public void setDay(String day) {
        this.day = day;
    }

    public boolean isLoss() {
        return isLoss;
    }
    public void setLoss(boolean loss) {
        this.isLoss = loss;
    }

}

