import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import * as ui from "../styles/style";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Client } from "@stomp/stompjs";

function Watchlist({ openOrderModal }) {
    const [watchlist, setWatchlist] = useState([]);
    const [tabs, setTabs] = useState(["Watchlist 1"]);
    const [activeTab, setActiveTab] = useState("Watchlist 1");
    const [hoveredRow, setHoveredRow] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const stompClientRef = useRef(null);

    const fetchTabs = async () => {
        try {
            const res = await API.get("/api/watchlist/tabs");
            let dbTabs = res.data || [];
            const localTabs = JSON.parse(localStorage.getItem("userTabs")) || [];
            const mergedTabs = [...new Set([...dbTabs, ...localTabs])];
            if (mergedTabs.length === 0) mergedTabs.push("Watchlist 1");

            setTabs(mergedTabs);
            localStorage.setItem("userTabs", JSON.stringify(mergedTabs));
            if (!mergedTabs.includes(activeTab)) setActiveTab(mergedTabs[0]);
        } catch (err) { console.error("Failed to load tabs", err); }
    };

    useEffect(() => {
        fetchTabs();
        window.addEventListener("watchlistUpdated", fetchTabs);
        return () => window.removeEventListener("watchlistUpdated", fetchTabs);
    }, []);

    const fetchInitialWatchlist = async (tabName) => {
        try {
            const res = await API.get(`/api/watchlist?listName=${tabName}`);
            setWatchlist(res.data);
            return res.data;
        } catch (err) { return []; }
    };

    // Single Subscription
    useEffect(() => {
        let isMounted = true;

        const initializeLiveStream = async () => {
            await fetchInitialWatchlist(activeTab);
            if (!isMounted) return;

            const token = localStorage.getItem("token") || localStorage.getItem("jwt");
            if (!token || token === "null") return;

            const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
            const wsUrl = baseUrl.startsWith("https") ? baseUrl.replace("https", "wss") : baseUrl.replace("http", "ws");

            const client = new Client({
                brokerURL: `${wsUrl}/ws`,
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 5000,
                onConnect: () => {
                    client.subscribe("/topic/market-prices", (message) => {
                        if (!message.body) return;
                        const livePrices = JSON.parse(message.body);

                        setWatchlist(currentList => {
                            let hasChanges = false;
                            const newList = currentList.map(item => {
                                if (livePrices[item.symbol]) {
                                    const newLivePrice = parseFloat(livePrices[item.symbol]);
                                    if (newLivePrice !== item.price) {
                                        hasChanges = true;
                                        const isUp = newLivePrice >= item.price;
                                        const newChange = item.basePrice > 0 ? ((newLivePrice - item.basePrice) / item.basePrice) * 100 : 0;
                                        const flashColor = isUp ? "rgba(40, 167, 69, 0.25)" : "rgba(220, 53, 69, 0.25)";

                                        setTimeout(() => {
                                            if (isMounted) {
                                                setWatchlist(list => list.map(s => s.symbol === item.symbol ? { ...s, flashColor: "transparent" } : s));
                                            }
                                        }, 400);

                                        return { ...item, price: newLivePrice, changePercent: newChange, flashColor };
                                    }
                                }
                                return item;
                            });
                            return hasChanges ? newList : currentList;
                        });
                    });
                }
            });

            stompClientRef.current = client;
            client.activate();
        };

        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
        }

        initializeLiveStream();

        const handleWatchlistUpdate = () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
            fetchTabs();
            initializeLiveStream();
        };

        window.addEventListener("watchlistUpdated", handleWatchlistUpdate);

        return () => {
            isMounted = false;
            window.removeEventListener("watchlistUpdated", handleWatchlistUpdate);
            if (stompClientRef.current) stompClientRef.current.deactivate();
        };
    }, [activeTab]);

    const handleTrade = (e, instrument, mode) => {
        e.stopPropagation();
        openOrderModal(instrument, mode);
    };

    const handleRemove = async (e, symbol) => {
        e.stopPropagation();
        try {
            const res = await API.delete(`/api/watchlist/remove/${symbol}?listName=${activeTab}`);
            toast.success(res.data.message);
            setWatchlist(prev => prev.filter(s => s.symbol !== symbol));
            fetchTabs();
        } catch (err) { toast.error("Failed to remove stock"); }
    };

    const createNewTab = () => {
        const newTabName = prompt("Enter a name for your new Watchlist:");
        if (newTabName && newTabName.trim() !== "") {
            const cleanName = newTabName.trim();
            if (!tabs.includes(cleanName)) {
                const updatedTabs = [...tabs, cleanName];
                setTabs(updatedTabs);
                localStorage.setItem("userTabs", JSON.stringify(updatedTabs));
            }
            setActiveTab(cleanName);
        }
    };

    const filteredWatchlist = watchlist.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stock.companyName && stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div style={watchlistContainer}>
            <div style={searchHeader}>
                <input type="text" placeholder="Search eg: TCS, INFY" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...ui.input, marginBottom: 0, border: "none", backgroundColor: "#2c2c2e" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #333", backgroundColor: "#151515" }}>
                <div style={{ display: "flex", overflowX: "auto", flex: 1, scrollbarWidth: "none" }}>
                    {tabs.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            style={{
                                padding: "10px 15px", backgroundColor: "transparent", border: "none",
                                borderBottom: activeTab === tab ? `2px solid ${ui.theme.primary}` : "2px solid transparent",
                                color: activeTab === tab ? ui.theme.primary : "#888", cursor: "pointer",
                                fontWeight: activeTab === tab ? "bold" : "normal", whiteSpace: "nowrap", fontSize: "12px",
                                transition: "all 0.2s"
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <button onClick={createNewTab}
                    style={{ padding: "0 15px", backgroundColor: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>
                    +
                </button>
            </div>

            <div style={listContainer}>
                {watchlist.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#666", padding: "20px" }}>"{activeTab}" is empty.<br /><br />Add stocks from the charts page!</p>
                ) : filteredWatchlist.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No stocks match "{searchQuery}"</p>
                ) : (
                    filteredWatchlist.map((stock) => (
                        <div key={stock.symbol}
                            style={{
                                ...listItem(hoveredRow === stock.symbol),
                                backgroundColor: stock.flashColor || (hoveredRow === stock.symbol ? "#2c2c2e" : "transparent"),
                                transition: "background-color 0.4s ease-out"
                            }}
                            onMouseEnter={() => setHoveredRow(stock.symbol)}
                            onMouseLeave={() => setHoveredRow(null)}
                            onClick={() => navigate(`/stock/${stock.symbol}`)}
                        >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ color: (stock.changePercent || 0) >= 0 ? "#28a745" : "#dc3545", fontSize: "14px", fontWeight: "600" }}>{stock.symbol}</span>
                                <span style={{ fontSize: "10px", color: "#666", display: "block", marginTop: "2px" }}>{stock.companyName || "NSE"}</span>
                            </div>

                            {hoveredRow === stock.symbol ? (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={(e) => handleTrade(e, stock.symbol, "BUY")} style={buyBtn}>B</button>
                                    <button onClick={(e) => handleTrade(e, stock.symbol, "SELL")} style={sellBtn}>S</button>
                                    <button onClick={(e) => handleRemove(e, stock.symbol)} style={removeBtn}>✕</button>
                                </div>
                            ) : (
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ color: (stock.changePercent || 0) >= 0 ? "#28a745" : "#dc3545", fontSize: "14px", fontWeight: "500" }}>
                                        {stock.price ? stock.price.toFixed(2) : "0.00"}
                                    </span>
                                    <span style={{ display: "block", fontSize: "11px", color: "#888", marginTop: "2px" }}>
                                        {(stock.changePercent || 0) > 0 ? "+" : ""}{(stock.changePercent || 0).toFixed(2)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const watchlistContainer = { width: "350px", backgroundColor: "#1e1e1e", borderRight: "1px solid #333", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", position: "sticky", top: "60px" };
const searchHeader = { padding: "15px", borderBottom: "1px solid #333" };
const listContainer = { flex: 1, overflowY: "auto" };
const listItem = (isHovered) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid #2a2a2a", cursor: "pointer", backgroundColor: isHovered ? "#2c2c2e" : "transparent", transition: "background 0.2s" });
const actionBtn = { border: "none", color: "white", borderRadius: "4px", width: "30px", height: "30px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const buyBtn = { ...actionBtn, backgroundColor: "#387ed1" };
const sellBtn = { ...actionBtn, backgroundColor: "#dc3545" };
const removeBtn = { ...actionBtn, backgroundColor: "transparent", border: "1px solid #666", color: "#888" };

export default Watchlist;