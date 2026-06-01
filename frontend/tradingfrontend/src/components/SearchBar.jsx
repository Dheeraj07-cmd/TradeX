import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import * as ui from "../styles/style";

function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const navigate = useNavigate();
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await API.get(`/api/stocks/search?query=${query}`);
                setResults(res.data);
                setShowDropdown(true);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);


    const handleSelect = (symbol) => {
        setQuery("");
        setShowDropdown(false);
        navigate(`/stock/${symbol}`);
    };

    return (
        <div ref={searchRef} style={{ position: "relative", width: "100%", maxWidth: "400px" }}>

            {/* Search */}
            <input
                type="text"
                placeholder="Search stocks (e.g. RELIANCE, Tata)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                style={{
                    ...ui.input, margin: 0, padding: "12px 20px", width: "100%",
                    boxSizing: "border-box", borderRadius: "30px", backgroundColor: "#111", border: "1px solid #333"
                }}
            />

            {/* Dropdown Menu */}
            {showDropdown && (
                <div style={{
                    position: "absolute", top: "110%", left: 0, right: 0, backgroundColor: ui.theme.cardBg,
                    border: `1px solid ${ui.theme.border}`, borderRadius: "12px", overflow: "hidden", zIndex: 1000,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.8)"
                }}>
                    {loading ? (
                        <div style={{ padding: "15px", color: "#888", textAlign: "center" }}>Searching...</div>
                    ) : results.length > 0 ? (
                        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "350px", overflowY: "auto" }}>
                            {results.map((stock) => (
                                <li key={stock.symbol}
                                    onClick={() => handleSelect(stock.symbol)}
                                    style={{
                                        padding: "12px 20px", borderBottom: `1px solid ${ui.theme.border}`,
                                        cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(56, 126, 209, 0.1)"}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                    {/* Symbol and Name */}
                                    <div>
                                        <strong style={{ color: ui.theme.primary, fontSize: "16px" }}>{stock.symbol}</strong>
                                        <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{stock.companyName}</div>
                                    </div>

                                    {/* Price and Change */}
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ color: ui.theme.textMain, fontWeight: "bold" }}>₹{stock.currentPrice.toFixed(2)}</div>
                                        <div style={{
                                            fontSize: "12px", fontWeight: "bold",
                                            color: stock.changePercent >= 0 ? ui.theme.success : ui.theme.danger
                                        }}>
                                            {stock.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ padding: "15px", color: "#888", textAlign: "center" }}>No stocks found for "{query}"</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchBar;