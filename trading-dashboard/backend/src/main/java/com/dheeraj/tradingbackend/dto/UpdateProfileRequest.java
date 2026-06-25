package com.dheeraj.tradingbackend.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String name;
    private String phoneNumber;
    private String dateOfBirth;
    private String address;
    private String nomineeName;
    private String panNumber;
    private String aadhaarNumber;
    private String bankAccountNumber;
    private String ifscCode;
}