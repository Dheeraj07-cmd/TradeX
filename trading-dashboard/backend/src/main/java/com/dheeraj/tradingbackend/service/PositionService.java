package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.Position;
import com.dheeraj.tradingbackend.repository.PositionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PositionService {

    private final PositionRepository positionRepository;

    public PositionService(PositionRepository positionRepository) {

        this.positionRepository = positionRepository;
    }

    public List<Position> getPositionsByUserId(String userId) {

        return positionRepository.findByUserId(userId);
    }
}
