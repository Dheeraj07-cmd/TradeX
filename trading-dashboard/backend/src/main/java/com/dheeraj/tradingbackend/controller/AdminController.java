package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.KycStatus;
import com.dheeraj.tradingbackend.model.User;
import com.dheeraj.tradingbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    // Fetch all users waiting for KYC Verification
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @GetMapping("/kyc-pending")
    public ResponseEntity<List<User>> getPendingKycUsers() {
        List<User> pendingUsers = userRepository.findByKycStatus(KycStatus.PENDING_REVIEW);
        return ResponseEntity.ok(pendingUsers);
    }

    // Approve or Reject the User
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/kyc-review/{userId}")
    public ResponseEntity<User> reviewKyc(
            @PathVariable String userId,
            @RequestParam KycStatus status,
            @RequestParam(required = false) String remarks) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setKycStatus(status);
        user.setAdminRemarks(remarks);

        if (status == KycStatus.APPROVED) {
            user.setKycVerified(true);
        } else if (status == KycStatus.REJECTED) {
            user.setKycVerified(false);
            user.setDocumentsUploaded(false); // Resets so they can upload new files
        }

        return ResponseEntity.ok(userRepository.save(user));
    }
}