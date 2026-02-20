import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import * as ui from "../styles/style";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await API.post("/api/auth/register", form);
      alert("Signup successful");
      navigate("/");
    } catch (err) {
      alert("Signup failed");
    }
  };

  return (
    <div style={{ ...ui.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...ui.card, width: "100%", maxWidth: "380px", padding: "40px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#444" }}>Sign up</h2>

        <input
          style={ui.input}
          placeholder="Your Name"
          onChange={e => setForm({ ...form, name: e.target.value })}
        />

        <input
          style={ui.input}
          placeholder="Email"
          onChange={e => setForm({ ...form, email: e.target.value })}
        />

        <input
          style={ui.input}
          type="password"
          placeholder="Password"
          onChange={e => setForm({ ...form, password: e.target.value })}
        />

        <button style={ui.button} onClick={handleSignup}>
          Continue
        </button>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Already have an account? <Link to="/" style={{ color: "#387ed1", textDecoration: "none" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;