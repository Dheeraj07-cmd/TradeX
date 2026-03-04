package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.OtpDetails;
import com.dheeraj.tradingbackend.repository.OtpRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(OtpRepository otpRepository, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    public void generateAndSendOtp(String email) {

        otpRepository.deleteByEmail(email);

        String otp = String.format("%06d", secureRandom.nextInt(999999));

        OtpDetails otpDetails = new OtpDetails(email, otp, LocalDateTime.now());
        otpRepository.save(otpDetails);

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e.getMessage());
        }
    }

    public boolean verifyOtp(String email, String userProvidedOtp) {

        Optional<OtpDetails> otpOpt = otpRepository.findByEmail(email);

        if (otpOpt.isPresent()) {
            OtpDetails storedOtp = otpOpt.get();

            if (storedOtp.getOtp().equals(userProvidedOtp)) {
                otpRepository.deleteByEmail(email);
                return true;
            }
        }

        return false;
    }
}