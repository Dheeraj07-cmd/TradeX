import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Positions from "./pages/Positions";
import Funds from "./pages/Funds";
import StockDetails from "./pages/StockDetails";
import Orders from "./pages/Orders";
import Signup from "./pages/Signup";
import Layout from "./components/Layout";

import "./App.css";

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
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/positions" element={<Layout><Positions /></Layout>} />
        <Route path="/orders" element={<Layout><Orders /></Layout>} />
        <Route path="/funds" element={<Layout><Funds /></Layout>} />
        <Route path="/stock/:symbol" element={<Layout><StockDetails /></Layout>} />
      </Routes>
    </>
  );
}

export default App;