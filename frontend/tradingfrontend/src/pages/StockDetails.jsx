import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TradingCharts from "../components/TradingCharts";
import OrderModal from "../components/OrderModal";
import MarketDepth from "../components/MarketDepth";
import LiveNews from "../components/LiveNews";
import * as ui from "../styles/style";
import toast from "react-hot-toast";
import API from "../services/api";
import { useWebSocket } from "../contexts/WebSocketContext";

function StockDetails() {
    const { symbol } = useParams();
    const navigate = useNavigate();
    const { isConnected, subscribe } = useWebSocket();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderMode, setOrderMode] = useState("BUY");

    const [compareSymbol, setCompareSymbol] = useState("");
    const availableStocks = ["TCS", "RELIANCE", "HDFCBANK", "INFY", "SBIN"].filter(s => s !== symbol);

    const [price, setPrice] = useState(0);
    const [comparePrice, setComparePrice] = useState(0);
    const [stockInfo, setStockInfo] = useState(null);
    const [depthData, setDepthData] = useState(null);

    const [availableTabs, setAvailableTabs] = useState(["Watchlist 1"]);
    const [selectedTab, setSelectedTab] = useState("Watchlist 1");

    const openOrder = (mode) => {
        setOrderMode(mode);
        setIsModalOpen(true);
    };

    const handleAddToWatchlist = async () => {
        try {
            const res = await API.post(`/api/watchlist/add/${symbol}?listName=${selectedTab}`);
            toast.success(res.data.message);
            window.dispatchEvent(new Event("watchlistUpdated"));
        } catch (err) {
            toast.error(err.response?.data || "Could not add to watchlist");
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await API.get(`/api/stocks/search?query=${symbol}`);
                if (res.data && res.data.length > 0) {
                    setPrice(res.data[0].currentPrice);
                    setStockInfo(res.data[0]);
                }

                if (compareSymbol) {
                    const compRes = await API.get(`/api/stocks/search?query=${compareSymbol}`);
                    if (compRes.data && compRes.data.length > 0) {
                        setComparePrice(compRes.data[0].currentPrice);
                    }
                }

                const tabsRes = await API.get("/api/watchlist/tabs");
                let dbTabs = tabsRes.data || [];
                const localTabs = JSON.parse(localStorage.getItem("userTabs")) || [];
                const mergedTabs = [...new Set([...dbTabs, ...localTabs])];
                if (mergedTabs.length > 0) {
                    setAvailableTabs(mergedTabs);
                    setSelectedTab(mergedTabs[0]);
                }
            } catch (err) {
                console.error("Fetch error", err);
            }
        };

        fetchInitialData();
    }, [symbol, compareSymbol]);

    useEffect(() => {
        if (!isConnected) return;

        const priceSub = subscribe(`/topic/price/${symbol}`, (msg) => {
            setPrice(parseFloat(msg.body));
        });

        const depthSub = subscribe(`/topic/depth/${symbol}`, (msg) => {
            setDepthData(JSON.parse(msg.body));
        });

        let compareSub = null;
        if (compareSymbol) {
            compareSub = subscribe(`/topic/price/${compareSymbol}`, (msg) => {
                setComparePrice(parseFloat(msg.body));
            });
        }

        return () => {
            if (priceSub) priceSub.unsubscribe();
            if (depthSub) depthSub.unsubscribe();
            if (compareSub) compareSub.unsubscribe();
        };
    }, [isConnected, symbol, compareSymbol]);

    return (
        <div style={{ padding: "20px 40px", color: ui.theme.textMain }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>

                {/* Back Button & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{ background: "transparent", border: `1px solid ${ui.theme.border}`, color: ui.theme.textLight, padding: "8px 15px", borderRadius: "4px", cursor: "pointer" }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: "28px" }}>{symbol}</h1>
                        <span style={{ color: "#888", fontSize: "14px" }}>National Stock Exchange</span>
                    </div>
                </div>

                {/* Compare, Watchlist Combo, Buy, Sell */}
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>

                    <select
                        value={compareSymbol}
                        onChange={(e) => setCompareSymbol(e.target.value)}
                        style={{ ...ui.input, margin: 0, width: "auto", padding: "10px 15px", backgroundColor: "#1e1e1e" }}
                    >
                        <option value="">+ Compare</option>
                        {availableStocks.map(stock => (
                            <option key={stock} value={stock}>{stock}</option>
                        ))}
                    </select>

                    <div style={{ display: "flex", border: `1px solid ${ui.theme.border}`, borderRadius: "4px", overflow: "hidden" }}>
                        <select
                            value={selectedTab}
                            onChange={(e) => setSelectedTab(e.target.value)}
                            style={{ ...ui.input, margin: 0, border: "none", borderRight: `1px solid ${ui.theme.border}`, borderRadius: 0, backgroundColor: "#1e1e1e", width: "120px", padding: "8px" }}
                        >
                            {availableTabs.map(tab => (
                                <option key={tab} value={tab}>{tab}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddToWatchlist}
                            style={{ ...ui.button, margin: 0, border: "none", borderRadius: 0, backgroundColor: "transparent", color: ui.theme.primary, padding: "8px 15px" }}
                        >
                            ⭐ Add
                        </button>
                    </div>

                    <button onClick={() => openOrder("BUY")} style={{ ...ui.button, margin: 0, width: "100px", backgroundColor: ui.theme.primary }}>
                        BUY
                    </button>
                    <button onClick={() => openOrder("SELL")} style={{ ...ui.button, margin: 0, width: "100px", backgroundColor: ui.theme.danger }}>
                        SELL
                    </button>
                </div>
            </div>

            {stockInfo && (
                <div style={{ display: "flex", gap: "40px", marginBottom: "20px", padding: "15px 20px", backgroundColor: "#111", borderRadius: "8px", border: `1px solid ${ui.theme.border}` }}>
                    <div>
                        <span style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "4px" }}>Volume</span>
                        <span style={{ fontWeight: "600", color: "#e0e0e0" }}>{(stockInfo.volume / 100000).toFixed(2)}M</span>
                    </div>
                    <div>
                        <span style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "4px" }}>52W High</span>
                        <span style={{ fontWeight: "600", color: ui.theme.success }}>₹{stockInfo.high52.toFixed(2)}</span>
                    </div>
                    <div>
                        <span style={{ display: "block", color: "#888", fontSize: "12px", marginBottom: "4px" }}>52W Low</span>
                        <span style={{ fontWeight: "600", color: ui.theme.danger }}>₹{stockInfo.low52.toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Main Chart & Market Depth */}
            <div style={{ display: "flex", gap: "20px", marginBottom: compareSymbol ? "30px" : "0" }}>
                <div style={{ flex: "7" }}>
                    <TradingCharts symbol={symbol} currentPrice={price} />
                </div>
                <div style={{ flex: "3" }}>
                    <MarketDepth depthPack={depthData} currentPrice={price} />
                </div>
            </div>

            {/* Live News & Sentiment AI Feed */}
            {!compareSymbol && (
                <LiveNews symbol={symbol} />
            )}

            {/* Secondary Chart */}
            {compareSymbol && (
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setCompareSymbol("")}
                        style={{ position: "absolute", top: "20px", right: "80px", zIndex: 10, background: "rgba(0,0,0,0.5)", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}
                    >
                        ✕ Close Compare
                    </button>
                    <TradingCharts symbol={compareSymbol} currentPrice={comparePrice} />
                </div>
            )}

            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                instrument={symbol}
                initialMode={orderMode}
            />

        </div>
    );
}

export default StockDetails;