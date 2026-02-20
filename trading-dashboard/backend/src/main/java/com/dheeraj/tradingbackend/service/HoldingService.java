package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.Holding;
import com.dheeraj.tradingbackend.repository.HoldingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HoldingService {

    private final HoldingRepository holdingRepository;

    public HoldingService(HoldingRepository holdingRepository) {

        this.holdingRepository = holdingRepository;
    }

    public List<Holding> getHoldingsByUserId(String userId) {

        return holdingRepository.findByUserId(userId);
    }

    public double calculateUnrealizedPnl(String userId) {

        List<Holding> holdings = holdingRepository.findByUserId(userId);
        double unrealizedPnl = 0;

        for (Holding h : holdings) {
            unrealizedPnl += (h.getPrice() - h.getAvg()) * h.getQty();
        }

        return unrealizedPnl;
    }

}
