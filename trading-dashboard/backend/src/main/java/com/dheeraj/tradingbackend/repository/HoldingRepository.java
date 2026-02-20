package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.Holding;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface HoldingRepository extends MongoRepository<Holding, String> {

    List<Holding> findByUserId(String userId);

    Optional<Holding> findByUserIdAndName(String userId, String name);
}
