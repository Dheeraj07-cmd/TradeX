package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.*;
import com.dheeraj.tradingbackend.repository.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final HoldingRepository holdingRepository;
    private final PositionRepository positionRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    public OrderService(OrderRepository orderRepository,
                        HoldingRepository holdingRepository,
                        PositionRepository positionRepository,
                        SimpMessagingTemplate messagingTemplate,
                        UserRepository userRepository,
                        StringRedisTemplate redisTemplate) {
        this.orderRepository = orderRepository;
        this.holdingRepository = holdingRepository;
        this.positionRepository = positionRepository;
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
    }

    @Transactional
    public Order createOrder(Order order) {
        String userId = order.getUserId();
        String stock = order.getName();
        int qty = order.getQty();
        double price = order.getPrice();
        String mode = order.getMode();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Enforce KYC for ALL trades
        if (!user.isKycVerified()) {
            throw new IllegalStateException("KYC_RESTRICTION: You must complete identity verification to place trades.");
        }

        // Fetch Live Price from Redis cache
        if (price == 0) {
            Object livePriceObj = redisTemplate.opsForHash().get("live_prices", stock);
            if (livePriceObj == null) {
                throw new RuntimeException("Cannot find live market price for Market Order execution.");
            }
            price = Double.parseDouble(livePriceObj.toString());
            order.setPrice(price);
        }

        /* HOLDINGS LOGIC */
        Optional<Holding> holdingOpt = holdingRepository.findByUserIdAndName(userId, stock);

        if ("BUY".equalsIgnoreCase(mode)) {
            double totalCost = qty * price;

            if (user.getBalance() < totalCost) {
                throw new RuntimeException("Insufficient balance");
            }
            user.setBalance(user.getBalance() - totalCost);
            userRepository.save(user);

            if (holdingOpt.isPresent()) {
                Holding h = holdingOpt.get();

                int totalQty = h.getQty() + qty;
                double newAvg = ((h.getAvg() * h.getQty()) + (price * qty)) / totalQty;

                h.setQty(totalQty);
                h.setAvg(newAvg);
                h.setPrice(price);

                holdingRepository.save(h);
            } else {
                Holding h = new Holding();
                h.setUserId(userId);
                h.setName(stock);
                h.setQty(qty);
                h.setAvg(price);
                h.setPrice(price);

                holdingRepository.save(h);
            }
        }

        if ("SELL".equalsIgnoreCase(mode)) {
            Holding h = holdingOpt
                    .orElseThrow(() -> new RuntimeException("Holding not found for this stock"));

            if (h.getQty() < qty) {
                throw new RuntimeException("Not enough quantity to sell");
            }

            double totalSellValue = qty * price;
            user.setBalance(user.getBalance() + totalSellValue);
            userRepository.save(user);

            int remainingQty = h.getQty() - qty;
            if (remainingQty == 0) {
                holdingRepository.delete(h);
            } else {
                h.setQty(remainingQty);
                holdingRepository.save(h);
            }
        }

        /* POSITIONS LOGIC */
        Optional<Position> posOpt = positionRepository.findByUserIdAndName(userId, stock);

        if ("BUY".equalsIgnoreCase(mode)) {
            if (posOpt.isPresent()) {
                Position p = posOpt.get();

                int totalQty = p.getQty() + qty;
                double newAvg = ((p.getAvg() * p.getQty()) + (price * qty)) / totalQty;

                p.setQty(totalQty);
                p.setAvg(newAvg);
                p.setPrice(price);

                double pnl = (price - newAvg) * totalQty;
                p.setNet(String.format("%.2f", pnl));
                p.setDay(p.getNet());
                p.setLoss(pnl < 0);

                positionRepository.save(p);
            } else {
                Position p = new Position();
                p.setUserId(userId);
                p.setProduct("CNC");
                p.setName(stock);
                p.setQty(qty);
                p.setAvg(price);
                p.setPrice(price);
                p.setNet("0.00");
                p.setDay("0.00");
                p.setLoss(false);

                positionRepository.save(p);
            }
        }

        if ("SELL".equalsIgnoreCase(mode)) {
            Position p = posOpt
                    .orElseThrow(() -> new RuntimeException("Position not found for this stock"));

            if (p.getQty() < qty) {
                throw new RuntimeException("Not enough position quantity");
            }

            int remainingQty = p.getQty() - qty;

            if (remainingQty == 0) {
                positionRepository.delete(p);
            } else {
                p.setQty(remainingQty);
                p.setPrice(price);

                double unrealized = (price - p.getAvg()) * remainingQty;

                p.setNet(String.format("%.2f", unrealized));
                p.setDay(p.getNet());
                p.setLoss(unrealized < 0);

                positionRepository.save(p);
            }
        }

        // Push Live Updates for Holdings, Positions, and Account Margin
        List<Holding> updatedHoldings = holdingRepository.findByUserId(userId);
        messagingTemplate.convertAndSend("/topic/holdings/" + userId, updatedHoldings);

        List<Position> updatedPositions = positionRepository.findByUserId(userId);
        messagingTemplate.convertAndSend("/topic/positions/" + userId, updatedPositions);

        messagingTemplate.convertAndSend("/topic/margin/" + userId, user.getBalance());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        order.setOrderDate(LocalDateTime.now().format(formatter));

        return orderRepository.save(order);
    }

    /* REALIZED P&L (ORDERS) */
    public double calculateRealizedPnl(String userId) {
        List<Order> orders = orderRepository.findByUserId(userId);

        Map<String, Integer> qtyMap = new HashMap<>();
        Map<String, Double> avgMap = new HashMap<>();

        double realizedPnl = 0;

        for (Order o : orders) {
            String stock = o.getName();

            if ("BUY".equalsIgnoreCase(o.getMode())) {
                int prevQty = qtyMap.getOrDefault(stock, 0);
                double prevAvg = avgMap.getOrDefault(stock, 0.0);

                int newQty = prevQty + o.getQty();
                double newAvg = ((prevAvg * prevQty) + (o.getPrice() * o.getQty())) / newQty;

                qtyMap.put(stock, newQty);
                avgMap.put(stock, newAvg);
            }

            if ("SELL".equalsIgnoreCase(o.getMode())) {
                double avg = avgMap.getOrDefault(stock, 0.0);
                realizedPnl += (o.getPrice() - avg) * o.getQty();

                qtyMap.put(stock, qtyMap.get(stock) - o.getQty());
            }
        }

        return realizedPnl;
    }

    /* UNREALIZED P&L (ORDERS) */
    public double calculateUnrealizedPnl(String userId) {
        List<Position> positions = positionRepository.findByUserId(userId);
        double total = 0;

        for (Position p : positions) {
            double pnl = (p.getPrice() - p.getAvg()) * p.getQty();
            total += pnl;
        }
        return total;
    }

    public List<Order> getOrdersByUserId(String userId) {
        return orderRepository.findByUserId(userId);
    }
}