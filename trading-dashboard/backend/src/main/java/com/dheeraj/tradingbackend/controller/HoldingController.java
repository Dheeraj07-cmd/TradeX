package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Holding;
import com.dheeraj.tradingbackend.service.HoldingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@CrossOrigin
public class HoldingController {
    private final HoldingService holdingService;
    private final StringRedisTemplate redisTemplate;

    public HoldingController(HoldingService holdingService, StringRedisTemplate redisTemplate) {
        this.holdingService = holdingService;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public List<Holding> getHoldings(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        List<Holding> holdings = holdingService.getHoldingsByUserId(userId);

        for (Holding h : holdings) {
            Object redisPriceObj = redisTemplate.opsForHash().get("live_prices", h.getName());
            if (redisPriceObj != null) {
                h.setPrice(Double.parseDouble(redisPriceObj.toString()));
            }
        }

        return holdings;
    }

    @GetMapping("/pnl")
    public double getUnrealizedPnl(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return holdingService.calculateUnrealizedPnl(userId);
    }
}