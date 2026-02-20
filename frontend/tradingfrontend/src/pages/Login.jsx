import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import * as ui from "../styles/style";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("username", res.data.username);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div style={{ ...ui.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...ui.card, width: "100%", maxWidth: "380px", padding: "40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#444" }}>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            style={ui.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            style={ui.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button style={ui.button}>Login</button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#387ed1", textDecoration: "none" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;