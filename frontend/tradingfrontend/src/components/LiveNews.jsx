import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import * as ui from "../styles/style";

function LiveNews({ symbol }) {
    const [news, setNews] = useState([]);
    const [sentiment, setSentiment] = useState({ score: 50, label: "NEUTRAL", color: "#888" });

    useEffect(() => {
        const client = new Client({
            brokerURL: `${import.meta.env.VITE_API_URL.replace("http", "ws")}/ws`,
            onConnect: () => {
                client.subscribe(`/topic/news/${symbol}`, (message) => {
                    const article = JSON.parse(message.body);

                    // Map color based on score from backend
                    let badgeColor = "#888";
                    if (article.sentimentScore > 60) badgeColor = ui.theme.success;
                    if (article.sentimentScore < 40) badgeColor = ui.theme.danger;

                    setSentiment({
                        score: article.sentimentScore || 50,
                        label: article.sentimentLabel || "NEUTRAL",
                        color: badgeColor
                    });

                    // Format into UI's news list layout structure
                    const structuralNewsItem = {
                        id: article.timestamp,
                        title: article.headline,
                        source: "Gemini AI Insights",
                        time: "Just Now",
                        impact: article.sentimentLabel
                    };

                    // Prepend new article to the top of feed
                    setNews((prevNews) => [structuralNewsItem, ...prevNews].slice(0, 5));
                });
            },
        });

        client.activate();

        return () => {
            client.deactivate();
        };
    }, [symbol]);

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
                {news.map(item => (
                    <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "5px", paddingBottom: "15px", borderBottom: "1px dashed #333" }}>
                        <a href="#" style={{ color: ui.theme.primary, fontSize: "15px", textDecoration: "none", fontWeight: "500", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "#fff"} onMouseOut={e => e.target.style.color = ui.theme.primary}>
                            {item.title}
                        </a>
                        <div style={{ display: "flex", gap: "15px", fontSize: "12px", color: "#666" }}>
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                            <span>•</span>
                            <span style={{
                                color: item.impact === "Positive" ? ui.theme.success : item.impact === "Negative" ? ui.theme.danger : "#888"
                            }}>
                                Impact: {item.impact}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default LiveNews;