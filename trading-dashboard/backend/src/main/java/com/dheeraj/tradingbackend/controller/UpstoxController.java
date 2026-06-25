package com.dheeraj.tradingbackend.controller;

import com.dheeraj.tradingbackend.service.UpstoxAuthService;
import com.dheeraj.tradingbackend.service.UpstoxLiveMarketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/upstox")
@RequiredArgsConstructor
public class UpstoxController {

    private final UpstoxAuthService authService;
    private final UpstoxLiveMarketService liveMarketService;
    // https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=<UPSTOX_API_KEY>&redirect_uri=https://tradex-backend-kd5w.onrender.com/api/upstox/callback
    // This endpoint catches the redirect from Upstox login page
    @GetMapping("/callback")
    public ResponseEntity<String> handleUpstoxCallback(@RequestParam("code") String authCode) {
        System.out.println("Received Auth Code from Upstox");

        // Only valid for 24 hours after that regenerate
        authService.generateAndSetAccessToken(authCode);

        liveMarketService.initializeLiveStream();

        // Show a success message in the browser window
        String htmlResponse = """
                <html>
                    <body style="background-color: #121212; color: #4caf50; font-family: sans-serif; text-align: center; padding-top: 50px;">
                        <h2>✅ Upstox Authentication Successful!</h2>
                        <p style="color: #fff;">The live market feed has been started. You can close this window and return to your TradeX dashboard.</p>
                    </body>
                </html>
                """;

        return ResponseEntity.ok(htmlResponse);
    }
}