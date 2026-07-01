import { Routes, Route, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Positions from "./pages/Positions";
import Funds from "./pages/Funds";
import StockDetails from "./pages/StockDetails";
import Orders from "./pages/Orders";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";
import MarketFeed from "./pages/MarketFeed";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import { WebSocketProvider } from "./contexts/WebSocketContext";

import "./App.css";

// ✅ THE FIX: Create a Private wrapper that enforces the Layout and the WebSocket
// This ensures the WebSocket only connects when the user is inside the main application.
const PrivateLayout = () => {
  return (
    <WebSocketProvider>
      <Layout>
        <Outlet />
      </Layout>
    </WebSocketProvider>
  );
};

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2c2c2e',
            color: '#fff',
            border: '1px solid #333'
          }
        }}
      />
      
      <Routes>
        {/* Public Routes - No WebSockets allowed here */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes - The WebSocket connects seamlessly once inside */}
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/funds" element={<Funds />} />
          <Route path="/stock/:symbol" element={<StockDetails />} />
          <Route path="/market-feed" element={<MarketFeed />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;