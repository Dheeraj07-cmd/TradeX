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

    // items for the LLM mapping
    public record GenAiNewsItem(String symbol, String headline, String summary, String sentimentLabel, int sentimentScore) { }

    // Top-level wrapper that the LLM will fill as a JSON array
    public record MarketNewsBatch(List<GenAiNewsItem> articles) { }

    public NewsGeneratorService(ChatClient.Builder chatClientBuilder,
                                NewsRepository newsRepository,
                                SimpMessagingTemplate messagingTemplate,
                                MarketSimulatorService marketSimulatorService) {
        this.chatClient = chatClientBuilder.build();
        this.newsRepository = newsRepository;
        this.messagingTemplate = messagingTemplate;
        this.marketSimulatorService = marketSimulatorService;
    }

    //   @Scheduled(fixedRate = 30000)
    @Scheduled(fixedRate = 1800000) // Triggers every 30 minutes
    public void generateMarketNewsBatch() {
        try {
            // Retrieve list of actively moving stocks
            List<Map<String, Object>> activeStocks = marketSimulatorService.getTopMovingStocksContext(50);

            if (activeStocks == null || activeStocks.isEmpty()) {
                System.out.println("Market conditions stable. Skipping batch news cycle.");
                return;
            }

            // Build a matrix block for the prompt
            StringBuilder marketContextBuilder = new StringBuilder();
            for (Map<String, Object> stock : activeStocks) {
                marketContextBuilder.append(String.format(
                        "Ticker: %s | Price: %.2f | Change: %.2f%% | Bias: %.2f\n",
                        stock.get("symbol"), stock.get("currentPrice"), stock.get("priceChange"), stock.get("marketBias")
                ));
            }

            BeanOutputConverter<MarketNewsBatch> converter = new BeanOutputConverter<>(MarketNewsBatch.class);

            String systemPrompt = String.format("""
                    Act as an elite senior financial journalist for Bloomberg News.
                    Analyze the provided live transactional market data block and generate brief, sharp updates for each asset listed.
                    
                    Instructions:
                    - Generate exactly one news analysis entry for each ticker symbol provided in the data block.
                    - Do not mention simulations, test environments, or database formats.
                    - Keep each summary brief (maximum two concise sentences).
                    - Map sentimentLabel strictly to: STRONGLY BULLISH, BULLISH, NEUTRAL, or BEARISH.
                    - Calculate an integer sentimentScore from 0 to 100 based on price metrics.
                    
                    %s
                    """, converter.getFormat());

            String userPayload = String.format("""
                    Here is the current live transactional market data block to evaluate:
                    
                    %s
                    """, marketContextBuilder.toString());

            // Dispatch a single network request
            String aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPayload)
                    .call()
                    .content();

            MarketNewsBatch batchData = converter.convert(aiResponse);

            if (batchData != null && batchData.articles() != null) {
                int savedCount = 0;
                long batchTimestamp = Instant.now().toEpochMilli();
                // Unpack and process the batch sequentially
                for (GenAiNewsItem item : batchData.articles()) {
                    if (item.symbol() == null || item.headline() == null) continue;

                    NewsArticle article = new NewsArticle();
                    article.setSymbol(item.symbol());
                    article.setHeadline(item.headline());
                    article.setSummary(item.summary());
                    article.setSentimentLabel(item.sentimentLabel());
                    article.setSentimentScore(item.sentimentScore());
                    article.setTimestamp(batchTimestamp);

                    // Generate composite key (using Math.abs to avoid negative hash strings)
                    String generatedKey = item.symbol().trim() + "_" + Math.abs(item.headline().trim().hashCode());
                    article.setUniqueKey(generatedKey);

                    try {
                        newsRepository.save(article);
                        savedCount++;

                        // Only send to React if the DB save was successful
                        messagingTemplate.convertAndSend("/topic/news/" + item.symbol(), article);
                        messagingTemplate.convertAndSend("/topic/globalNews", article);

                    } catch (org.springframework.dao.DuplicateKeyException e) {
                        System.out.println("Duplicate news skipped for: " + item.symbol());
                    } catch (Exception e) {
                        System.err.println("Database error saving news for " + item.symbol() + ": " + e.getMessage());
                    }
                }
                System.out.println("✅ Successfully processed batch. Inserted " + savedCount + " new unique updates.");
            }
        } catch (Exception e) {
            System.err.println("⚠️ Batch news engine skipped: " + e.getMessage());
        }
    }
}