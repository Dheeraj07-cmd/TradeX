package com.dheeraj.tradingbackend.service;

import com.dheeraj.tradingbackend.dto.StockContext;
import com.dheeraj.tradingbackend.model.MarketSummary;
import com.dheeraj.tradingbackend.model.NewsArticle;
import com.dheeraj.tradingbackend.repository.MarketSummaryRepository;
import com.dheeraj.tradingbackend.repository.NewsRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class NewsGeneratorService {

    private final ChatClient chatClient;
    private final NewsRepository newsRepository;
    private final MarketSummaryRepository summaryRepository;
    private final MarketDataProvider marketDataProvider;
    private final SimpMessagingTemplate messagingTemplate;

    public record GenAiNewsItem(String symbol, String headline, String summary, String sentimentLabel, int sentimentScore) { }

    // Holds entire snapshot requirements in one structured layout schema
    public record CombinedMarketIntelligence(String macroSummary, List<GenAiNewsItem> articles) { }

    public NewsGeneratorService(ChatClient.Builder chatClientBuilder,
                                NewsRepository newsRepository,
                                MarketSummaryRepository summaryRepository,
                                SimpMessagingTemplate messagingTemplate, MarketDataProvider marketDataProvider) {
        this.chatClient = chatClientBuilder.build();
        this.newsRepository = newsRepository;
        this.summaryRepository = summaryRepository;
        this.messagingTemplate = messagingTemplate;
        this.marketDataProvider = marketDataProvider;
    }

    @Scheduled(fixedRate = 1800000) // Every 30 minutes
    public void executeMarketIntelligenceCycle() {
        try {
            List<StockContext> activeStocks = marketDataProvider.getTopMovingStocksContext(10);

            if (activeStocks == null || activeStocks.isEmpty()) {
                System.out.println("Market conditions stable. Skipping consolidation cycle.");
                return;
            }

            StringBuilder structuralContext = new StringBuilder();
            for (StockContext stock : activeStocks) {
                structuralContext.append(String.format(
                        "%s | Price: %.2f | Change: %.2f%% | Sector: %s\n",
                        stock.symbol(), stock.currentPrice(), stock.priceChange(), stock.sector()
                ));
            }

            BeanOutputConverter<CombinedMarketIntelligence> converter = new BeanOutputConverter<>(CombinedMarketIntelligence.class);

            String systemPrompt = String.format("""
                    Act as an elite senior financial journalist for Bloomberg News.
                    Analyze the live market data block provided and generate a unified market report.
                    
                    Instructions:
                    1. Provide a sharp, 2-sentence overarching macroSummary detailing ongoing asset velocity.
                    2. Generate exactly one detailed news analysis item for each unique ticker symbol found in the block.
                    3. Map sentimentLabel strictly to: STRONGLY BULLISH, BULLISH, NEUTRAL, or BEARISH.
                    4. Calculate an integer sentimentScore from 0 to 100 based on vector direction.
                    
                    %s
                    """, converter.getFormat());

            String userPayload = String.format("""
                    Current real-time structural market dataset:
                    
                    %s
                    """, structuralContext.toString());

            String aiResponse = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPayload)
                    .call()
                    .content();

            CombinedMarketIntelligence intelligencePack = converter.convert(aiResponse);

            if (intelligencePack != null) {
                long currentTimestamp = Instant.now().toEpochMilli();

                // Process Single Macro Summary Unit
                if (intelligencePack.macroSummary() != null && !intelligencePack.macroSummary().isBlank()) {
                    summaryRepository.save(new MarketSummary(intelligencePack.macroSummary(), currentTimestamp));
                    System.out.println("Dynamic Macro Summary successfully updated.");
                }

                // Process Streaming Articles Sequence
                if (intelligencePack.articles() != null) {
                    int savedCount = 0;
                    for (GenAiNewsItem item : intelligencePack.articles()) {
                        if (item.symbol() == null || item.headline() == null) continue;

                        NewsArticle article = new NewsArticle();
                        article.setSymbol(item.symbol());
                        article.setHeadline(item.headline());
                        article.setSummary(item.summary());
                        article.setSentimentLabel(item.sentimentLabel());
                        article.setSentimentScore(item.sentimentScore());
                        article.setTimestamp(currentTimestamp);

                        String sourcePayload = item.symbol().trim() + "_" + item.headline().trim();
                        String generatedKey = item.symbol().trim() + "_" + UUID.nameUUIDFromBytes(sourcePayload.getBytes());
                        article.setUniqueKey(generatedKey);

                        try {
                            newsRepository.save(article);
                            savedCount++;

                            messagingTemplate.convertAndSend("/topic/news/" + item.symbol(), article);
                            messagingTemplate.convertAndSend("/topic/globalNews", article);
                        } catch (org.springframework.dao.DuplicateKeyException e) {
                            System.out.println("Duplicate signature caught. Record skipped: " + item.symbol());
                        } catch (Exception e) {
                            System.err.println("Failed appending track payload: " + e.getMessage());
                        }
                    }
                    System.out.println("✅ Complete cycle committed. Inserted " + savedCount + " distinct updates.");
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Market aggregation thread skipped: " + e.getMessage());
        }
    }
}