import { Link, useLocation, useNavigate } from "react-router-dom";
import * as ui from "../styles/style";
import SearchBar from "./SearchBar";
import MarketStatusBar from "./MarketStatusBar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem("username") || "User";
  const initial = username.charAt(0).toUpperCase();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getLinkStyle = (path) => ({
    ...link,
    color: location.pathname === path ? ui.theme.primary : "#a0a0a0",
    fontWeight: location.pathname === path ? "600" : "500",
    borderBottom: location.pathname === path ? `2px solid ${ui.theme.primary}` : "2px solid transparent",
    padding: "18px 0px",
  });

  return (
    <div style={navbarWrapper}>

      <MarketStatusBar />

      <div style={navRow}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          <div style={{
            width: "28px", height: "28px",
            backgroundColor: ui.theme.primary, borderRadius: "4px",
            display: "flex", justifyContent: "center", alignItems: "center",
            color: "white", fontWeight: "900", fontSize: "16px"
          }}>
            T
          </div>

          <h3 style={{ margin: 0, fontSize: "18px", letterSpacing: "0.5px", color: ui.theme.textMain }}>
            Trade<span style={{ color: ui.theme.primary }}>X</span>
          </h3>
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 20px" }}>
          <SearchBar />
        </div>

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
          <Link to="/dashboard" style={getLinkStyle("/dashboard")}>Dashboard</Link>
          <Link to="/orders" style={getLinkStyle("/orders")}>Orders</Link>
          <Link to="/positions" style={getLinkStyle("/positions")}>Positions</Link>
          <Link to="/funds" style={getLinkStyle("/funds")}>Funds</Link>
        </div>

        {/* Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              backgroundColor: "rgba(56, 126, 209, 0.1)",
              color: ui.theme.primary, border: `1px solid ${ui.theme.primary}`,
              display: "flex", justifyContent: "center", alignItems: "center",
              fontWeight: "bold", fontSize: "14px"
            }}>
              {initial}
            </div>
            <span style={{ fontSize: "13px", fontWeight: "500", color: ui.theme.textMain }}>{username}</span>
          </div>

          <button
            onClick={logout}
            style={logoutBtn}
            onMouseOver={(e) => { e.target.style.color = ui.theme.danger; e.target.style.borderColor = ui.theme.danger; }}
            onMouseOut={(e) => { e.target.style.color = ui.theme.textLight; e.target.style.borderColor = ui.theme.border; }}
          >
            Logout
          </button>
        </div>

      </div>
    </div>
  );
}


const navbarWrapper = { position: "sticky", top: 0, zIndex: 1000, background: ui.theme.cardBg, borderBottom: `1px solid ${ui.theme.border}`, display: "flex", flexDirection: "column", };
const navRow = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 25px", height: "56px", };
const link = { textDecoration: "none", fontSize: "14px", transition: "all 0.2s", };
const logoutBtn = { background: "transparent", border: `1px solid ${ui.theme.border}`, color: ui.theme.textLight, padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.2s" };

export default Navbar;