import { useState, useEffect } from "react";
import API from "../services/api";
import * as ui from "../styles/style";

function MarketStatusBar() {
    const [marketData, setMarketData] = useState(null);

    useEffect(() => {
        const fetchMarketStatus = async () => {
            try {
                const res = await API.get("/api/market/status");
                setMarketData(res.data);
            } catch (err) {
                console.error("Failed to fetch market status", err);
            }
        };

        fetchMarketStatus();
        const interval = setInterval(fetchMarketStatus, 10000);
        return () => clearInterval(interval);
    }, []);

    if (!marketData) return null;

    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 25px",
            backgroundColor: "#0d0d0d", borderBottom: `1px solid ${ui.theme.border}`, fontSize: "12px", fontFamily: "monospace"
        }}>

            {/* Indices */}
            <div style={{ display: "flex", gap: "25px", overflowX: "auto", whiteSpace: "nowrap" }}>
                {marketData.indices.map((index, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "#777" }}>{index.name}</span>
                        <span style={{ fontWeight: "bold", color: ui.theme.textMain }}>
                            {index.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ color: index.percent >= 0 ? ui.theme.success : ui.theme.danger, fontWeight: "600" }}>
                            {index.percent >= 0 ? "▲" : "▼"} {Math.abs(index.change).toFixed(2)} ({Math.abs(index.percent).toFixed(2)}%)
                        </span>
                    </div>
                ))}
            </div>

            {/* Market Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    backgroundColor: marketData.marketOpen ? ui.theme.success : ui.theme.danger,
                    boxShadow: `0 0 6px ${marketData.marketOpen ? ui.theme.success : ui.theme.danger}`
                }} />
                <span style={{ color: "#777", letterSpacing: "0.5px", fontWeight: "bold", fontSize: "11px" }}>
                    {marketData.statusMessage}
                </span>
            </div>
        </div>
    );
}

export default MarketStatusBar;