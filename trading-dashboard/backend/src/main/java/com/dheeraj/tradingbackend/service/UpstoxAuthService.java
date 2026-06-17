package com.dheeraj.tradingbackend.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.upstox.ApiClient;
import com.upstox.Configuration;
import com.upstox.auth.OAuth;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class UpstoxAuthService {

    @Value("${upstox.api-key}")
    private String apiKey;

    @Value("${upstox.api-secret}")
    private String apiSecret;

    @Value("${upstox.redirect-uri}")
    private String redirectUri;

    private static final String REDIS_TOKEN_KEY = "upstox:access_token";
    private static final Gson GSON = new Gson();
    private final StringRedisTemplate redisTemplate;

    public void generateAndSetAccessToken(String authCode) {
        try {
            OkHttpClient client = new OkHttpClient();

            // Builds and encodes-URL payload automatically
            RequestBody body = new FormBody.Builder()
                    .add("code", authCode)
                    .add("client_id", apiKey)
                    .add("client_secret", apiSecret)
                    .add("redirect_uri", redirectUri)
                    .add("grant_type", "authorization_code")
                    .build();

            Request request = new Request.Builder()
                    .url("https://api.upstox.com/v2/login/authorization/token")
                    .post(body)
                    .addHeader("Accept", "application/json")
                    .addHeader("Api-Version", "2.0")
                    .build();

            try (Response response = client.newCall(request).execute()) {
                ResponseBody responseBodyObj = response.body();

                if (responseBodyObj == null) {
                    System.err.println("❌ Upstox Auth: Empty response body");
                    return;
                }

                String responseBody = responseBodyObj.string();
                JsonObject jsonObject = GSON.fromJson(responseBody, JsonObject.class);

                if (jsonObject.has("access_token")) {
                    String token = jsonObject.get("access_token").getAsString();
                    redisTemplate.opsForValue().set(REDIS_TOKEN_KEY, token, 24, TimeUnit.HOURS);
                    applyTokenToGlobalClient(token);
                    System.out.println("Upstox Authentication Successful. Token saved to Redis.");
                } else {
                    System.err.println("❌ Upstox Auth Failed. Response: " + responseBody);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Upstox Auth Exception: " + e.getMessage());
        }
    }

    public String getAccessToken() {
        return redisTemplate.opsForValue().get(REDIS_TOKEN_KEY);
    }

    public void applyTokenToGlobalClient(String token) {
        if (token != null) {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            OAuth oauth = (OAuth) defaultClient.getAuthentication("OAUTH2");
            oauth.setAccessToken(token);
        }
    }
}