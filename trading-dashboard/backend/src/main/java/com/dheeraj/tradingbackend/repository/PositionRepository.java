package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.Position;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PositionRepository extends MongoRepository<Position, String> {
    Optional<Position> findByUserIdAndName(String userId, String name);
    List<Position> findByUserId(String userId);
}

