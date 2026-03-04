package com.dheeraj.tradingbackend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "otps")
public class OtpDetails {

        @Id
        private String id;

        private String email;

        private String otp;


        @Indexed(expireAfter = "300s")
        private LocalDateTime createdAt;

        public OtpDetails() {}

        public OtpDetails(String email, String otp, LocalDateTime createdAt) {
            this.email = email;
            this.otp = otp;
            this.createdAt = createdAt;
        }

        public String getId() {
            return id;
        }

        public String getEmail() {
            return email;
        }

        public String getOtp() {
            return otp;
        }

        public LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setId(String id) {
            this.id = id;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public void setOtp(String otp) {
            this.otp = otp;
        }

        public void setCreatedAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
}

