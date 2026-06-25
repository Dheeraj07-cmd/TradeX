package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.dto.PasswordChangeRequest;
import com.dheeraj.tradingbackend.dto.UpdateProfileRequest;
import com.dheeraj.tradingbackend.dto.UserProfileDto;
import com.dheeraj.tradingbackend.model.KycStatus;
import com.dheeraj.tradingbackend.model.User;
import com.dheeraj.tradingbackend.repository.UserRepository;
import com.dheeraj.tradingbackend.service.CloudinaryStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/user/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final CloudinaryStorageService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null || userId.contains("@")) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid Token.");

        User user = userRepository.findById(userId).orElseThrow();
        return ResponseEntity.ok(convertToDto(user));
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest profileUpdate, HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User user = userRepository.findById(userId).orElseThrow();

        user.setName(profileUpdate.getName());
        user.setAddress(profileUpdate.getAddress());
        user.setNomineeName(profileUpdate.getNomineeName());

        // Date Validation (YYYY-MM-DD)
        String dob = profileUpdate.getDateOfBirth();
        if (dob != null && !dob.isBlank()) {
            try {
                LocalDate.parse(dob);
                user.setDateOfBirth(dob);
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body("Invalid Date of Birth format. Use YYYY-MM-DD.");
            }
        }

        // Phone Validation
        String phone = profileUpdate.getPhoneNumber();
        if (phone != null && !phone.isBlank()) {
            if (!phone.matches("^[6-9]\\d{9}$")) return ResponseEntity.badRequest().body("Invalid Indian Phone Number.");
            user.setPhoneNumber(phone);
        }

        // Bank Validation
        String bankAcc = profileUpdate.getBankAccountNumber();
        if (bankAcc != null && !bankAcc.isBlank()) {
            if (!bankAcc.matches("^[0-9]{9,18}$")) return ResponseEntity.badRequest().body("Invalid Bank Account Number.");
            user.setBankAccountNumber(bankAcc);
        }

        // IFSC Validation
        String ifsc = profileUpdate.getIfscCode();
        if (ifsc != null && !ifsc.isBlank()) {
            if (!ifsc.matches("^[A-Z]{4}0[A-Z0-9]{6}$")) return ResponseEntity.badRequest().body("Invalid IFSC Code.");
            user.setIfscCode(ifsc.toUpperCase());
        }

        // Identity Validation
        if (user.getKycStatus() == KycStatus.NOT_STARTED || user.getKycStatus() == KycStatus.REJECTED) {

            String pan = profileUpdate.getPanNumber();
            if (pan != null && !pan.isBlank()) {
                // If doesn't match format, reject it. This drops masked values like ABCDEXXXXF.
                if (!pan.matches("^[A-Z]{5}[0-9]{4}[A-Z]{1}$")) {
                    return ResponseEntity.badRequest().body("Invalid PAN Format.");
                }
                user.setPanNumber(pan.toUpperCase());
            }

            String aadhaar = profileUpdate.getAadhaarNumber();
            if (aadhaar != null && !aadhaar.isBlank()) {
                // Strictly require exactly 12 digits. This drops masked values like XXXXXXXX1234.
                if (!aadhaar.matches("^\\d{12}$")) {
                    return ResponseEntity.badRequest().body("Invalid National ID Format. Must be exactly 12 digits.");
                }
                user.setAadhaarNumber(aadhaar);
            }
        }

        // Profile Completion
        boolean isComplete =
                user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank() &&
                        user.getPanNumber() != null && !user.getPanNumber().isBlank() &&
                        user.getAadhaarNumber() != null && !user.getAadhaarNumber().isBlank() &&
                        user.getBankAccountNumber() != null && !user.getBankAccountNumber().isBlank() &&
                        user.getIfscCode() != null && !user.getIfscCode().isBlank() &&
                        user.getAddress() != null && !user.getAddress().isBlank();

        user.setProfileCompleted(isComplete);

        return ResponseEntity.ok(convertToDto(userRepository.save(user)));
    }

    @PostMapping("/upload-docs")
    public ResponseEntity<?> uploadKycDocuments(
            @RequestParam("panCard") MultipartFile panCard,
            @RequestParam("aadhaarFront") MultipartFile aadhaarFront,
            @RequestParam("aadhaarBack") MultipartFile aadhaarBack,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User user = userRepository.findById(userId).orElseThrow();

        if (!user.isProfileCompleted()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Must complete Level 1 Profile before uploading documents.");
        }

        List<String> allowedTypes = List.of("image/jpeg", "image/png", "application/pdf");
        if (!allowedTypes.contains(panCard.getContentType()) ||
                !allowedTypes.contains(aadhaarFront.getContentType()) ||
                !allowedTypes.contains(aadhaarBack.getContentType())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid document format. Only JPG, PNG, and PDF are allowed.");
        }

        try {
            // Cloudinary automatically deletes the old file
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

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody PasswordChangeRequest request, HttpServletRequest httpRequest) {
        String userId = (String) httpRequest.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        User user = userRepository.findById(userId).orElseThrow();

        // Verify Old Password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password is incorrect.");
        }

        // Password Complexity Validation should contain(8+ char, Upper, Lower, Number)
        String newPass = request.getNewPassword();
        if (!newPass.matches("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.");
        }

        user.setPassword(passwordEncoder.encode(newPass));
        userRepository.save(user);

        return ResponseEntity.ok("Password updated successfully.");
    }

    private UserProfileDto convertToDto(User user) {
        boolean hasPan = user.getPanNumber() != null && !user.getPanNumber().isBlank();
        boolean hasAadhaar = user.getAadhaarNumber() != null && !user.getAadhaarNumber().isBlank();

        return new UserProfileDto(
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getNomineeName(),
                user.getDateOfBirth(),
                maskIdentifier(user.getPanNumber(), 5, 1),
                hasPan,
                maskIdentifier(user.getAadhaarNumber(), 0, 4),
                hasAadhaar,
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
        if (rawValue == null || rawValue.isBlank()) return "";
        if (rawValue.length() <= (visiblePrefix + visibleSuffix)) return rawValue;

        StringBuilder masked = new StringBuilder();
        for (int i = 0; i < rawValue.length(); i++) {
            if (i < visiblePrefix || i >= (rawValue.length() - visibleSuffix)) {
                masked.append(rawValue.charAt(i));
            } else {
                masked.append('X');
            }
        }
        return masked.toString();
    }
}