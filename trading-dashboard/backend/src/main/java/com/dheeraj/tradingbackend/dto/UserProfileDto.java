package com.dheeraj.tradingbackend.dto;

import com.dheeraj.tradingbackend.model.KycStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileDto {
    private String name;
    private String email;
    private String phoneNumber;
    private String address;
    private String nomineeName;
    private String dateOfBirth;

    // Masked fields for UI
    private String panNumber;      // "ABCDEXXXXF"
    private boolean hasPan;
    private String aadhaarNumber;  // "XXXX-XXXX-1234"
    private boolean hasAadhaar;

    private String bankAccountNumber;
    private String ifscCode;

    private double balance;
    private KycStatus kycStatus;
    private String adminRemarks;

    private String panDocUrl;
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;

}