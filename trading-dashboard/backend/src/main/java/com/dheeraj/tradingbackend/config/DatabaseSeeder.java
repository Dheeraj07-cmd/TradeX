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
import java.util.concurrent.ThreadLocalRandom;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final StockRepository stockRepository;
    private final CandleRepository candleRepository;

    public DatabaseSeeder(StockRepository stockRepository, CandleRepository candleRepository) {
        this.stockRepository = stockRepository;
        this.candleRepository = candleRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (stockRepository.count() == 0) {
            System.out.println("🌱 Seeding stocks with Upstox Instrument Keys");
            List<Stock> initialStocks = Arrays.asList(
                    // Energy & Oil
                    createStock("RELIANCE", "NSE_EQ|INE002A01018", "Reliance Industries Ltd.", "Energy", 2850.50),
                    createStock("ONGC", "NSE_EQ|INE213A01029", "Oil & Natural Gas Corp.", "Energy", 260.40),
                    createStock("COALINDIA", "NSE_EQ|INE522F01014", "Coal India Ltd.", "Energy", 450.20),
                    createStock("NTPC", "NSE_EQ|INE733E01010", "NTPC Limited", "Energy", 320.50),
                    createStock("POWERGRID", "NSE_EQ|INE752E01010", "Power Grid Corp.", "Energy", 280.90),

                    // IT & Software
                    createStock("TCS", "NSE_EQ|INE467B01029", "Tata Consultancy Services", "IT", 3950.00),
                    createStock("INFY", "NSE_EQ|INE009A01021", "Infosys Limited", "IT", 1620.25),
                    createStock("HCLTECH", "NSE_EQ|INE860A01027", "HCL Technologies", "IT", 1480.20),
                    createStock("WIPRO", "NSE_EQ|INE075A01022", "Wipro Limited", "IT", 520.30),
                    createStock("TECHM", "NSE_EQ|INE669C01036", "Tech Mahindra Ltd.", "IT", 1250.80),

                    // Banking & Finance
                    createStock("HDFCBANK", "NSE_EQ|INE040A01034", "HDFC Bank Ltd.", "Finance", 1450.75),
                    createStock("ICICIBANK", "NSE_EQ|INE090A01021", "ICICI Bank Ltd.", "Finance", 1050.20),
                    createStock("SBIN", "NSE_EQ|INE062A01020", "State Bank of India", "Finance", 760.10),
                    createStock("AXISBANK", "NSE_EQ|INE238A01034", "Axis Bank Ltd.", "Finance", 1080.40),
                    createStock("KOTAKBANK", "NSE_EQ|INE237A01028", "Kotak Mahindra Bank", "Finance", 1750.60),
                    createStock("BAJFINANCE", "NSE_EQ|INE296A01024", "Bajaj Finance Ltd.", "Finance", 6850.00),
                    createStock("BAJAJFINSV", "NSE_EQ|INE918I01018", "Bajaj Finserv Ltd.", "Finance", 1620.40),
                    createStock("JIOFIN", "NSE_EQ|INE758E01017", "Jio Financial Services", "Finance", 340.60),

                    // Auto
                    createStock("TATAMOTORS", "NSE_EQ|INE155A01022", "Tata Motors Ltd.", "Auto", 980.40),
                    createStock("M&M", "NSE_EQ|INE101A01026", "Mahindra & Mahindra", "Auto", 1950.75),
                    createStock("MARUTI", "NSE_EQ|INE585B01010", "Maruti Suzuki India", "Auto", 11250.00),
                    createStock("BAJAJ-AUTO", "NSE_EQ|INE917I01010", "Bajaj Auto Ltd.", "Auto", 8250.00),
                    createStock("EICHERMOT", "NSE_EQ|INE066A01021", "Eicher Motors Ltd.", "Auto", 3950.20),
                    createStock("TVSMOTOR", "NSE_EQ|INE494B01023", "TVS Motor Company", "Auto", 2150.80),

                    // FMCG & Consumer
                    createStock("ITC", "NSE_EQ|INE154A01025", "ITC Limited", "FMCG", 420.50),
                    createStock("HINDUNILVR", "NSE_EQ|INE030A01027", "Hindustan Unilever", "FMCG", 2350.25),
                    createStock("NESTLEIND", "NSE_EQ|INE239A01016", "Nestle India Ltd.", "FMCG", 2550.50),
                    createStock("TATACONSUM", "NSE_EQ|INE192A01025", "Tata Consumer Products", "FMCG", 1120.40),
                    createStock("BRITANNIA", "NSE_EQ|INE216A01030", "Britannia Industries", "FMCG", 5150.00),
                    createStock("ASIANPAINT", "NSE_EQ|INE021A01026", "Asian Paints Ltd.", "Consumer", 2850.00),
                    createStock("TITAN", "NSE_EQ|INE280A01028", "Titan Company Ltd.", "Consumer", 3650.00),
                    createStock("TRENT", "NSE_EQ|INE849A01020", "Trent Limited", "Consumer", 4050.20),

                    // Metals & Construction
                    createStock("L&T", "NSE_EQ|INE018A01030", "Larsen & Toubro Ltd.", "Construction", 3450.00),
                    createStock("ULTRACEMCO", "NSE_EQ|INE481G01011", "UltraTech Cement", "Construction", 9550.00),
                    createStock("GRASIM", "NSE_EQ|INE047A01021", "Grasim Industries", "Construction", 2250.75),
                    createStock("TATASTEEL", "NSE_EQ|INE081A01020", "Tata Steel Ltd.", "Metals", 160.75),
                    createStock("JSWSTEEL", "NSE_EQ|INE019A01038", "JSW Steel Ltd.", "Metals", 840.10),
                    createStock("HINDALCO", "NSE_EQ|INE038A01020", "Hindalco Industries", "Metals", 620.50),
                    createStock("ADANIENT", "NSE_EQ|INE423A01024", "Adani Enterprises", "Metals", 3150.00),

                    // Pharma & Healthcare
                    createStock("SUNPHARMA", "NSE_EQ|INE044A01036", "Sun Pharma Ind.", "Pharma", 1520.10),
                    createStock("CIPLA", "NSE_EQ|INE059A01026", "Cipla Limited", "Pharma", 1480.00),
                    createStock("DRREDDY", "NSE_EQ|INE089A01023", "Dr. Reddy's Labs", "Pharma", 5850.50),
                    createStock("APOLLOHOSP", "NSE_EQ|INE437A01024", "Apollo Hospitals", "Healthcare", 6250.00),

                    // Telecom, Defense, Infrastructure
                    createStock("BHARTIARTL", "NSE_EQ|INE397D01024", "Bharti Airtel Ltd.", "Telecom", 1150.30),
                    createStock("ADANIPORTS", "NSE_EQ|INE742F01042", "Adani Ports & SEZ", "Infrastructure", 1320.50),
                    createStock("INDIGO", "NSE_EQ|INE646L01027", "InterGlobe Aviation", "Services", 3250.10),
                    createStock("BEL", "NSE_EQ|INE263A01024", "Bharat Electronics", "Defense", 210.50),
                    createStock("HAL", "NSE_EQ|INE066F01020", "Hindustan Aeronautics", "Defense", 3150.00),
                    createStock("ZOMATO", "NSE_EQ|INE758T01015", "Zomato Limited", "Services", 180.40),
                    createStock("IRFC", "NSE_EQ|INE053F01010", "Indian Railway Fin.", "Finance", 150.20)
            );
            stockRepository.saveAll(initialStocks);
        }

        // Generate candles individually for any stock missed
        System.out.println("📈 Verifying chart history for all stocks...");
        List<Stock> allStocks = stockRepository.findAll();
        List<Candle> allCandlesToSave = new ArrayList<>();

        for (Stock stock : allStocks) {
            if (!candleRepository.existsBySymbol(stock.getSymbol())) {
                System.out.println("Generating missing history for: " + stock.getSymbol());

                // 5M= 75 candles per day, 5 mins (300 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "5M", stock.getCurrentPrice(), 75, 300, 0.004));

                // 1H= 35 candles per week, 1 hour (3600 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1H", stock.getCurrentPrice(), 35, 3600, 0.008));

                // 1D= 22 trading days per month, 1 day (86400 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1D", stock.getCurrentPrice(), 22, 86400, 0.02));

                // 1W= 52 weeks per year, 1 week (604800 sec)
                allCandlesToSave.addAll(generateCandlesForTimeframe(stock.getSymbol(), "1W", stock.getCurrentPrice(), 52, 604800, 0.05));
            }
        }

        if (!allCandlesToSave.isEmpty()) {
            candleRepository.saveAll(allCandlesToSave);
            System.out.println("✅ Missing chart history generated and saved!");
        }
    }

    private List<Candle> generateCandlesForTimeframe(String symbol, String tf, double livePrice, int numCandles, long timeStep, double volatility) {
        java.util.LinkedList<Candle> data = new java.util.LinkedList<>();
        ThreadLocalRandom localRandom = ThreadLocalRandom.current();

        long currentTime = System.currentTimeMillis() / 1000;
        double walkClose = livePrice;

        for (int i = 0; i < numCandles; i++) {
            double vol = walkClose * volatility;
            // Generate shape of the candle
            double open = walkClose + (localRandom.nextDouble() - 0.5) * vol;
            double high = Math.max(open, walkClose) + localRandom.nextDouble() * (vol * 0.3);
            double low = Math.min(open, walkClose) - localRandom.nextDouble() * (vol * 0.3);

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

    private Stock createStock(String symbol, String instrumentKey, String name, String sector, double price) {
        Stock s = new Stock();
        s.setSymbol(symbol);
        s.setInstrumentKey(instrumentKey);
        s.setCompanyName(name);
        s.setSector(sector);
        s.setCurrentPrice(price);

        ThreadLocalRandom localRandom = ThreadLocalRandom.current();
        s.setChangePercent((localRandom.nextDouble() * 4) - 2);
        s.setVolume((long) (localRandom.nextDouble() * 1000000) + 50000);
        s.setHigh52(price * 1.2);
        s.setLow52(price * 0.8);
        return s;
    }
}