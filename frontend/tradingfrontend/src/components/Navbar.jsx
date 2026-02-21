import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getLinkStyle = (path) => ({
    ...link,
    color: location.pathname === path ? "#387ed1" : "#a0a0a0", 
    fontWeight: location.pathname === path ? "bold" : "normal",
  });

  return (
    <div style={nav}>
      <h3 style={{ margin: 0, color: "#387ed1" }}>TradeX</h3>

      <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
        <Link to="/dashboard" style={getLinkStyle("/dashboard")}>Dashboard</Link>
        <Link to="/orders" style={getLinkStyle("/orders")}>Orders</Link>
        <Link to="/positions" style={getLinkStyle("/positions")}>Positions</Link>
        
        <button 
          onClick={logout} 
          style={logoutBtn}
          onMouseOver={(e) => (e.target.style.background = "rgba(255, 77, 79, 0.1)")}
          onMouseOut={(e) => (e.target.style.background = "transparent")}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

const nav = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "15px 40px",
  background: "#1e1e1e", 
  borderBottom: "1px solid #333", 
  position: "sticky",
  top: 0,
  zIndex: 100,
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
};

const link = {
  textDecoration: "none",
  fontSize: "15px",
  transition: "color 0.2s",
};

const logoutBtn = {
  border: "1px solid #ff4d4f",
  background: "transparent",
  color: "#ff4d4f",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s",
};

export default Navbar;