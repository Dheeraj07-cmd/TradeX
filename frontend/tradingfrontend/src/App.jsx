import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Positions from "./pages/Positions";
import Orders from "./pages/Orders";
import Signup from "./pages/Signup";
import "./App.css";


function App() {
  
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/positions" element={<Positions />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  );
}

export default App;
