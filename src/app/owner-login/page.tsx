"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Building2 } from "lucide-react";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Login failed");
      } else {
        router.push("/owner");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F1F35 0%, #1A2F4A 50%, #0D2137 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Quicksand', sans-serif",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #1E4D8C, #2E6BB5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(30,77,140,0.4)",
          }}>
            <Building2 style={{ width: "32px", height: "32px", color: "white" }} />
          </div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "1.7rem", fontWeight: 700, color: "white" }}>
            Owner Portal
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
            Evergreen Preschool & Daycare — School Management
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          padding: "32px",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoComplete="username"
              placeholder="Enter your username"
              style={{
                width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)",
                padding: "12px 16px", fontSize: "14px", background: "rgba(255,255,255,0.07)",
                color: "white", outline: "none", fontFamily: "'Quicksand', sans-serif", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "8px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
                placeholder="Enter your password"
                style={{
                  width: "100%", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.12)",
                  padding: "12px 44px 12px 16px", fontSize: "14px", background: "rgba(255,255,255,0.07)",
                  color: "white", outline: "none", fontFamily: "'Quicksand', sans-serif", boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)" }}
              >
                {showPass ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "10px", padding: "10px 14px", color: "#FCA5A5", fontSize: "13px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            style={{
              width: "100%", padding: "14px", borderRadius: "16px",
              background: loading || !username || !password ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #1E4D8C, #2E6BB5)",
              color: "white", border: "none", fontWeight: 700, fontSize: "15px",
              cursor: loading || !username || !password ? "not-allowed" : "pointer",
              boxShadow: loading || !username || !password ? "none" : "0 6px 20px rgba(30,77,140,0.5)",
              transition: "all 0.2s", fontFamily: "'Quicksand', sans-serif",
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
          Restricted access — School owners only
        </div>
      </div>
    </div>
  );
}
