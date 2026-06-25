package com.dheeraj.tradingbackend.dto;

import lombok.Data;

@Data
public class PasswordChangeRequest {
    private String currentPassword;
    private String newPassword;
}