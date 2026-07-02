import { useEffect, useState, useRef } from "react";
import * as ui from "../styles/style";
import { useWebSocket } from "../contexts/WebSocketContext";

function MarketFeed() {
    const { isConnected, subscribe } = useWebSocket();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllStocks, setShowAllStocks] = useState(false);
    const refreshTimeoutRef = useRef(null);

    const fetchInitialState = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            const response = await fetch(`${apiUrl}/api/market-feed/overview`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Unauthorized or server down");
            const result = await response.json();

            setData(prev => {
                if (!prev) return result;
                return {
                    ...prev,
                    allStocks: result.allStocks,
                    sectorHeatmap: result.sectorHeatmap,
                    topGainers: result.topGainers,
                    topLosers: result.topLosers,
                    trendingStocks: result.trendingStocks,
                    buySellPressure: result.buySellPressure
                };
            });
        } catch (error) {
            console.error("Failed gathering terminal snapshot", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialState();
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        const newsSub = subscribe("/topic/globalNews", (message) => {
            if (!message.body) return;
            const freshArticle = JSON.parse(message.body);

            setData((prev) => {
                if (!prev) return prev;
                const updatedNews = [freshArticle, ...(prev.latestNews || [])].slice(0, 20);
                const filteredLeaderboard = (prev.sentimentLeaderboard || []).filter(item => item.symbol !== freshArticle.symbol);
                const updatedLeaderboard = [{ symbol: freshArticle.symbol, score: freshArticle.sentimentScore || 50 }, ...filteredLeaderboard]
                    .sort((a, b) => b.score - a.score).slice(0, 5);

                return { ...prev, latestNews: updatedNews, sentimentLeaderboard: updatedLeaderboard };
            });
        });

        const updateSub = subscribe("/topic/market-update", () => {
            if (refreshTimeoutRef.current) return;

            refreshTimeoutRef.current = setTimeout(() => {
                fetchInitialState();
                refreshTimeoutRef.current = null;
            }, 5000);
        });

        return () => {
            if (newsSub) newsSub.unsubscribe();
            if (updateSub) updateSub.unsubscribe();
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [isConnected]);

    if (loading) return <div style={{ color: "#fff", padding: "30px", fontSize: "14px" }}>Synchronizing Global Market Intelligence Feed...</div>;
    if (!data) return <div style={{ color: ui.theme?.danger || "#f44336", padding: "30px" }}>Error fetching structural data parameters.</div>;

    const formatMetricsColor = (val) => val > 0 ? ui.theme?.success || "#4caf50" : val < 0 ? ui.theme?.danger || "#f44336" : "#888";

    return (
        <div style={{ padding: "25px", backgroundColor: "#121212", minHeight: "100vh", color: "#e0e0e0", fontFamily: "sans-serif" }}>

            {/* Top Macro Banner */}
            <div style={{ backgroundColor: "#1e1e1e", borderLeft: `4px solid ${ui.theme?.primary || "#387ed1"}`, padding: "15px 20px", borderRadius: "6px", marginBottom: "25px" }}>
                <h3 style={{ margin: "0 0 8px 0", color: ui.theme?.primary || "#387ed1", fontSize: "15px", fontWeight: "700" }}>📊 AI MACRO INSIGHTS</h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#b3b3b3", lineHeight: "1.6" }}>{data.aiMarketSummary || "No macroeconomic summaries available."}</p>
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "25px", alignItems: "start" }}>

                {/* All Assets & Sector Status */}
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            <h4 style={{ margin: 0, fontSize: "13px", color: "#aaa", textTransform: "uppercase" }}>Tradable Operations</h4>
                            <button
                                onClick={() => setShowAllStocks(!showAllStocks)}
                                style={{ background: "transparent", border: "none", color: ui.theme?.primary || "#387ed1", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                            >
                                {showAllStocks ? "Show Top 10" : "View All Assets"}
                            </button>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "4px" }}>
                            {(showAllStocks ? (data.allStocks || []) : (data.allStocks || []).slice(0, 10)).map((stock, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #252525" }}>
                                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{stock.symbol}</span>
                                    <span style={{ fontSize: "14px" }}>₹{stock.currentPrice?.toFixed(2) || "0.00"}</span>
                                    <span style={{ color: formatMetricsColor(stock.priceChange), fontWeight: "500", fontSize: "14px" }}>
                                        {stock.priceChange > 0 ? "+" : ""}{stock.priceChange?.toFixed(2) || "0.00"}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <h4 style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#aaa", textTransform: "uppercase" }}>Sector Breakdown Matrix</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            {Object.entries(data.sectorHeatmap || {}).map(([sector, performance], idx) => (
                                <div key={idx} style={{ backgroundColor: "#161616", borderLeft: `3px solid ${formatMetricsColor(performance)}`, padding: "12px", borderRadius: "4px" }}>
                                    <div style={{ fontSize: "11px", color: "#777", fontWeight: "600" }}>{sector}</div>
                                    <div style={{ fontSize: "15px", fontWeight: "700", color: formatMetricsColor(performance), marginTop: "4px" }}>
                                        {performance > 0 ? "+" : ""}{performance?.toFixed(2) || "0.00"}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Performance Vectors, Pressure Bars & Leaderboards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: "13px", color: ui.theme?.success || "#4caf50" }}>HIGHEST ACCUMULATION (GAINERS)</h4>
                        {(data.topGainers || []).map((stock, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: "13.5px" }}>
                                <span style={{ fontWeight: "500" }}>{stock.symbol}</span>
                                <span style={{ color: ui.theme?.success || "#4caf50", fontWeight: "600" }}>+{stock.priceChange?.toFixed(2) || "0.00"}%</span>
                            </div>
                        ))}

                        <h4 style={{ margin: "24px 0 12px 0", fontSize: "13px", color: ui.theme?.danger || "#f44336" }}>🔻 LIQUIDATION IMPULSE (LOSERS)</h4>
                        {(data.topLosers || []).map((stock, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", margin: "8px 0", fontSize: "13.5px" }}>
                                <span style={{ fontWeight: "500" }}>{stock.symbol}</span>
                                <span style={{ color: ui.theme?.danger || "#f44336", fontWeight: "600" }}>{stock.priceChange?.toFixed(2) || "0.00"}%</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <h4 style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#ff9800", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                            Trending Activity
                        </h4>
                        {(data.trendingStocks || []).map((stock, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #252525", fontSize: "13.5px" }}>
                                <span style={{ fontWeight: "500" }}><span style={{ color: "#777" }}>#{idx + 1}</span> {stock.symbol}</span>
                                <span style={{ fontWeight: "600", color: "#ff9800" }}>{stock.interestScore?.toFixed(2) || "0.00"}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <h4 style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#aaa", textTransform: "uppercase" }}>AI Sentiment Leaderboard</h4>
                        {(data.sentimentLeaderboard || []).map((item, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #252525", fontSize: "13.5px" }}>
                                <span style={{ fontWeight: "500" }}><span style={{ color: "#777" }}>#{idx + 1}</span> {item.symbol}</span>
                                <span style={{ fontWeight: "700", color: item.score > 60 ? (ui.theme?.success || "#4caf50") : item.score < 40 ? (ui.theme?.danger || "#f44336") : "#888" }}>
                                    {item.score || 0}/100
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}` }}>
                        <h4 style={{ margin: "0 0 15px 0", fontSize: "13px", color: "#aaa", textTransform: "uppercase" }}>⚡ Transactional Book Bias</h4>
                        {(data.buySellPressure || []).map((item, idx) => (
                            <div key={idx} style={{ marginBottom: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                                    <span style={{ fontWeight: "600" }}>{item.symbol}</span>
                                    <span style={{ color: "#aaa" }}>{item.buyPercent || 0}% Buy / {item.sellPercent || 0}% Sell</span>
                                </div>
                                <div style={{ display: "flex", height: "5px", borderRadius: "2px", overflow: "hidden" }}>
                                    <div style={{ width: `${item.buyPercent || 0}%`, backgroundColor: ui.theme?.success || "#4caf50" }}></div>
                                    <div style={{ width: `${item.sellPercent || 0}%`, backgroundColor: ui.theme?.danger || "#f44336" }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Global Terminal News Stream */}
                <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: `1px solid ${ui.theme?.border || "#2d2d2d"}`, height: "765px", display: "flex", flexDirection: "column" }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#aaa", textTransform: "uppercase" }}>📰 Live Terminal News stream</h4>
                    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px" }}>
                        {(data.latestNews || []).map((article, idx) => (
                            <div key={idx} style={{ paddingBottom: "14px", borderBottom: "1px dashed #2d2d2d" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginBottom: "5px" }}>
                                    <span style={{ color: ui.theme?.primary || "#387ed1", fontWeight: "700" }}>[{article.symbol}]</span>
                                    <span>{article.timestamp ? new Date(article.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "--:--:--"}</span>
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff", marginBottom: "4px", lineHeight: "1.4" }}>{article.headline || "No Headline Available"}</div>
                                <div style={{ fontSize: "12.5px", color: "#999", lineHeight: "1.5" }}>{article.summary || ""}</div>
                                <div style={{
                                    marginTop: "6px", display: "inline-block", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px",
                                    backgroundColor: ((article.sentimentLabel || "").includes("BULLISH") ? (ui.theme?.success || "#4caf50") : (article.sentimentLabel || "").includes("BEARISH") ? (ui.theme?.danger || "#f44336") : "#333") + "22",
                                    color: (article.sentimentLabel || "").includes("BULLISH") ? (ui.theme?.success || "#4caf50") : (article.sentimentLabel || "").includes("BEARISH") ? (ui.theme?.danger || "#f44336") : "#888"
                                }}>
                                    {article.sentimentLabel || "NEUTRAL"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default MarketFeed;