package com.dheeraj.tradingbackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class CloudinaryStorageService {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String keySecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", keySecret,
                "secure", true
        ));
    }

    public String uploadDocument(MultipartFile file, String documentType, String userId) {
        try {
            // By using "PAN_user123", Cloudinary will auto-delete the old one and overwrite it
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "tradex_kyc/" + userId,
                    "public_id", documentType + "_" + userId,
                    "overwrite", true
            ));
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            throw new RuntimeException("Cloud storage upload failed: " + e.getMessage());
        }
    }
}