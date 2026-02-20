package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Order;
import com.dheeraj.tradingbackend.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order, HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");

        order.setUserId(userId);
        return orderService.createOrder(order);
    }

    @GetMapping
    public List<Order> getOrders(HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");
        return orderService.getOrdersByUserId(userId);
    }

    @GetMapping("/pnl")
    public double getRealizedPnl(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return orderService.calculateRealizedPnl(userId);
    }

    @GetMapping("/unrealized")
    public double getUnrealizedPnl(HttpServletRequest request) {
        String userId = (String) request.getAttribute("userId");
        return orderService.calculateUnrealizedPnl(userId);
    }


}
