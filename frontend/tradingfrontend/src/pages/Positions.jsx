import { useEffect, useState } from "react";
import API from "../services/api";
import * as ui from "../styles/style";
import { formatCurrency } from "../utils/helpers";
import { useWebSocket } from "../contexts/WebSocketContext";

function Positions({ openOrderModal }) {
    const { isConnected, subscribe } = useWebSocket();
    const [positions, setPositions] = useState([]);

    const totalInvested = positions.reduce((acc, p) => acc + (p.avg * p.qty), 0);
    const totalCurrent = positions.reduce((acc, p) => acc + (p.price * p.qty), 0);
    const totalPnl = totalCurrent - totalInvested;
    const totalPnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : 0;

    // 1. Fetch positions exactly ONE time when the page loads
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const res = await API.get("/api/positions");
                setPositions([...res.data]);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPositions();
    }, []);

    // 2. Update prices purely in browser memory using the global WebSocket
    useEffect(() => {
        if (!isConnected) return;

        const sub = subscribe("/topic/market-prices", (message) => {
            if (!message.body) return;
            const livePrices = JSON.parse(message.body);

            setPositions(prev => {
                let hasChanges = false;
                const newPositions = prev.map(p => {
                    if (livePrices[p.name]) {
                        const newPrice = parseFloat(livePrices[p.name]);
                        if (newPrice !== p.price) {
                            hasChanges = true;
                            return { ...p, price: newPrice };
                        }
                    }
                    return p;
                });
                return hasChanges ? newPositions : prev;
            });
        });

        return () => {
            if (sub) sub.unsubscribe();
        };
    }, [isConnected]);

    return (
        <div style={ui.page}>
            <div style={ui.container}>
                <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Positions</h2>

                <div style={{ ...ui.row, alignItems: "flex-start" }}>

                    {/* Summary Card */}
                    <div style={{ ...ui.card, flex: "1 1 300px", maxWidth: "300px", position: "sticky", top: "20px" }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Day's P&L
                        </h3>

                        <div style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid #333" }}>
                            <h1 style={{
                                margin: 0,
                                fontSize: "32px",
                                color: totalPnl >= 0 ? "#28a745" : "#dc3545"
                            }}>
                                {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                            </h1>
                            <div style={{
                                display: "inline-block",
                                marginTop: "10px",
                                padding: "5px 12px",
                                borderRadius: "4px",
                                background: totalPnl >= 0 ? "rgba(40, 167, 69, 0.1)" : "rgba(220, 53, 69, 0.1)",
                                color: totalPnl >= 0 ? "#28a745" : "#dc3545",
                                fontWeight: "bold",
                                fontSize: "12px"
                            }}>
                                {totalPnl >= 0 ? "▲" : "▼"} {totalPnlPercent}%
                            </div>
                        </div>

                        <div style={{ marginTop: "20px", fontSize: "14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                <span style={{ color: "#888" }}>Invested</span>
                                <span style={{ fontWeight: "500" }}>{formatCurrency(totalInvested)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                <span style={{ color: "#888" }}>Current</span>
                                <span style={{ fontWeight: "500" }}>{formatCurrency(totalCurrent)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Positions Table */}
                    <div style={{ ...ui.card, flex: "2 1 500px", padding: 0, overflow: "hidden" }}>
                        {positions.length === 0 ? (
                            <div style={{ padding: "80px", textAlign: "center", color: "#888" }}>
                                <p>You have no open positions.</p>
                            </div>
                        ) : (
                            <div style={ui.tableContainer}>
                                <table style={ui.table}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#1a1a1a" }}>
                                            <th style={ui.th}>Instrument</th>
                                            <th style={ui.th}>Qty</th>
                                            <th style={ui.th}>Avg. Cost</th>
                                            <th style={ui.th}>LTP</th>
                                            <th style={ui.th}>P&L</th>
                                            <th style={ui.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.map((p) => {
                                            const invested = p.avg * p.qty;
                                            const currentVal = p.price * p.qty;
                                            const pnl = currentVal - invested;
                                            const pnlPerc = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : 0;

                                            return (
                                                <tr key={p.id} className="hover-row">
                                                    <td style={ui.td}>
                                                        <span style={{ color: "#387ed1", fontWeight: "600", fontSize: "14px" }}>{p.name}</span>
                                                        <span style={{ display: "block", fontSize: "10px", color: "#666", marginTop: "2px" }}>NSE</span>
                                                    </td>
                                                    <td style={ui.td}>
                                                        <span style={{ fontWeight: "500" }}>{p.qty}</span>
                                                    </td>
                                                    <td style={ui.td}>{formatCurrency(p.avg)}</td>
                                                    <td style={{ ...ui.td, fontWeight: "500" }}>{formatCurrency(p.price)}</td>

                                                    <td style={ui.td}>
                                                        <span style={{ color: pnl >= 0 ? "#28a745" : "#dc3545", fontWeight: "600" }}>
                                                            {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                                                        </span>
                                                        <span style={{ display: "block", fontSize: "11px", color: pnl >= 0 ? "#28a745" : "#dc3545" }}>
                                                            {pnlPerc}%
                                                        </span>
                                                    </td>

                                                    <td style={ui.td}>
                                                        <div style={{ display: "flex", gap: "8px" }}>
                                                            <button
                                                                onClick={() => openOrderModal(p.name, "BUY")}
                                                                style={actionBtn("#387ed1")}
                                                            > + Add
                                                            </button>
                                                            <button
                                                                onClick={() => openOrderModal(p.name, "SELL")}
                                                                style={actionBtn("#dc3545")}>
                                                                Exit
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const actionBtn = (color) => ({ border: `1px solid ${color}`, background: "transparent", color: color, borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" });

export default Positions;