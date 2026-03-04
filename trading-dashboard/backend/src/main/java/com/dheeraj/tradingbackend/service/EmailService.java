package com.dheeraj.tradingbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    public void sendOtpEmail(String toEmail, String otp) {
        
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://api.brevo.com/v3/smtp/email";

        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);
        headers.set("accept", "application/json");

        //  Email
        String htmlContent = """
        <div style="font-family:Arial;background:#f4f6f8;padding:30px">
            <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;text-align:center">
            <h2 style="color:#387ed1">TradeX Email Verification</h2>
            <p>Use the OTP below to verify your email.</p>
            <h1 style="letter-spacing:6px">%s</h1>
            <p>This OTP will expire in <b>5 minutes</b>.</p>
            <p style="color:gray;font-size:12px">Do not share this code with anyone.</p>
            </div>
        </div>
        """.formatted(otp);

        
        Map<String, Object> body = Map.of(
                "sender", Map.of("name", "TradeX", "email", senderEmail),
                "to", List.of(Map.of("email", toEmail)),
                "subject", "TradeX Email Verification OTP",
                "htmlContent", htmlContent
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        
        try {
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("Success! OTP sent to " + toEmail + " via Brevo API");
        } catch (Exception e) {
            System.err.println("Brevo API Failed: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email via API");
        }
    }
}