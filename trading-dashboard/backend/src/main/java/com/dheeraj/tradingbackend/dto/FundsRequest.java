package com.dheeraj.tradingbackend.dto;

public class FundsRequest {
    private double amount;
    private String action;

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}