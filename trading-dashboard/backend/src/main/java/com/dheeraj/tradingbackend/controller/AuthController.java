package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.dto.LoginRequest;
import com.dheeraj.tradingbackend.model.User;
import com.dheeraj.tradingbackend.security.JwtUtil;
import com.dheeraj.tradingbackend.service.UserService;
import com.dheeraj.tradingbackend.service.OtpService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, OtpService otpService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {


        String name = payload.get("name");
        String email = payload.get("email");
        String password = payload.get("password");
        String otp = payload.get("otp");


        if (name == null || email == null || password == null || otp == null ||
                name.isEmpty() || email.isEmpty() || password.isEmpty() || otp.isEmpty()) {
            return ResponseEntity.badRequest().body("All fields (name, email, password, otp) are required");
        }


        if (userService.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email is already registered");
        }

        boolean isValidOtp = otpService.verifyOtp(email, otp);
        if (!isValidOtp) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired OTP");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password);
        user.setRole("ROLE_USER");

        userService.saveUser(user);

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userService.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        User user = userOpt.get();

        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());

        if (!passwordMatches) {
            return ResponseEntity.status(401).body("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(
                java.util.Map.of("token", token,"userId", user.getId(),"username", user.getName())
        );
    }
}
