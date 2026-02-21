import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import API from "../services/api";
import Navbar from "../components/Navbar";
import * as ui from "../styles/style";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { formatCurrency } from "../utils/helpers";

function Positions() {
  const [positions, setPositions] = useState([]);
  const navigate = useNavigate(); 

  // 1. Calculate Portfolio Totals
  const totalInvested = positions.reduce((acc, p) => acc + (p.avg * p.qty), 0);
  const totalCurrent = positions.reduce((acc, p) => acc + (p.price * p.qty), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : 0;

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchPositions = async () => {
      try {
        const res = await API.get("/api/positions");
        setPositions(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPositions();

    const socket = new SockJS("https://tradex-backend-kd5w.onrender.com/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/portfolio/${userId}`, () => {
          fetchPositions();
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };

  }, []);

  // 2. Interactive Handlers
  const handleExit = (stockName, qty) => {
    if(window.confirm(`Do you want to exit ${stockName}?`)) {  
        console.log("Navigating to sell", stockName);
        navigate("/orders"); 
    }
  };

  return (
    <>
      <Navbar />
      <div style={ui.page}>
        <div style={ui.container}>
          <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Portfolio</h2>

          <div style={{ ...ui.row, alignItems: "flex-start" }}>
            
            {/*  LEFT: SUMMARY CARD */}
            <div style={{ ...ui.card, flex: "1 1 300px", maxWidth: "350px", position: "sticky", top: "100px" }}>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>
                    Overall Return
                </h3>

                <div style={{ textAlign: "center", padding: "20px 0", borderBottom: "1px solid #eee" }}>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: "38px", 
                        color: totalPnl >= 0 ? "#28a745" : "#dc3545" 
                    }}>
                        {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                    </h1>
                    <div style={{
                        display: "inline-block",
                        marginTop: "10px",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        background: totalPnl >= 0 ? "#d4edda" : "#f8d7da",
                        color: totalPnl >= 0 ? "#155724" : "#721c24",
                        fontWeight: "bold",
                        fontSize: "14px"
                    }}>
                        {totalPnl >= 0 ? "▲" : "▼"} {totalPnlPercent}%
                    </div>
                </div>

                <div style={{ marginTop: "25px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                        <span style={{ color: "#666" }}>Invested Value</span>
                        <span style={{ fontWeight: "600" }}>{formatCurrency(totalInvested)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                        <span style={{ color: "#666" }}>Current Value</span>
                        <span style={{ fontWeight: "600" }}>{formatCurrency(totalCurrent)}</span>
                    </div>
                </div>
            </div>

            {/*  RIGHT: POSITIONS TABLE */}
            <div style={{ ...ui.card, flex: "2 1 400px", padding: 0, overflow: "hidden" }}>
              {positions.length === 0 ? (
                <div style={{ padding: "50px", textAlign: "center", color: "#888" }}>
                  <p>No open positions.</p>
                  <button style={{...ui.button, width: "auto", marginTop: "10px"}} onClick={() => navigate("/orders")}>Start Trading</button>
                </div>
              ) : (
                <div style={ui.tableContainer}>
                  <table style={ui.table}>
                    <thead>
                      <tr>
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
                                <span style={{ color: "#387ed1", fontWeight: "600", fontSize: "15px" }}>{p.name}</span>
                                <span style={{ display: "block", fontSize: "11px", color: "#999", marginTop: "2px" }}>NSE</span>
                            </td>
                            <td style={ui.td}>
                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "13px" }}>{p.qty}</span>
                            </td>
                            <td style={ui.td}>{formatCurrency(p.avg)}</td>
                            <td style={{...ui.td, fontWeight: "500"}}>{formatCurrency(p.price)}</td>
                            
                            
                            <td style={ui.td}>
                                <span style={{ color: pnl >= 0 ? "#28a745" : "#dc3545", fontWeight: "600" }}>
                                    {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                                </span>
                                <span style={{ display: "block", fontSize: "11px", color: pnl >= 0 ? "#28a745" : "#dc3545" }}>
                                    {pnlPerc}%
                                </span>
                            </td>

                            
                            <td style={ui.td}>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button 
                                        title="Buy More"
                                        onClick={() => navigate("/orders")}
                                        style={{
                                            border: "1px solid #387ed1",
                                            background: "transparent",
                                            color: "#387ed1",
                                            borderRadius: "4px",
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}
                                        onMouseOver={(e) => e.target.style.background = "#e8f2ff"}
                                        onMouseOut={(e) => e.target.style.background = "transparent"}
                                    > + Add
                                    </button>
                                    <button 
                                        title="Exit Position"
                                        onClick={() => handleExit(p.name, p.qty)}
                                        style={{
                                            border: "1px solid #dc3545",
                                            background: "transparent",
                                            color: "#dc3545",
                                            borderRadius: "4px",
                                            padding: "5px 10px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "bold"
                                        }}
                                        onMouseOver={(e) => e.target.style.background = "#fff1f0"}
                                        onMouseOut={(e) => e.target.style.background = "transparent"}>
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
    </>
  );
}

export default Positions;