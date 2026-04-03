import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (email.trim() === "test@gmail.com" && password.trim() === "test@123") {
      localStorage.setItem("user", JSON.stringify({ email }));
      setIsLoggedIn(true);
      navigate("/resume");
    } else {
      setError("❌ Invalid email or password");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f1117",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "#161b27", border: "1px solid #1e2535",
        borderRadius: "16px", padding: "40px 32px",
        width: "100%", maxWidth: "400px",
      }}>
        <h1 style={{
          color: "#38bdf8", fontFamily: "sans-serif",
          fontSize: "28px", margin: "0 0 4px 0", textAlign: "center",
        }}>
          JobTrack AI 🤖
        </h1>
        <p style={{
          color: "#94a3b8", textAlign: "center",
          marginBottom: "32px", fontSize: "14px",
        }}>
          Smart Job Matching Platform
        </p>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px" }}>Email</label>
            <input
              type="email"
              placeholder="test@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                background: "#0f1117", border: "1px solid #1e2535",
                borderRadius: "8px", padding: "10px 14px",
                color: "#f1f5f9", fontSize: "14px", outline: "none",
                width: "100%", boxSizing: "border-box",
              }}
              required
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ color: "#94a3b8", fontSize: "13px" }}>Password</label>
            <input
              type="password"
              placeholder="test@123"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                background: "#0f1117", border: "1px solid #1e2535",
                borderRadius: "8px", padding: "10px 14px",
                color: "#f1f5f9", fontSize: "14px", outline: "none",
                width: "100%", boxSizing: "border-box",
              }}
              required
            />
          </div>

          {error && <p style={{ color: "#ef4444", fontSize: "13px", margin: 0 }}>{error}</p>}

          <button type="submit" style={{
            background: "#0ea5e9", color: "white",
            border: "none", borderRadius: "8px",
            padding: "12px", fontSize: "15px",
            fontWeight: "600", cursor: "pointer",
            marginTop: "8px", width: "100%",
          }}>
            Login →
          </button>
        </form>

        <p style={{
          color: "#475569", fontSize: "12px",
          textAlign: "center", marginTop: "20px",
        }}>
          💡 Use: test@gmail.com / test@123
        </p>
      </div>
    </div>
  );
}

export default Login;