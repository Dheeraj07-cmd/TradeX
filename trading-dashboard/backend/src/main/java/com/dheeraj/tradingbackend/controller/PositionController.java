package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Position;
import com.dheeraj.tradingbackend.service.PositionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@CrossOrigin
public class PositionController {

    private final PositionService positionService;
    private final StringRedisTemplate redisTemplate;

    public PositionController(PositionService positionService, StringRedisTemplate redisTemplate) {
        this.positionService = positionService;
        this.redisTemplate = redisTemplate;
    }

    @GetMapping
    public List<Position> getPositions(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        List<Position> positions = positionService.getPositionsByUserId(userId);

        applyLivePrices(positions);

        return positions;
    }

    private void applyLivePrices(List<Position> positions) {
        for (Position position : positions) {
            String redisKey = "live_price:" + position.getName();
            String livePrice = redisTemplate.opsForValue().get(redisKey);

            if (livePrice != null) {
                try {
                    double latestPrice = Double.parseDouble(livePrice);
                    position.setPrice(latestPrice);

                    double unrealizedPnl = (latestPrice - position.getAvg()) * position.getQty();
                    position.setNet(String.format("%.2f", unrealizedPnl));
                    position.setDay(position.getNet());
                    position.setLoss(unrealizedPnl < 0);
                } catch (Exception ignored) {}
            }
        }
    }
}