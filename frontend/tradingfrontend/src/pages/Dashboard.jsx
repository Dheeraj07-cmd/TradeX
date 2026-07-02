import { useEffect, useState } from "react";
import API from "../services/api";
import Charts from "../components/Charts";
import * as ui from "../styles/style";
import { formatCurrency } from "../utils/helpers";
import KycProgressBanner from "../components/KycProgressBanner";
import { useWebSocket } from "../contexts/WebSocketContext";

const SummaryCard = ({ title, value }) => (
    <div style={{ ...ui.card, ...ui.flexItem, borderTop: "3px solid #333" }}>
        <p style={ui.title}>{title}</p>
        <h2 style={ui.value}>{formatCurrency(value)}</h2>
    </div>
);

function Dashboard() {
    const { isConnected, subscribe } = useWebSocket(); 
    const [holdings, setHoldings] = useState([]);
    const [realizedPnl, setRealizedPnl] = useState(0);
    const [unrealizedPnl, setUnrealizedPnl] = useState(0);
    const [profile, setProfile] = useState(null);

    const investedValue = holdings.reduce((sum, h) => sum + (Number(h.avg || 0) * Number(h.qty || 0)), 0);
    const currentValue = holdings.reduce((sum, h) => sum + (Number(h.price || 0) * Number(h.qty || 0)), 0);
    const totalPnl = currentValue - investedValue;
    const totalPnlPercent = investedValue > 0 ? ((totalPnl / investedValue) * 100).toFixed(2) : 0;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [holdingsRes, realizedRes, unrealizedRes, profileRes] = await Promise.all([
                    API.get("/api/holdings"),
                    API.get("/api/orders/pnl"),
                    API.get("/api/orders/unrealized"),
                    API.get("/api/user/profile")
                ]);

                setHoldings(holdingsRes.data);
                setRealizedPnl(realizedRes.data);
                setUnrealizedPnl(unrealizedRes.data);
                setProfile(profileRes.data);
            } catch (err) {
                console.error("Dashboard initialization error:", err);
            }
        };
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (!isConnected) return;

        const priceSub = subscribe("/topic/market-prices", (message) => {
            if (!message.body) return;
            const livePrices = JSON.parse(message.body);

            setHoldings(prevHoldings => prevHoldings.map(holding => {
                if (livePrices[holding.name]) {
                    return { ...holding, price: parseFloat(livePrices[holding.name]) };
                }
                return holding;
            }));
        });

        let holdingsSub = null;
        if (profile?.id) {
            holdingsSub = subscribe(`/topic/holdings/${profile.id}`, (message) => {
                if (message.body) {
                    setHoldings(JSON.parse(message.body));
                }
            });
        }

        return () => {
            if (priceSub) priceSub.unsubscribe();
            if (holdingsSub) holdingsSub.unsubscribe();
        };
    }, [isConnected, profile?.id]);

    const username = localStorage.getItem("username") || "User";

    return (
        <div style={ui.page}>
            <div style={ui.container}>
                <h2 style={{ marginBottom: "25px", fontSize: "22px", color: "#e0e0e0" }}>Hi, {username}</h2>

                {profile && <KycProgressBanner user={profile} />}

                <div style={ui.row}>
                    <SummaryCard title="Margin Available" value={profile?.balance || 0} />
                    <SummaryCard title="Invested" value={investedValue} />
                    <SummaryCard title="Current Value" value={currentValue} />

                    <div style={{ ...ui.card, ...ui.flexItem, borderTop: totalPnl >= 0 ? "3px solid #28a745" : "3px solid #dc3545" }}>
                        <p style={ui.title}>Overall P&L</p>
                        <h2 style={{ ...ui.value, color: totalPnl >= 0 ? "#28a745" : "#dc3545", fontSize: "28px" }}>
                            {formatCurrency(totalPnl)}
                        </h2>
                        <small style={{ color: totalPnl >= 0 ? "#28a745" : "#dc3545", fontWeight: "600", fontSize: "13px" }}>
                            {totalPnl >= 0 ? "▲" : "▼"} {totalPnlPercent}%
                        </small>
                    </div>
                </div>

                <div style={{ ...ui.card, marginTop: "10px" }}>
                    <Charts holdings={holdings} realizedPnl={realizedPnl} unrealizedPnl={unrealizedPnl} />
                </div>

                <div style={{ ...ui.card, padding: 0, overflow: "hidden", marginTop: "20px" }}>
                    <div style={{ padding: "15px 20px", borderBottom: "1px solid #333", backgroundColor: "#1a1a1a" }}>
                        <h3 style={{ margin: 0, fontSize: "16px" }}>Holdings <span style={{ color: "#888", fontSize: "14px" }}>({holdings.length})</span></h3>
                    </div>
                    {holdings.length === 0 ? (
                        <p style={{ padding: "60px", textAlign: "center", color: "#888" }}>
                            Your portfolio is currently empty.
                        </p>
                    ) : (
                        <div style={ui.tableContainer}>
                            <table style={ui.table}>
                                <thead>
                                    <tr>
                                        <th style={ui.th}>Instrument</th>
                                        <th style={ui.th}>Qty.</th>
                                        <th style={ui.th}>Avg. Cost</th>
                                        <th style={ui.th}>LTP</th>
                                        <th style={ui.th}>Cur. Val</th>
                                        <th style={ui.th}>P&L</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holdings.map((h) => {
                                        const invested = h.avg * h.qty;
                                        const current = h.price * h.qty;
                                        const pnl = current - invested;
                                        const pnlPercent = invested > 0 ? ((pnl / invested) * 100).toFixed(2) : 0;

                                        return (
                                            <tr key={h.id} className="hover-row">
                                                <td style={ui.td}>
                                                    <span style={{ color: "#387ed1", fontWeight: "600" }}>{h.name}</span>
                                                    <span style={{ display: "block", fontSize: "10px", color: "#666" }}>NSE</span>
                                                </td>
                                                <td style={ui.td}>{h.qty}</td>
                                                <td style={ui.td}>{formatCurrency(h.avg)}</td>
                                                <td style={ui.td}>{formatCurrency(h.price)}</td>
                                                <td style={ui.td}>{formatCurrency(current)}</td>
                                                <td style={{ ...ui.td, color: pnl >= 0 ? "#28a745" : "#dc3545", fontWeight: "500" }}>
                                                    {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                                                    <span style={{ fontSize: "11px", display: "block", color: pnl >= 0 ? "#28a745" : "#dc3545" }}>
                                                        {pnlPercent}%
                                                    </span>
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
    );
}

export default Dashboard;