package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.OtpDetails;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OtpRepository extends MongoRepository<OtpDetails, String> {

    Optional<OtpDetails> findByEmail(String email);

    void deleteByEmail(String email);

}