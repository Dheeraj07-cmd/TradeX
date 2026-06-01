package com.dheeraj.tradingbackend.model;

import jdk.jfr.Name;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Document(collection = "otps")
public class OtpDetails {

    @Id
    private String id;
    private String email;
    private String otp;


    @Indexed(expireAfter = "300s")
    private LocalDateTime createdAt;

    public OtpDetails(String email, String otp, LocalDateTime createdAt) {
        this.email = email;
        this.otp = otp;
        this.createdAt = createdAt;
    }

}

