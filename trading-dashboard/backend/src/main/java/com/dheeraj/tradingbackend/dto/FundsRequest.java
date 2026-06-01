package com.dheeraj.tradingbackend.dto;

import lombok.Data;

@Data
public class FundsRequest {
    private double amount;
    private String action;

}