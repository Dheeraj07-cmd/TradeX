import { useState } from "react";
import API from "../services/api";
import * as ui from "../styles/style";
import toast from "react-hot-toast";

function OrderModal({ isOpen, onClose, instrument, initialMode }) {
  const [mode, setMode] = useState(initialMode || "BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isBuy = mode === "BUY";
  const themeColor = isBuy ? ui.theme.primary : ui.theme.danger;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const toastId = toast.loading(`Placing ${mode} order for ${instrument}...`);

    try {
      await API.post("/api/orders", {
        name: instrument.toUpperCase(),
        qty: Number(qty),
        price: orderType === "MARKET" ? 0 : Number(price),
        mode: mode,
      });

      toast.success(`${mode} order for ${qty} ${instrument} placed successfully!`, { id: toastId });
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error
        || err.response?.data?.message
        || (typeof err.response?.data === 'string' ? err.response.data : "Order failed.");

      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={overlay}>
      <div style={{ ...modal, borderTop: `4px solid ${themeColor}` }}>

        {/* Header */}
        <div style={header(themeColor)}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "white" }}>
            {mode} {instrument} <span style={{ fontSize: "12px", color: "#aaa", fontWeight: "normal" }}>NSE</span>
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px" }}>
              <input type="radio" checked={isBuy} onChange={() => setMode("BUY")} /> Buy
            </span>
            <span style={{ fontSize: "12px" }}>
              <input type="radio" checked={!isBuy} onChange={() => setMode("SELL")} /> Sell
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>

          {/* Order Type */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
            <label style={radioLabel(orderType === "MARKET", themeColor)}>
              <input type="radio" name="type" checked={orderType === "MARKET"} onChange={() => setOrderType("MARKET")} style={{ display: "none" }} />
              Market
            </label>
            <label style={radioLabel(orderType === "LIMIT", themeColor)}>
              <input type="radio" name="type" checked={orderType === "LIMIT"} onChange={() => setOrderType("LIMIT")} style={{ display: "none" }} />
              Limit
            </label>
          </div>

          {/* Inputs */}
          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={ui.title}>Qty</label>
              <input
                type="number"
                min="1"
                style={{ ...ui.input, marginBottom: 0, fontSize: "16px" }}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={ui.title}>Price</label>
              <input
                type="number"
                step="0.05"
                disabled={orderType === "MARKET"}
                style={{ ...ui.input, marginBottom: 0, fontSize: "16px", opacity: orderType === "MARKET" ? 0.5 : 1 }}
                value={orderType === "MARKET" ? 0 : price}
                onChange={(e) => setPrice(e.target.value)}
                required={orderType === "LIMIT"}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "30px" }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={{ ...ui.button, width: "auto", margin: 0, backgroundColor: themeColor }}>
              {loading ? "Processing..." : `Place ${mode} Order`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)",
};

const modal = {
  backgroundColor: ui.theme.cardBg, width: "100%", maxWidth: "450px",
  borderRadius: "6px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", overflow: "hidden",
};

const header = (color) => ({
  backgroundColor: "#2c2c2e", padding: "15px 20px", display: "flex",
  justifyContent: "space-between", alignItems: "center",
});

const radioLabel = (isActive, color) => ({
  fontSize: "13px", fontWeight: "600", color: isActive ? color : "#888",
  cursor: "pointer", borderBottom: isActive ? `2px solid ${color}` : "none", paddingBottom: "5px",
});

const cancelBtn = {
  background: "transparent", border: "1px solid #555", color: "#ccc",
  padding: "10px 20px", borderRadius: "4px", cursor: "pointer", fontWeight: "600",
};

export default OrderModal;