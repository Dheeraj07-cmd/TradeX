package com.dheeraj.tradingbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TradingbackendApplication {

    public static void main(String[] args) {

        SpringApplication.run(TradingbackendApplication.class, args);
    }

}
