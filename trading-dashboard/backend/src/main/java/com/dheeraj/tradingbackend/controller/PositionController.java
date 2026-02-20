package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.model.Position;
import com.dheeraj.tradingbackend.repository.PositionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@CrossOrigin
public class PositionController {

    private final PositionRepository positionRepository;

    public PositionController(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    @GetMapping
    public List<Position> getPositions(HttpServletRequest request) {

        String userId = (String) request.getAttribute("userId");

        return positionRepository.findByUserId(userId);
    }
}

