
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import * as ui from "../styles/style";

function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      await API.post("/api/otp/send", { email: form.email });
      setOtpSent(true);
      alert("OTP sent to your email");
    } catch (err) {
      alert("Failed to send OTP");
    }
  };

  const handleVerifyOtp = async () => {
    try {

      await API.post("/api/auth/register", {
        ...form,
        otp: otp
      });

      alert("Signup successful");
      navigate("/");

    } catch (err) {
      alert(err.response?.data || "Invalid OTP or Signup failed");
    }
  };

  return (
    <div style={{ ...ui.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...ui.card, width: "100%", maxWidth: "380px", padding: "40px" }}>

        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#444" }}>
          Sign up
        </h2>

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

        {!otpSent && (
          <button style={ui.button} onClick={handleSendOtp}>
            Send OTP
          </button>
        )}

        {otpSent && (
          <>
            <input
              style={ui.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
            />

            <button style={ui.button} onClick={handleVerifyOtp}>
              Verify OTP & Signup
            </button>
          </>
        )}

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#666" }}>
          Already have an account?{" "}
          <Link to="/" style={{ color: "#387ed1", textDecoration: "none" }}>
            Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;

