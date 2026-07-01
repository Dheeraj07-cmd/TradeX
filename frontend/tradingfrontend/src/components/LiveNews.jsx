import { useEffect, useState } from "react";
import * as ui from "../styles/style";
import { useWebSocket } from "../contexts/WebSocketContext";

function LiveNews({ symbol }) {
    const { isConnected, subscribe } = useWebSocket(); // ✅ Use Global Socket
    const [news, setNews] = useState([]);
    const [sentiment, setSentiment] = useState({ score: 50, label: "NEUTRAL", color: "#888" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistoricalNews = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
                const token = localStorage.getItem("token") || localStorage.getItem("jwt");
                const response = await fetch(`${apiUrl}/api/news/${symbol}`, {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
                });

                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const latestArticle = data[0];
                    let badgeColor = "#888";
                    if (latestArticle.sentimentScore > 60) badgeColor = ui.theme.success;
                    if (latestArticle.sentimentScore < 40) badgeColor = ui.theme.danger;

                    setSentiment({
                        score: latestArticle.sentimentScore || 50,
                        label: latestArticle.sentimentLabel || "NEUTRAL",
                        color: badgeColor
                    });

                    const historicalNews = data.map(article => ({
                        id: article.timestamp,
                        title: article.headline,
                        summary: article.summary,
                        source: "AI Market Analyst",
                        time: new Date(article.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        impact: article.sentimentLabel
                    }));

                    setNews(historicalNews);
                } else {
                    setNews([]);
                }
            } catch (error) {
                console.error("Failed to load historical news:", error);
                setNews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoricalNews();
    }, [symbol]);

    useEffect(() => {
        if (!isConnected) return;

        const sub = subscribe(`/topic/news/${symbol}`, (message) => {
            const article = JSON.parse(message.body);

            let badgeColor = "#888";
            if (article.sentimentScore > 60) badgeColor = ui.theme.success;
            if (article.sentimentScore < 40) badgeColor = ui.theme.danger;

            setSentiment({
                score: article.sentimentScore || 50,
                label: article.sentimentLabel || "NEUTRAL",
                color: badgeColor
            });

            const structuralNewsItem = {
                id: article.timestamp,
                title: article.headline,
                summary: article.summary,
                source: "AI Market Analyst",
                time: "Just Now",
                impact: article.sentimentLabel
            };

            setNews((prevNews) => [structuralNewsItem, ...prevNews].slice(0, 5));
        });

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [isConnected, symbol]);

    return (
        <div style={{ backgroundColor: "#1e1e1e", borderRadius: "8px", border: `1px solid ${ui.theme.border}`, padding: "20px", marginTop: "20px" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${ui.theme.border}`, paddingBottom: "15px", marginBottom: "15px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", color: "#e0e0e0" }}>Latest News & AI Sentiment</h3>

                {/* AI Sentiment Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#151515", padding: "6px 12px", borderRadius: "20px", border: `1px solid ${ui.theme.border}` }}>
                    <span style={{ fontSize: "12px", color: "#888" }}>AI Score:</span>
                    <span style={{ fontSize: "14px", fontWeight: "bold", color: sentiment.color }}>{sentiment.score}/100</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", backgroundColor: sentiment.color + "22", color: sentiment.color, padding: "2px 8px", borderRadius: "4px" }}>
                        {sentiment.label}
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {/* Loading and Empty States */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#888" }}>
                        <p style={{ margin: 0, fontSize: "14px" }}>Analyzing market data...</p>
                    </div>
                ) : news.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "#666" }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "500" }}>No recent news catalysts found.</p>
                        <p style={{ margin: "6px 0 0 0", fontSize: "12px" }}>The AI Market Analyst is monitoring {symbol} for breaking developments.</p>
                    </div>
                ) : (
                    news.map(item => (
                        <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "5px", paddingBottom: "15px", borderBottom: "1px dashed #333" }}>
                            <a href="#" style={{ color: ui.theme.primary, fontSize: "15px", textDecoration: "none", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "#fff"} onMouseOut={e => e.target.style.color = ui.theme.primary}>
                                {item.title}
                            </a>
                            <p style={{ margin: 0, color: "#aaa", fontSize: "13px" }}>{item.summary}</p>

                            <div style={{ display: "flex", gap: "15px", fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                <span>{item.source}</span>
                                <span>•</span>
                                <span>{item.time}</span>
                                <span>•</span>
                                <span style={{
                                    color: (item.impact === "STRONGLY BULLISH" || item.impact === "BULLISH") ? ui.theme.success :
                                        (item.impact === "BEARISH") ? ui.theme.danger :
                                            "#888"
                                }}>
                                    Impact: {item.impact}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default LiveNews;