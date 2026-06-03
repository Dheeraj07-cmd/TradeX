package com.dheeraj.tradingbackend.config;

import com.dheeraj.tradingbackend.model.Stock;
import com.dheeraj.tradingbackend.model.Candle;
import com.dheeraj.tradingbackend.repository.StockRepository;
import com.dheeraj.tradingbackend.repository.CandleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final StockRepository stockRepository;
    private final CandleRepository candleRepository;
    private final Random random = new Random();

    public DatabaseSeeder(StockRepository stockRepository, CandleRepository candleRepository) {
        this.stockRepository = stockRepository;
        this.candleRepository = candleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Stocks
        if (stockRepository.count() == 0) {
            System.out.println("🌱 Seeding stocks...");
            List<Stock> initialStocks = Arrays.asList(
                    // Energy & Oil
                    createStock("RELIANCE", "Reliance Industries Ltd.", "Energy", 2850.50),
                    createStock("ONGC", "Oil & Natural Gas Corp.", "Energy", 260.40),
                    createStock("COALINDIA", "Coal India Ltd.", "Energy", 450.20),
                    createStock("NTPC", "NTPC Limited", "Energy", 320.50),
                    createStock("POWERGRID", "Power Grid Corp.", "Energy", 280.90),

                    // IT & Software
                    createStock("TCS", "Tata Consultancy Services", "IT", 3950.00),
                    createStock("INFY", "Infosys Limited", "IT", 1620.25),
                    createStock("HCLTECH", "HCL Technologies", "IT", 1480.20),
                    createStock("WIPRO", "Wipro Limited", "IT", 520.30),
                    createStock("TECHM", "Tech Mahindra Ltd.", "IT", 1250.80),

                    // Banking & Finance
                    createStock("HDFCBANK", "HDFC Bank Ltd.", "Finance", 1450.75),
                    createStock("ICICIBANK", "ICICI Bank Ltd.", "Finance", 1050.20),
                    createStock("SBIN", "State Bank of India", "Finance", 760.10),
                    createStock("AXISBANK", "Axis Bank Ltd.", "Finance", 1080.40),
                    createStock("KOTAKBANK", "Kotak Mahindra Bank", "Finance", 1750.60),
                    createStock("BAJFINANCE", "Bajaj Finance Ltd.", "Finance", 6850.00),
                    createStock("BAJAJFINSV", "Bajaj Finserv Ltd.", "Finance", 1620.40),
                    createStock("JIOFIN", "Jio Financial Services", "Finance", 340.60),

                    // Auto
                    createStock("TATAMOTORS", "Tata Motors Ltd.", "Auto", 980.40),
                    createStock("M&M", "Mahindra & Mahindra", "Auto", 1950.75),
                    createStock("MARUTI", "Maruti Suzuki India", "Auto", 11250.00),
                    createStock("BAJAJ-AUTO", "Bajaj Auto Ltd.", "Auto", 8250.00),
                    createStock("EICHERMOT", "Eicher Motors Ltd.", "Auto", 3950.20),
                    createStock("TVSMOTOR", "TVS Motor Company", "Auto", 2150.80),

                    // FMCG & Consumer
                    createStock("ITC", "ITC Limited", "FMCG", 420.50),
                    createStock("HINDUNILVR", "Hindustan Unilever", "FMCG", 2350.25),
                    createStock("NESTLEIND", "Nestle India Ltd.", "FMCG", 2550.50),
                    createStock("TATACONSUM", "Tata Consumer Products", "FMCG", 1120.40),
                    createStock("BRITANNIA", "Britannia Industries", "FMCG", 5150.00),
                    createStock("ASIANPAINT", "Asian Paints Ltd.", "Consumer", 2850.00),
                    createStock("TITAN", "Titan Company Ltd.", "Consumer", 3650.00),
                    createStock("TRENT", "Trent Limited", "Consumer", 4050.20),

                    // Metals & Construction
                    createStock("L&T", "Larsen & Toubro Ltd.", "Construction", 3450.00),
                    createStock("ULTRACEMCO", "UltraTech Cement", "Construction", 9550.00),
                    createStock("GRASIM", "Grasim Industries", "Construction", 2250.75),
                    createStock("TATASTEEL", "Tata Steel Ltd.", "Metals", 160.75),
                    createStock("JSWSTEEL", "JSW Steel Ltd.", "Metals", 840.10),
                    createStock("HINDALCO", "Hindalco Industries", "Metals", 620.50),
                    createStock("ADANIENT", "Adani Enterprises", "Metals", 3150.00),

                    // Pharma & Healthcare
                    createStock("SUNPHARMA", "Sun Pharma Ind.", "Pharma", 1520.10),
                    createStock("CIPLA", "Cipla Limited", "Pharma", 1480.00),
                    createStock("DRREDDY", "Dr. Reddy's Labs", "Pharma", 5850.50),
                    createStock("APOLLOHOSP", "Apollo Hospitals", "Healthcare", 6250.00),

                    // Telecom, Defense, Infrastructure
                    createStock("BHARTIARTL", "Bharti Airtel Ltd.", "Telecom", 1150.30),
                    createStock("ADANIPORTS", "Adani Ports & SEZ", "Infrastructure", 1320.50),
                    createStock("INDIGO", "InterGlobe Aviation", "Services", 3250.10),
                    createStock("BEL", "Bharat Electronics", "Defense", 210.50),
                    createStock("HAL", "Hindustan Aeronautics", "Defense", 3150.00),
                    createStock("ZOMATO", "Zomato Limited", "Services", 180.40),
                    createStock("IRFC", "Indian Railway Fin.", "Finance", 150.20)
            );
            stockRepository.saveAll(initialStocks);
        }

        // Generate candles individually for any stock missing them
        System.out.println("📈 Verifying chart history for all stocks...");
        List<Stock> allStocks = stockRepository.findAll();
        List<Candle> allCandlesToSave = new ArrayList<>();

        for (Stock stock : allStocks) {
            if (!candleRepository.existsBySymbol(stock.getSymbol())) {
                System.out.println("Generating missing history for: " + stock.getSymbol());

                // 1D: 78 candles, 5 mins (300 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1D", stock.getCurrentPrice(), 78, 300, 0.004));
                // 1W: 168 candles, 1 hour (3600 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1W", stock.getCurrentPrice(), 168, 3600, 0.008));
                // 1M: 30 candles, 1 day (86400 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1M", stock.getCurrentPrice(), 30, 86400, 0.02));
                // 1Y: 52 candles, 1 week (604800 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1Y", stock.getCurrentPrice(), 52, 604800, 0.05));
            }
        }

        if (!allCandlesToSave.isEmpty()) {
            candleRepository.saveAll(allCandlesToSave);
            System.out.println("✅ Missing chart history generated and saved!");
        }
    }

    private List<Candle> generateCandlesForTimeframe(String symbol, String tf, double livePrice, int numCandles, long timeStep, double volatility) {
        java.util.LinkedList<Candle> data = new java.util.LinkedList<>();

        long currentTime = System.currentTimeMillis() / 1000;
        double walkClose = livePrice;

        for (int i = 0; i < numCandles; i++) {
            double vol = walkClose * volatility;
            // Generate shape of the candle
            double open = walkClose + (random.nextDouble() - 0.5) * vol;
            double high = Math.max(open, walkClose) + random.nextDouble() * (vol * 0.3);
            double low = Math.min(open, walkClose) - random.nextDouble() * (vol * 0.3);

            // Round to 2 decimals
            open = Math.round(open * 100.0) / 100.0;
            high = Math.round(high * 100.0) / 100.0;
            low = Math.round(low * 100.0) / 100.0;
            double close = Math.round(walkClose * 100.0) / 100.0;

            long candleTime = currentTime - (i * timeStep);

            data.addFirst(new Candle(symbol, tf, candleTime, open, high, low, close));
            walkClose = open;
        }
        return data;
    }

    private Stock createStock(String symbol, String name, String sector, double price) {
        Stock s = new Stock();
        s.setSymbol(symbol);
        s.setCompanyName(name);
        s.setSector(sector);
        s.setCurrentPrice(price);
        s.setChangePercent((Math.random() * 4) - 2);
        s.setVolume((long) (Math.random() * 1000000) + 50000);
        s.setHigh52(price * 1.2);
        s.setLow52(price * 0.8);
        return s;
    }
}