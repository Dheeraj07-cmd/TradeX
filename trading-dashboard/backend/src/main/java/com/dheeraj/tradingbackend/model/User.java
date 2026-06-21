package com.dheeraj.tradingbackend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;
    private String email;
    private String password;
    private String role;
    private double balance;
    private double usedMargin;

    // Profile Information
    private String phoneNumber;
    private String panNumber;
    private String aadhaarNumber;
    private String dateOfBirth;
    private String address;
    private String nomineeName;

    // Bank Information
    private String bankAccountNumber;
    private String ifscCode;

    // Cloud Storage URLs (From Cloudinary/S3)
    private String panDocUrl;
    private String aadhaarFrontUrl;
    private String aadhaarBackUrl;

    // User Journey State Machine
    private KycStatus kycStatus = KycStatus.NOT_STARTED;
    private String adminRemarks;
    private boolean profileCompleted = false;
    private boolean documentsUploaded = false;
    private boolean kycVerified = false;        // True when Admin approves

    public User(String name, String email, String password, String role, double balance, double usedMargin) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.balance = balance;
        this.usedMargin = usedMargin;
    }
}
