import * as ui from "../styles/style";

function MarketDepth({ depthPack, currentPrice }) {
    // Elegant placeholder state for when webSockets are establishing context
    if (!depthPack || !depthPack.bids || depthPack.bids.length === 0) {
        return (
            <div style={{ backgroundColor: "#1e1e1e", borderRadius: "8px", border: `1px solid ${ui.theme.border}`, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "13px" }}>
                Connecting to order book...
            </div>
        );
    }

    const { bids, asks, totalBidQty, totalAskQty, spread } = depthPack;
    const totalVolume = totalBidQty + totalAskQty;
    const bidPercentage = totalVolume > 0 ? ((totalBidQty / totalVolume) * 100).toFixed(1) : 50;

    return (
        <div style={{ backgroundColor: "#1e1e1e", borderRadius: "8px", border: `1px solid ${ui.theme.border}`, overflow: "hidden", height: "100%", fontFamily: "monospace" }}>
            {/* Header Tracker */}
            <div style={{ padding: "12px 15px", backgroundColor: "#151515", borderBottom: `1px solid ${ui.theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "13px", color: "#e0e0e0", fontWeight: "600" }}>Market Depth</h3>
                <span style={{ fontSize: "11px", color: "#888" }}>Spread: <span style={{ color: "#fff" }}>₹{spread.toFixed(2)}</span></span>
            </div>

            {/* Grid Engine */}
            <div style={{ display: "flex", fontSize: "12px" }}>
                {/* BIDS (BUYERS) */}
                <div style={{ flex: 1, borderRight: `1px solid ${ui.theme.border}` }}>
                    <div style={{ display: "flex", padding: "8px 10px", color: "#666", borderBottom: `1px solid #2a2a2a`, fontSize: "11px" }}>
                        <span style={{ flex: 1.2 }}>Bid Price</span>
                        <span style={{ flex: 0.8, textAlign: "right" }}>Orders</span>
                        <span style={{ flex: 1, textAlign: "right" }}>Qty</span>
                    </div>
                    {bids.map((bid, i) => (
                        <div key={i} style={{ display: "flex", padding: "6px 10px", position: "relative" }}>
                            <span style={{ flex: 1.2, color: ui.theme.success, fontWeight: "600", zIndex: 2 }}>{bid.price.toFixed(2)}</span>
                            <span style={{ flex: 0.8, textAlign: "right", color: "#aaa", zIndex: 2 }}>{bid.orders}</span>
                            <span style={{ flex: 1, textAlign: "right", color: "#eee", zIndex: 2 }}>{bid.qty.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                    <div style={{ padding: "12px 10px", color: ui.theme.success, fontWeight: "bold", borderTop: `1px solid #2a2a2a`, fontSize: "11px" }}>
                        Total: {totalBidQty.toLocaleString('en-IN')}
                    </div>
                </div>

                {/* ASKS (SELLERS) */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", padding: "8px 10px", color: "#666", borderBottom: `1px solid #2a2a2a`, fontSize: "11px" }}>
                        <span style={{ flex: 1.2 }}>Ask Price</span>
                        <span style={{ flex: 0.8, textAlign: "right" }}>Orders</span>
                        <span style={{ flex: 1, textAlign: "right" }}>Qty</span>
                    </div>
                    {asks.map((ask, i) => (
                        <div key={i} style={{ display: "flex", padding: "6px 10px", position: "relative" }}>
                            <span style={{ flex: 1.2, color: ui.theme.danger, fontWeight: "600", zIndex: 2 }}>{ask.price.toFixed(2)}</span>
                            <span style={{ flex: 0.8, textAlign: "right", color: "#aaa", zIndex: 2 }}>{ask.orders}</span>
                            <span style={{ flex: 1, textAlign: "right", color: "#eee", zIndex: 2 }}>{ask.qty.toLocaleString('en-IN')}</span>
                        </div>
                    ))}
                    <div style={{ padding: "12px 10px", color: ui.theme.danger, fontWeight: "bold", borderTop: `1px solid #2a2a2a`, fontSize: "11px" }}>
                        Total: {totalAskQty.toLocaleString('en-IN')}
                    </div>
                </div>
            </div>

            {/* Institutional Liquidity Pressure Metrics */}
            <div style={{ padding: "10px 15px", backgroundColor: "#151515", borderTop: `1px solid ${ui.theme.border}`, display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888" }}>
                <span>Buy Strength: <span style={{ color: ui.theme.success, fontWeight: "bold" }}>{bidPercentage}%</span></span>
                <span>Sell Strength: <span style={{ color: ui.theme.danger, fontWeight: "bold" }}>{(100 - bidPercentage).toFixed(1)}%</span></span>
            </div>

            {/* Visual Pressure Tracker Strip */}
            <div style={{ display: "flex", height: "5px", width: "100%", backgroundColor: "#333" }}>
                <div style={{ width: `${bidPercentage}%`, backgroundColor: ui.theme.success, transition: "width 0.4s cubic-bezier(0.25, 1, 0.5, 1)" }} />
                <div style={{ width: `${100 - bidPercentage}%`, backgroundColor: ui.theme.danger, transition: "width 0.4s cubic-bezier(0.25, 1, 0.5, 1)" }} />
            </div>
        </div>
    );
}

export default MarketDepth;