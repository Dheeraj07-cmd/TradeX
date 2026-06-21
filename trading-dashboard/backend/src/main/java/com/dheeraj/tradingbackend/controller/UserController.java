package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.User;
import com.dheeraj.tradingbackend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.dheeraj.tradingbackend.dto.FundsRequest;
import com.dheeraj.tradingbackend.model.FundTransaction;
import com.dheeraj.tradingbackend.repository.FundTransactionRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import java.time.LocalDateTime;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Value("${razorpay.api.key}")
    String keyId;
    @Value("${razorpay.key.secret}")
    String keySecret;

    private final UserRepository userRepository;
    private final FundTransactionRepository transactionRepository;

    public UserController(UserRepository userRepository, FundTransactionRepository transactionRepository) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
    }

    @PostMapping("/funds")
    public ResponseEntity<?> updateFunds(@RequestBody FundsRequest fundsRequest, HttpServletRequest request) {
        try {
            String userId = (String) request.getAttribute("userId");
            double amount = fundsRequest.getAmount();
            String action = fundsRequest.getAction().toUpperCase(); // deposit or withdraw

            User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            if (!user.isKycVerified()) {
                throw new IllegalStateException("KYC_RESTRICTION: You must complete identity verification to place trades.");
            }

            FundTransaction txn = new FundTransaction();
            txn.setUserId(userId);
            txn.setType(action);
            txn.setAmount(amount);
            txn.setTxnId("TXN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
            txn.setDate(LocalDateTime.now().format(formatter));

            if ("DEPOSIT".equals(action)) {
                user.setBalance(user.getBalance() + amount);
                txn.setStatus("SUCCESS");
            } else if ("WITHDRAW".equals(action)) {
                if (user.getBalance() < amount) {
                    txn.setStatus("FAILED");
                    transactionRepository.save(txn);
                    return ResponseEntity.status(400).body("Insufficient balance for withdrawal.");
                }
                user.setBalance(user.getBalance() - amount);
                txn.setStatus("SUCCESS");
            } else {
                return ResponseEntity.status(400).body("Invalid action.");
            }

            userRepository.save(user);
            transactionRepository.save(txn);
            return ResponseEntity.ok(Map.of(
                    "message", action + " successful!",
                    "newBalance", user.getBalance()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing transaction: " + e.getMessage());
        }
    }

    @PostMapping("/funds/create-razorpay-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody FundsRequest request) {
        try {
            int amountInPaise = (int) (request.getAmount() * 100);

            RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);

            return ResponseEntity.ok(Map.of(
                    "orderId", order.get("id"),
                    "amount", order.get("amount")
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating Razorpay order: " + e.getMessage());
        }
    }

    @GetMapping("/funds/history")
    public ResponseEntity<?> getTransactionHistory(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        List<FundTransaction> history = transactionRepository.findByUserIdOrderByDateDesc(userId);
        return ResponseEntity.ok(history);
    }
}