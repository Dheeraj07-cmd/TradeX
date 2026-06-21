package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.KycStatus;
import com.dheeraj.tradingbackend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);
    List<User> findByKycStatus(KycStatus kycStatus);
}
