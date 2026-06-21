import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as ui from "../styles/style";
import SearchBar from "./SearchBar";
import MarketStatusBar from "./MarketStatusBar";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hoveredPath, setHoveredPath] = useState(null);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const username = localStorage.getItem("username") || "User";
  const initial = username.charAt(0).toUpperCase();

  // Decode JWT token to check the user's role
  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (token) {
      try {
        // JWT is split into 3 parts by dots. The middle part is data.
        // atob() decodes the Base64 string into readable JSON.
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role && payload.role.includes("ADMIN")) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Failed to decode token for role verification", error);
      }
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    const isHovered = hoveredPath === path;

    return {
      ...styles.link,
      color: isActive ? ui.theme.primary : isHovered ? ui.theme.textMain || "#ffffff" : ui.theme.textLight || "#a0a0a0",
      fontWeight: isActive ? "600" : "500",
      borderBottom: isActive ? `2px solid ${ui.theme.primary}` : isHovered ? `2px solid ${ui.theme.border || "#444"}` : "2px solid transparent",
    };
  };

  // Base navigation links for everyone
  const navLinks = ["/dashboard", "/orders", "/positions", "/funds", "/market-feed"];

  // Add Admin portal link if the user has ADMIN role
  if (isAdmin) {
    navLinks.push("/admin");
  }

  return (
    <div style={styles.navbarWrapper}>
      <MarketStatusBar />

      <div style={styles.navRow}>
        <div style={styles.logoContainer} onClick={() => navigate("/dashboard")}>
          <div style={{ ...styles.logoIcon, backgroundColor: ui.theme.primary }}>
            T
          </div>
          <h3 style={{ ...styles.logoText, color: ui.theme.textMain }}>
            Trade<span style={{ color: ui.theme.primary }}>X</span>
          </h3>
        </div>

        <div style={styles.searchWrapper}>
          <SearchBar />
        </div>

        <div style={styles.linkGroup}>
          {navLinks.map((path) => {
            const label = path.replace("/", "").replace("-", " ");
            const formalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);

            return (
              <Link key={path} to={path} style={getLinkStyle(path)} onMouseEnter={() => setHoveredPath(path)} onMouseLeave={() => setHoveredPath(null)}>
                {/* Add Admin Panel if admin login */}
                {formalizedLabel === "Market feed" ? "Terminal" : formalizedLabel === "Admin" ? "Admin Panel" : formalizedLabel}
              </Link>
            );
          })}
        </div>

        <div style={styles.profileActions}>
          <div onClick={() => navigate("/profile")} style={styles.profileClickable} title="View Profile Settings">
            <div style={{ ...styles.avatar, color: ui.theme.primary, border: `1px solid ${ui.theme.primary}` }}>
              {initial}
            </div>
            <span style={{ ...styles.username, color: ui.theme.textMain }}>
              {username}
            </span>
          </div>

          <div style={{ ...styles.divider, backgroundColor: ui.theme.border }} />

          <button onClick={logout} onMouseEnter={() => setIsLogoutHovered(true)} onMouseLeave={() => setIsLogoutHovered(false)}
            style={{
              ...styles.logoutBtn,
              borderColor: isLogoutHovered ? ui.theme.danger : ui.theme.border,
              color: isLogoutHovered ? ui.theme.danger : ui.theme.textLight,
              backgroundColor: isLogoutHovered ? "rgba(239, 68, 68, 0.05)" : "transparent"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  navbarWrapper: { position: "sticky", top: 0, zIndex: 1000, background: ui.theme.cardBg, borderBottom: `1px solid ${ui.theme.border}`, display: "flex", flexDirection: "column" },
  navRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 24px", height: "56px" },
  logoContainer: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", userSelect: "none" },
  logoIcon: { width: "26px", height: "26px", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center", color: "white", fontWeight: "900", fontSize: "15px" },
  logoText: { margin: 0, fontSize: "17px", fontWeight: "700", letterSpacing: "0.3px" },
  searchWrapper: { flex: 1, maxWidth: "400px", padding: "0 24px" },
  linkGroup: { display: "flex", gap: "24px", alignItems: "center", height: "100%" },
  link: { textDecoration: "none", fontSize: "13px", letterSpacing: "0.1px", transition: "all 0.15s ease", height: "100%", display: "flex", alignItems: "center", padding: "0 4px", boxSizing: "border-box" },
  profileActions: { display: "flex", alignItems: "center", gap: "16px" },
  profileClickable: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", transition: "opacity 0.15s ease" },
  avatar: { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(56, 126, 209, 0.08)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "600", fontSize: "13px" },
  username: { fontSize: "13px", fontWeight: "500" },
  divider: { width: "1px", height: "16px" },
  logoutBtn: { background: "transparent", border: "1px solid", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600", transition: "all 0.15s ease" },
};

export default Navbar;