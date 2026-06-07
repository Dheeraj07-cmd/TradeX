package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.model.NewsArticle;
import com.dheeraj.tradingbackend.repository.NewsRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class NewsGeneratorService {

    private final ChatClient chatClient;
    private final NewsRepository newsRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MarketSimulatorService marketSimulatorService;

    // Update the record to include a numeric score
    record AiNewsResponse(String headline, String summary, String sentimentLabel, int sentimentScore) {
    }

    public NewsGeneratorService(ChatClient.Builder chatClientBuilder,
                                NewsRepository newsRepository,
                                SimpMessagingTemplate messagingTemplate,
                                MarketSimulatorService marketSimulatorService) {
        this.chatClient = chatClientBuilder.build();
        this.newsRepository = newsRepository;
        this.messagingTemplate = messagingTemplate;
        this.marketSimulatorService = marketSimulatorService;
    }

    // Wake up after every 15 minutes to analyze market and publish news
    @Scheduled(fixedRate = 900000)
//    @Scheduled(fixedRate = 30000)
    public void generateMarketNews() {
        try {
            // Fetch live stock data from simulation state
            Map<String, Object> marketState = marketSimulatorService.getHighestMovingStockContext();

            if (marketState == null || marketState.isEmpty()) {
                System.out.println("Market stable. Skipping news cycle.");
                return;
            }

            String symbol = (String) marketState.get("symbol");
            double priceChange = (double) marketState.get("priceChange");
            double marketBias = (double) marketState.get("marketBias");
            double currentPrice = (double) marketState.get("currentPrice");

            // Translate order book metrics into professional trading commentary
            String orderFlowContext = marketBias > 1.05 ? "substantial institutional accumulation and aggressive buy-side order book depth"
                    : marketBias < 0.95 ? "heavy sell-side distribution patterns and block-trade liquidations"
                    : "steady retail matching engine liquidity with nominal spread volatility";

            BeanOutputConverter<AiNewsResponse> converter = new BeanOutputConverter<>(AiNewsResponse.class);

            // Prepare a financial prompt
            String promptText = String.format("""
                    Act as an elite senior financial journalist for Bloomberg News.
                    Write a brief, sharp market update based on this live transactional data.
                    
                    Ticker Symbol: %s
                    Last Traded Price: %.2f
                    Session Net Percentage Change: %.2f%%
                    Order Book Imbalance Profile: %s
                    
                    Instructions:
                    - Do not mention that this is a simulation.
                    - Use precise Wall Street terminology.
                    - Capped the summary field at two brief sentences.
                    - Provide a sentimentLabel (e.g., STRONGLY BULLISH, BULLISH, NEUTRAL, BEARISH).
                    - Provide an integer sentimentScore between 0 and 100 based on the price change and market bias.
                    
                    %s
                    """, symbol, currentPrice, priceChange, orderFlowContext, converter.getFormat());

            // Query the LLM
            String aiResponse = chatClient.prompt()
                    .user(promptText)
                    .call()
                    .content();

            AiNewsResponse structuredData = converter.convert(aiResponse);

            // Create and persist the database record
            NewsArticle article = new NewsArticle();
            article.setSymbol(symbol);
            article.setHeadline(structuredData.headline());
            article.setSummary(structuredData.summary());
            article.setSentimentLabel(structuredData.sentimentLabel());
            article.setSentimentScore(structuredData.sentimentScore());
            article.setTimestamp(Instant.now().toEpochMilli());

            newsRepository.save(article);

            // Fire across the WebSocket Broker instantly
            messagingTemplate.convertAndSend("/topic/news/" + symbol, article);
            messagingTemplate.convertAndSend("/topic/globalNews", article);

            System.out.println("AI News Broadcasted for: " + symbol + " (" + priceChange + "%)");
        } catch (Exception e) {
            System.err.println("⚠️ News engine skipped: " + e.getMessage());
        }
    }
}