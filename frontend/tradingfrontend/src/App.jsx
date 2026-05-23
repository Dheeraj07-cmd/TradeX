import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Positions from "./pages/Positions";
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
      </Routes>
    </>
  );
}

export default App;