import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";
import * as ui from "../styles/style";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  
  // UI State
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg: '' }

  const fetchOrders = () => {
    API.get("/api/orders")
      .then((res) => setOrders(res.data))
      .catch(() => showFeedback("error", "Failed to load orders history"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const placeOrder = async (mode) => {
    if (!name || !qty || !price) {
      showFeedback("error", "Please fill all fields.");
      return;
    }

    setProcessing(true);
    setFeedback(null);

    try {
      await API.post("/api/orders", {
        name: name.toUpperCase(), // Best practice to uppercase symbols
        qty: Number(qty),
        price: Number(price),
        mode,
      });

      showFeedback("success", `${mode} order placed successfully!`);
      setName(""); setQty(""); setPrice("");
      fetchOrders(); // Refresh table
    } catch (err) {
      showFeedback("error", err.response?.data || "Order failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={ui.page}>
        <div style={ui.container}>
            <h2 style={{ marginBottom: "25px", fontSize: "22px" }}>Orders</h2>

            <div style={{ ...ui.row, alignItems: "flex-start" }}>
                
                {/*  LEFT: PLACE ORDER FORM */}
                <div style={{ ...ui.card, flex: "1 1 300px", maxWidth: "400px" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#444" }}>Place Order</h3>

                    {/* Feedback Message */}
                    {feedback && (
                        <div style={{
                            padding: "10px",
                            marginBottom: "15px",
                            borderRadius: "4px",
                            fontSize: "14px",
                            backgroundColor: feedback.type === "success" ? "#d4edda" : "#f8d7da",
                            color: feedback.type === "success" ? "#155724" : "#721c24",
                            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : "#f5c6cb"}`
                        }}>
                            {feedback.msg}
                        </div>
                    )}

                    <label style={label}>Instrument</label>
                    <input 
                        style={ui.input} 
                        placeholder="e.g. RELIANCE" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                    />

                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={label}>Qty</label>
                            <input 
                                style={ui.input} 
                                type="number" 
                                placeholder="0" 
                                value={qty} 
                                onChange={(e) => setQty(e.target.value)} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={label}>Price</label>
                            <input 
                                style={ui.input} 
                                type="number" 
                                placeholder="0.00" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "15px", marginTop: "10px" }}>
                        <button
                            disabled={processing}
                            onClick={() => placeOrder("BUY")}
                            style={{ 
                                ...ui.button, 
                                backgroundColor: "#387ed1", // Blue for Buy
                                opacity: processing ? 0.7 : 1 
                            }}
                        >
                            {processing ? "..." : "BUY"}
                        </button>

                        <button
                            disabled={processing}
                            onClick={() => placeOrder("SELL")}
                            style={{ 
                                ...ui.button, 
                                backgroundColor: "#df514c", // Red for Sell
                                opacity: processing ? 0.7 : 1 
                            }}
                        >
                            {processing ? "..." : "SELL"}
                        </button>
                    </div>
                </div>

                {/*  RIGHT: ORDER HISTORY TABLE */}
                <div style={{ ...ui.card, flex: "2 1 400px", padding: 0, overflow: "hidden" }}>
                    <div style={{ padding: "15px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ margin: 0, fontSize: "16px" }}>Order Book</h3>
                        <span style={{ fontSize: "12px", color: "#888" }}>{orders.length} orders</span>
                    </div>

                    {loading ? (
                        <p style={{ padding: "30px", textAlign: "center" }}>Loading...</p>
                    ) : orders.length === 0 ? (
                        <div style={{ padding: "50px", textAlign: "center", color: "#888" }}>
                            <p>No orders placed yet.</p>
                        </div>
                    ) : (
                        <div style={ui.tableContainer}>
                            <table style={ui.table}>
                                <thead>
                                    <tr>
                                        
                                        <th style={ui.th}>Type</th>
                                        <th style={ui.th}>Instrument</th>
                                        <th style={ui.th}>Qty</th>
                                        <th style={ui.th}>Price</th>
                                        <th style={ui.th}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((o) => (
                                        <tr key={o.id}>
                                            
                                            <td style={ui.td}>
                                                <span style={{
                                                    color: o.mode === "BUY" ? "#387ed1" : "#df514c",
                                                    fontWeight: "bold",
                                                    background: o.mode === "BUY" ? "#e8f2ff" : "#fdf1f1",
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "11px"
                                                }}>
                                                    {o.mode}
                                                </span>
                                            </td>
                                            <td style={ui.td}><b>{o.name}</b></td>
                                            <td style={ui.td}>{o.qty}</td>
                                            <td style={ui.td}>₹{o.price}</td>
                                            <td style={ui.td}>
                                                <span style={{
                                                    background: "#e6fffa", 
                                                    color: "#009688", 
                                                    padding: "4px 8px", 
                                                    borderRadius: "4px", 
                                                    fontSize: "11px",
                                                    fontWeight: "600"
                                                }}>
                                                    EXECUTED
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
      </div>
    </>
  );
}

// Small helper style for labels
const label = {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#666",
    marginBottom: "5px",
    marginLeft: "2px"
};

export default Orders;