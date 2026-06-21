package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.dto.UserProfileDto;
import com.dheeraj.tradingbackend.model.KycStatus;
import com.dheeraj.tradingbackend.model.User;
import com.dheeraj.tradingbackend.repository.UserRepository;
import com.dheeraj.tradingbackend.service.CloudinaryStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final CloudinaryStorageService cloudinaryService;

    @GetMapping
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");

        if (userId == null || userId.contains("@")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid Token Structure. Please clear your browser cache, log out, and log back in.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User profile session not found."));

        return ResponseEntity.ok(convertToDto(user));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody User profileUpdate, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");

        if (userId == null || userId.contains("@")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Token.");
        }

        User user = userRepository.findById(userId).orElseThrow();

        user.setPhoneNumber(profileUpdate.getPhoneNumber());
        user.setDateOfBirth(profileUpdate.getDateOfBirth());
        user.setAddress(profileUpdate.getAddress());
        user.setNomineeName(profileUpdate.getNomineeName());
        user.setBankAccountNumber(profileUpdate.getBankAccountNumber());
        user.setIfscCode(profileUpdate.getIfscCode());

        if (user.getKycStatus() == KycStatus.NOT_STARTED || user.getKycStatus() == KycStatus.REJECTED) {
            user.setPanNumber(profileUpdate.getPanNumber());
            user.setAadhaarNumber(profileUpdate.getAadhaarNumber());
        }

        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank() &&
                user.getPanNumber() != null && !user.getPanNumber().isBlank() &&
                user.getAadhaarNumber() != null && !user.getAadhaarNumber().isBlank()) {
            user.setProfileCompleted(true);
        }

        return ResponseEntity.ok(convertToDto(userRepository.save(user)));
    }

    @PostMapping("/upload-docs")
    public ResponseEntity<?> uploadKycDocuments(@RequestParam("panCard") MultipartFile panCard, @RequestParam("aadhaarFront") MultipartFile aadhaarFront, @RequestParam("aadhaarBack") MultipartFile aadhaarBack, HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        if (userId == null || userId.contains("@")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Token.");
        }

        User user = userRepository.findById(userId).orElseThrow();

        if (!user.isProfileCompleted()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Must complete Level 1 Profile before uploading documents.");
        }

        try {
            // Send files to Cloudinary and get URLs back
            String panUrl = cloudinaryService.uploadDocument(panCard, "PAN", userId);
            String aadharFrontUrl = cloudinaryService.uploadDocument(aadhaarFront, "AADHAAR_FRONT", userId);
            String aadharBackUrl = cloudinaryService.uploadDocument(aadhaarBack, "AADHAAR_BACK", userId);

            user.setPanDocUrl(panUrl);
            user.setAadhaarFrontUrl(aadharFrontUrl);
            user.setAadhaarBackUrl(aadharBackUrl);

            user.setDocumentsUploaded(true);
            user.setKycStatus(KycStatus.PENDING_REVIEW);

            return ResponseEntity.ok(convertToDto(userRepository.save(user)));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload documents to cloud storage: " + e.getMessage());
        }
    }

    @PutMapping("/admin/review/{userId}")
    public ResponseEntity<User> adminReviewWorkflow(
            @PathVariable String userId,
            @RequestParam KycStatus targetStatus,
            @RequestParam(required = false) String remarks) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Target user identity doesn't exist."));

        user.setKycStatus(targetStatus);
        user.setAdminRemarks(remarks);

        if (targetStatus == KycStatus.APPROVED) {
            user.setKycVerified(true);
        } else if (targetStatus == KycStatus.REJECTED) {
            user.setKycVerified(false);
            user.setDocumentsUploaded(false);
        }

        return ResponseEntity.ok(userRepository.save(user));
    }

    private UserProfileDto convertToDto(User user) {
        return new UserProfileDto(
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getNomineeName(),
                maskIdentifier(user.getPanNumber(), 5, 1),
                maskIdentifier(user.getAadhaarNumber(), 0, 4),
                user.getBankAccountNumber(),
                user.getIfscCode(),
                user.getBalance(),
                user.getKycStatus(),
                user.getAdminRemarks(),
                user.getPanDocUrl(),
                user.getAadhaarFrontUrl(),
                user.getAadhaarBackUrl()
        );
    }

    private String maskIdentifier(String rawValue, int visiblePrefix, int visibleSuffix) {
        if (rawValue == null || rawValue.isBlank()) return "Not Provided";
        if (rawValue.length() <= (visiblePrefix + visibleSuffix)) return rawValue;

        StringBuilder masked = new StringBuilder();
        for (int i = 0; i < rawValue.length(); i++) {
            if (i < visiblePrefix || i >= (rawValue.length() - visibleSuffix)) {
                masked.append(rawValue.charAt(i));
            } else {
                masked.append(rawValue.charAt(i) == '-' ? '-' : 'X');
            }
        }
        return masked.toString();
    }
}