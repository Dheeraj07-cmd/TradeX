package com.dheeraj.tradingbackend.repository;

import com.dheeraj.tradingbackend.model.FundTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FundTransactionRepository extends MongoRepository<FundTransaction, String> {

    List<FundTransaction> findByUserIdOrderByDateDesc(String userId);
}