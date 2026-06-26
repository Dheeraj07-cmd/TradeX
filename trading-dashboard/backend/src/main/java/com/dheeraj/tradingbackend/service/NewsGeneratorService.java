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
import java.util.ArrayList;
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

    // Schema wrappers to separate parsing profiles safely
    public record MacroIntelligence(String macroSummary) { }
    public record BatchNewsIntelligence(List<GenAiNewsItem> articles) { }

    public NewsGeneratorService(ChatClient.Builder chatClientBuilder,
                                NewsRepository newsRepository,
                                MarketSummaryRepository summaryRepository,
                                SimpMessagingTemplate messagingTemplate,
                                MarketDataProvider marketDataProvider) {
        this.chatClient = chatClientBuilder.build();
        this.newsRepository = newsRepository;
        this.summaryRepository = summaryRepository;
        this.messagingTemplate = messagingTemplate;
        this.marketDataProvider = marketDataProvider;
    }

    @Scheduled(fixedRate = 900000) // Runs every 15 minutes
    public void executeMarketIntelligenceCycle() {
        try {
            // Fetch ALL active stocks to generate
            List<StockContext> allStocks = marketDataProvider.getTopMovingStocksContext(50);
            if (allStocks == null || allStocks.isEmpty()) {
                System.out.println("Market conditions stable. Skipping macro/news updates.");
                return;
            }

            long currentTimestamp = Instant.now().toEpochMilli();

            // Generate Global Macro Summary using top 10 dynamic movers
            List<StockContext> topMovers = allStocks.subList(0, Math.min(10, allStocks.size()));
            generateAndSaveMacroSummary(topMovers, currentTimestamp);

            // Process ALL stocks in chunks of 10 to protect token windows
            int chunkSize = 10;
            int totalSavedCount = 0;

            for (int i = 0; i < allStocks.size(); i += chunkSize) {
                List<StockContext> chunk = allStocks.subList(i, Math.min(i + chunkSize, allStocks.size()));
                totalSavedCount += processNewsBatch(chunk, currentTimestamp);
            }

            System.out.println("Processed total items: " + allStocks.size() + ", Saved additions: " + totalSavedCount);
        } catch (Exception e) {
            System.err.println("⚠️ Market aggregation cycle failed: " + e.getMessage());
        }
    }

    private void generateAndSaveMacroSummary(List<StockContext> topMovers, long currentTimestamp) {
        try {
            StringBuilder coreContext = new StringBuilder();
            for (StockContext stock : topMovers) {
                coreContext.append(String.format("%s | Price: %.2f | Change: %.2f%%\n",
                        stock.symbol(), stock.currentPrice(), stock.priceChange()));
            }

            BeanOutputConverter<MacroIntelligence> macroConverter = new BeanOutputConverter<>(MacroIntelligence.class);

            String systemPrompt = String.format("""
                    Act as an elite senior financial macro strategist for Bloomberg News.
                    Analyze the main moving vectors provided and compose a high-level summary.
                    
                    Instructions:
                    Provide exactly one sharp, high-impact 2-sentence overarching macroSummary detailing general market directions.
                    
                    %s
                    """, macroConverter.getFormat());

            String response = chatClient.prompt()
                    .system(systemPrompt)
                    .user("Current Top Market Drivers:\n" + coreContext)
                    .call()
                    .content();

            MacroIntelligence parsed = macroConverter.convert(response);
            if (parsed != null && parsed.macroSummary() != null && !parsed.macroSummary().isBlank()) {
                //  Global Macro Insights
                summaryRepository.save(new MarketSummary(parsed.macroSummary(), currentTimestamp));
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed parsing macro insights fragment: " + e.getMessage());
        }
    }

    private int processNewsBatch(List<StockContext> targetChunk, long currentTimestamp) {
        int batchSaved = 0;
        try {
            StringBuilder operationalBlock = new StringBuilder();
            for (StockContext stock : targetChunk) {
                operationalBlock.append(String.format(
                        "%s | Price: %.2f | Change: %.2f%% | Sector: %s\n",
                        stock.symbol(), stock.currentPrice(), stock.priceChange(), stock.sector()
                ));
            }

            BeanOutputConverter<BatchNewsIntelligence> newsConverter = new BeanOutputConverter<>(BatchNewsIntelligence.class);

            String systemPrompt = String.format("""
                    Act as an expert Wall Street investigative reporter.
                    Review the stock segment profile parameters provided and build specific situational news updates.
                    
                    Instructions:
                    1. Generate exactly one highly detailed news analysis item for each unique ticker symbol provided.
                    2. Map sentimentLabel strictly to: STRONGLY BULLISH, BULLISH, NEUTRAL, or BEARISH.
                    3. Output a realistic corporate headline and specific market summary for that ticker item.
                    
                    %s
                    """, newsConverter.getFormat());

            String response = chatClient.prompt()
                    .system(systemPrompt)
                    .user("Target Stock Segment Checklist:\n" + operationalBlock)
                    .call()
                    .content();

            BatchNewsIntelligence batchOutput = newsConverter.convert(response);
            if (batchOutput == null || batchOutput.articles() == null) return 0;

            for (GenAiNewsItem item : batchOutput.articles()) {
                if (item.symbol() == null || item.headline() == null) continue;

                NewsArticle article = new NewsArticle();
                article.setSymbol(item.symbol().toUpperCase().trim());
                article.setHeadline(item.headline());
                article.setSummary(item.summary());
                article.setSentimentLabel(item.sentimentLabel());
                article.setSentimentScore(item.sentimentScore());
                article.setTimestamp(currentTimestamp);

                String sourcePayload = article.getSymbol() + "_" + article.getHeadline().trim();
                String generatedKey = article.getSymbol() + "_" + UUID.nameUUIDFromBytes(sourcePayload.getBytes());
                article.setUniqueKey(generatedKey);

                try {
                    newsRepository.save(article);
                    batchSaved++;

                    // Dispatches live websocket updates to specific chart frames & global tables
                    messagingTemplate.convertAndSend("/topic/news/" + article.getSymbol(), article);
                    messagingTemplate.convertAndSend("/topic/globalNews", article);
                } catch (org.springframework.dao.DuplicateKeyException e) {
                    // Skips duplicate processing
                } catch (Exception e) {
                    System.err.println("Error pushing WS updates for " + item.symbol() + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error processing structured news partition block: " + e.getMessage());
        }
        return batchSaved;
    }
}


