import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import API from "../services/api";
import * as ui from "../styles/style";

function TradingChart({ symbol, currentPrice }) {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const lastCandleRef = useRef(null);

    const [timeframe, setTimeframe] = useState("1D");
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(true);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: "#1e1e1e" },
                textColor: "#a0a0a0"
            },
            grid: {
                vertLines: { color: "#2c2c2e" },
                horzLines: { color: "#2c2c2e" }
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                timeVisible: timeframe === "1D" || timeframe === "1W",
                secondsVisible: false,
                rightOffset: 5,
                barSpacing: timeframe === "1D" ? 8 : 12,
            },
            crosshair: { mode: 1 },
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: ui.theme.success, 
            downColor: ui.theme.danger,
            borderVisible: false, 
            wickUpColor: ui.theme.success, 
            wickDownColor: ui.theme.danger,
        });
        
        seriesRef.current = candlestickSeries;

        const fetchChartData = async () => {
            setLoading(true);
            setHasData(true);
            try {
                const resolutionMap = {
                    "1D": "5M",
                    "1W": "1H",
                    "1M": "1D",
                    "1Y": "1W" 
                };
                
                const apiResolution = resolutionMap[timeframe];
                const res = await API.get(`/api/chart/${symbol}/${apiResolution}`);
                let histData = res.data;

                if (histData && histData.length > 0) {
                    
                    histData = histData.map(d => ({
                        time: Number(d.time),
                        open: Number(d.open),
                        high: Number(d.high),
                        low: Number(d.low),
                        close: Number(d.close)
                    }));

                    histData.sort((a, b) => a.time - b.time);

                    if (timeframe === "1D") {
                        const lastCandleDate = new Date(histData[histData.length - 1].time * 1000).toDateString();
                        histData = histData.filter(candle => {
                            return new Date(candle.time * 1000).toDateString() === lastCandleDate;
                        });
                    }

                    candlestickSeries.setData(histData);
                    lastCandleRef.current = histData[histData.length - 1];

                    chart.timeScale().fitContent();
                    setHasData(true);
                } else {
                    setHasData(false);
                }
            } catch (err) {
                console.error("Failed to load chart data", err);
                setHasData(false);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();

        const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
            chartRef.current = null;
        };
    }, [symbol, timeframe]);

    useEffect(() => {
        if (!seriesRef.current || !lastCandleRef.current || currentPrice === 0 || loading || !hasData) return;

        const lastCandle = lastCandleRef.current;
        const nowUnix = Math.floor(Date.now() / 1000);

        const intervalMap = { "1D": 300, "1W": 3600, "1M": 86400, "1Y": 604800 };
        const interval = intervalMap[timeframe];

        // Apply +5:30 IST offset 
        const istOffset = 19800; 
        const adjustedNow = nowUnix + istOffset;
        
        const currentBracket = (adjustedNow - (adjustedNow % interval)) - istOffset;

        let updatedCandle;

        if (currentBracket > lastCandle.time) {
            updatedCandle = {
                time: currentBracket, 
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice
            };
        } else {
            updatedCandle = {
                ...lastCandle,
                close: currentPrice,
                high: Math.max(lastCandle.high, currentPrice),
                low: Math.min(lastCandle.low, currentPrice),
            };
        }

        seriesRef.current.update(updatedCandle);
        lastCandleRef.current = updatedCandle;


    }, [currentPrice, timeframe, loading, hasData]);

    const getBtnStyle = (tf) => ({
        background: timeframe === tf ? "rgba(56, 126, 209, 0.2)" : "transparent",
        color: timeframe === tf ? ui.theme.primary : "#888",
        border: timeframe === tf ? `1px solid ${ui.theme.primary}` : "1px solid transparent",
        padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px",
        fontWeight: timeframe === tf ? "bold" : "normal", transition: "all 0.2s"
    });

    return (
        <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "12px", border: `1px solid ${ui.theme.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "15px" }}>
                    <h2 style={{ margin: 0, color: ui.theme.textMain, fontSize: "24px" }}>{symbol}</h2>
                    <h3 style={{ margin: 0, color: ui.theme.success, fontSize: "20px" }}>
                        ₹{currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"}
                    </h3>
                </div>
                <div style={{ display: "flex", gap: "5px", backgroundColor: "#111", padding: "4px", borderRadius: "6px" }}>
                    <button style={getBtnStyle("1D")} onClick={() => setTimeframe("1D")}>1D</button>
                    <button style={getBtnStyle("1W")} onClick={() => setTimeframe("1W")}>1W</button>
                    <button style={getBtnStyle("1M")} onClick={() => setTimeframe("1M")}>1M</button>
                    <button style={getBtnStyle("1Y")} onClick={() => setTimeframe("1Y")}>1Y</button>
                </div>
            </div>

            <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "8px", overflow: "hidden" }}>
                {loading && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#1e1e1e", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
                        Loading live market data...
                    </div>
                )}
                {!loading && !hasData && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#1e1e1e", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#dc3545" }}>
                        No chart data available for this timeframe.
                    </div>
                )}
                <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
            </div>
        </div>
    );
}

export default TradingChart;