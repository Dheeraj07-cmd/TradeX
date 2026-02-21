package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Holding;
import com.dheeraj.tradingbackend.service.HoldingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holdings")
@CrossOrigin
public class HoldingController {

    private final HoldingService holdingService;

    public HoldingController(HoldingService holdingService) {
        this.holdingService = holdingService;
    }

    //  JWT-based holdings fetch
    @GetMapping
    public List<Holding> getHoldings(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return holdingService.getHoldingsByUserId(userId);
    }

    //  JWT-based unrealized P&L
    @GetMapping("/pnl")
    public double getUnrealizedPnl(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return holdingService.calculateUnrealizedPnl(userId);
    }
}




