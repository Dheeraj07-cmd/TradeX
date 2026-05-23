import { useEffect, useState } from "react";
import API from "../services/api";
import * as ui from "../styles/style";

function Orders({ openOrderModal }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/api/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={ui.page}>
      <div style={ui.container}>
        <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Order Book</h2>

        <div style={{ ...ui.card, padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: "30px", textAlign: "center" }}>Loading orders...</p>
          ) : orders.length === 0 ? (
            <div style={{ padding: "80px", textAlign: "center", color: "#888" }}>
              <p>You haven't placed any orders today.</p>
            </div>
          ) : (
            <div style={ui.tableContainer}>
              <table style={ui.table}>
                <thead>
                  <tr style={{ backgroundColor: "#1a1a1a" }}>
                    <th style={ui.th}>Time</th>
                    <th style={ui.th}>Type</th>
                    <th style={ui.th}>Instrument</th>
                    <th style={ui.th}>Qty.</th>
                    <th style={ui.th}>Price</th>
                    <th style={ui.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="hover-row">
                      <td style={ui.td}>
                        <span style={{ color: "#888", fontSize: "12px" }}>
                          {o.orderDate || "Just now"}
                        </span>
                      </td>
                      <td style={ui.td}>
                        <span style={{
                          color: o.mode === "BUY" ? "#387ed1" : "#df514c",
                          fontWeight: "bold",
                          background: o.mode === "BUY" ? "rgba(56, 126, 209, 0.1)" : "rgba(223, 81, 76, 0.1)",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px"
                        }}>
                          {o.mode}
                        </span>
                      </td>
                      <td style={ui.td}>
                        <span style={{ color: "#387ed1", fontWeight: "600" }}>{o.name}</span>
                        <span style={{ display: "block", fontSize: "10px", color: "#666" }}>NSE</span>
                      </td>
                      <td style={ui.td}>{o.qty} / {o.qty}</td>
                      <td style={ui.td}>₹{o.price.toFixed(2)}</td>
                      <td style={ui.td}>
                        <span style={{
                          color: "#009688",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          COMPLETE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;