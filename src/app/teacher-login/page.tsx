"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function TeacherLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async () => {
    setLoading(true); setError("");
    const res  = await fetch("/api/teacher/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setError(data.error || "Invalid credentials");
    } else {
      localStorage.setItem("ep_teacher_session", JSON.stringify({ ...data, loginTime: Date.now() }));
      router.push("/teacher-dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1A2F4A,#0f6b5a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Quicksand',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"380px" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", margin:"0 auto 14px" }}>👩‍🏫</div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.7rem", fontWeight:700, color:"white" }}>Teacher Portal</div>
          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginTop:"4px" }}>Evergreen Preschool & Daycare</div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px", padding:"28px" }}>
          <div style={{ marginBottom:"16px" }}>
            <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()}
              style={{ width:"100%", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", padding:"11px 14px", fontSize:"13px", background:"rgba(255,255,255,0.08)", color:"white", outline:"none", fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const }}
              placeholder="e.g. priya" />
          </div>
          <div style={{ marginBottom:"22px" }}>
            <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Password</label>
            <div style={{ position:"relative" }}>
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()}
                style={{ width:"100%", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", padding:"11px 42px 11px 14px", fontSize:"13px", background:"rgba(255,255,255,0.08)", color:"white", outline:"none", fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const }}
                placeholder="••••••••" />
              <button onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)" }}>
                {showPass ? <EyeOff style={{ width:"16px", height:"16px" }} /> : <Eye style={{ width:"16px", height:"16px" }} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"10px", padding:"9px 12px", color:"#FCA5A5", fontSize:"12px", marginBottom:"14px" }}>{error}</div>
          )}

          <button onClick={handleLogin} disabled={loading || !username || !password}
            style={{ width:"100%", padding:"13px", borderRadius:"16px", background:loading||!username||!password?"rgba(255,255,255,0.1)":"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:loading||!username||!password?"not-allowed":"pointer", boxShadow:loading?"none":"0 6px 20px rgba(23,143,120,0.4)", transition:"all 0.2s" }}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop:"16px", fontSize:"11px", color:"rgba(255,255,255,0.3)" }}>
          Default password: Teacher@123
        </div>
      </div>
    </div>
  );
}
