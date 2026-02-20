import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import Charts from "../components/Charts";
import * as ui from "../styles/style";
import { formatCurrency } from "../utils/helpers";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function Dashboard() {
    const [holdings, setHoldings] = useState([]);
    const [realizedPnl, setRealizedPnl] = useState(0);
    const [unrealizedPnl, setUnrealizedPnl] = useState(0);

    const investedValue = holdings.reduce((sum, h) => sum + h.avg * h.qty, 0);
    const currentValue = holdings.reduce((sum, h) => sum + h.price * h.qty, 0);
    const totalPnl = currentValue - investedValue;
    const totalPnlPercent = investedValue > 0 ? ((totalPnl / investedValue) * 100).toFixed(2) : 0;

    useEffect(() => {
        const userId = localStorage.getItem("userId");
        const fetchData = async () => {
            try {
                const holdingsRes = await API.get("/api/holdings");
                const realizedRes = await API.get("/api/orders/pnl");
                const unrealizedRes = await API.get("/api/orders/unrealized");
                setHoldings(holdingsRes.data); 
                setRealizedPnl(realizedRes.data);
                setUnrealizedPnl(unrealizedRes.data); 
            } catch (err) { console.error(err); }
        };

        fetchData();

        const socket = new SockJS("http://localhost:8080/ws");
        const client = new Client({
            webSocketFactory: () => socket, 
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/portfolio/${userId}`, (message) => {
                    fetchData(); // Refresh data on update
                });
            }
        });
        client.activate();
        return () => { client.deactivate(); };
    }, []);

    const username = localStorage.getItem("username") || "User";

    return (
        <>
            <Navbar />
            <div style={ui.page}>
                <div style={ui.container}>
                    
                    <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Hi, {username}</h2>

                    <div style={ui.row}>
                        <SummaryCard title="Invested Value" value={investedValue} />
                        <SummaryCard title="Current Value" value={currentValue} />
                        
                        <div style={{ ...ui.card, ...ui.flexItem }}>
                            <p style={ui.title}>Total P&L</p>
                            <h2 style={{ 
                                ...ui.value, 
                                color: totalPnl >= 0 ? "#28a745" : "#dc3545" 
                            }}>
                                {formatCurrency(totalPnl)}
                            </h2>
                            <small style={{ 
                                color: totalPnl >= 0 ? "#28a745" : "#dc3545",
                                fontWeight: "bold" 
                            }}>
                                {totalPnl >= 0 ? "▲" : "▼"} {totalPnlPercent}%
                            </small>
                        </div>
                    </div>

                    <div style={{ ...ui.row, marginTop: "20px" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
                             <div style={ui.row}>
                                <PnlCard title="Realized P&L" value={realizedPnl} />
                                <PnlCard title="Unrealized P&L" value={unrealizedPnl} />
                             </div>
                             <div style={ui.card}>
                                <Charts holdings={holdings} realizedPnl={realizedPnl} unrealizedPnl={unrealizedPnl} />
                             </div>
                        </div>
                    </div>

                    <div style={{ ...ui.card, padding: 0, overflow: "hidden", marginTop: "20px" }}>
                        <div style={{ padding: "15px 20px", borderBottom: "1px solid #eee" }}>
                             <h3 style={{ margin: 0, fontSize: "16px" }}>Holdings ({holdings.length})</h3>
                        </div>
                        {holdings.length === 0 ? (
                            <p style={{ padding: "40px", textAlign: "center", color: "#888" }}>No holdings found.</p>
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
                                                <tr key={h.id}>
                                                    <td style={ui.td}><span style={{color: "#387ed1"}}>{h.name}</span></td>
                                                    <td style={ui.td}>{h.qty}</td>
                                                    <td style={ui.td}>{formatCurrency(h.avg)}</td>
                                                    <td style={ui.td}>{formatCurrency(h.price)}</td>
                                                    <td style={ui.td}>{formatCurrency(current)}</td>
                                                    <td style={{ ...ui.td, color: pnl >= 0 ? "#28a745" : "#dc3545" }}>
                                                        {formatCurrency(pnl)}
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
        </>
    );
}

const SummaryCard = ({ title, value }) => (
    <div style={{ ...ui.card, ...ui.flexItem }}>
        <p style={ui.title}>{title}</p>
        <h2 style={ui.value}>{formatCurrency(value)}</h2>
    </div>
);

const PnlCard = ({ title, value }) => (
    <div style={{ ...ui.card, ...ui.flexItem }}>
        <p style={ui.title}>{title}</p>
        <h3 style={{ ...ui.value, color: value >= 0 ? "#28a745" : "#dc3545" }}>
            {formatCurrency(value)}
        </h3>
    </div>
);

export default Dashboard;