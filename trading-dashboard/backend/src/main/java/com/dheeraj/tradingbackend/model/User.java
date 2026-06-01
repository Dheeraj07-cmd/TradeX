package com.dheeraj.tradingbackend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;
    private String email;
    private String password;
    private String role;
    private double balance;
    private double usedMargin;

    public User(String name, String email, String password, String role,double balance, double usedMargin) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.balance = balance;
        this.usedMargin = usedMargin;
    }

}

