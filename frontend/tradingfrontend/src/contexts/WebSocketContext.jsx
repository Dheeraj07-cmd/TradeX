import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";

const WebSocketContext = createContext(null);

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
    const clientRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token") || localStorage.getItem("jwt");
        if (!token || token === "null") return;

        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const wsUrl = baseUrl.startsWith("https") ? baseUrl.replace("https", "wss") : baseUrl.replace("http", "ws");

        const client = new Client({
            brokerURL: `${wsUrl}/ws`,
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("🟢 Global WebSocket Connected");
                setIsConnected(true);
            },
            onDisconnect: () => {
                console.log("🔴 Global WebSocket Disconnected");
                setIsConnected(false);
            },
            onStompError: (frame) => {
                console.error("Broker error: ", frame.headers['message']);
            }
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, []);

    // Safe subscription helper
    const subscribe = (destination, callback) => {
        if (clientRef.current && clientRef.current.connected) {
            return clientRef.current.subscribe(destination, callback);
        }
        return null;
    };

    return (
        <WebSocketContext.Provider value={{ client: clientRef.current, isConnected, subscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};