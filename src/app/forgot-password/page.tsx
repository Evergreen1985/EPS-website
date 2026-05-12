"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "otp" | "newpass" | "done";

export default function ForgotPasswordPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const role     = (params.get("role") || "parent") as "parent" | "teacher";

  const [step, setStep]         = useState<Step>("phone");
  const [phone, setPhone]       = useState("");
  const [otp, setOtp]           = useState("");
  const [newPass, setNewPass]   = useState("");
  const [confirmPass, setConfirm] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [waLink, setWaLink]     = useState("");

  const isTeacher = role === "teacher";
  const label     = isTeacher ? "Username" : "Phone Number";

  const sendOTP = async () => {
    if (!phone) return;
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), role }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error); setLoading(false); return; }
    setWaLink(data.waLink);
    setStep("otp");
    setLoading(false);
  };

  const verifyAndReset = async () => {
    if (newPass !== confirmPass) { setError("Passwords don't match"); return; }
    if (newPass.length < 6)     { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/verify-otp", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), otp, newPassword: newPass, role }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error); setLoading(false); return; }
    setStep("done");
    setLoading(false);
  };

  const inp = { width:"100%", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", padding:"11px 14px", fontSize:"13px", background:"rgba(255,255,255,0.08)", color:"white", outline:"none", fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1A2F4A,#0f6b5a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Quicksand',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"380px" }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ fontSize:"36px", marginBottom:"10px" }}>🔑</div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.6rem", fontWeight:700, color:"white" }}>Reset Password</div>
          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginTop:"4px" }}>
            {isTeacher ? "Teacher Portal" : "Parent Portal"} — Evergreen Preschool
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px", padding:"24px" }}>

          {/* Step 1: Enter phone/username */}
          {step === "phone" && (
            <>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"16px" }}>
                Enter your {label.toLowerCase()} and we'll send an OTP via WhatsApp.
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>{label}</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key==="Enter" && sendOTP()}
                  style={inp} placeholder={isTeacher ? "e.g. priya" : "10-digit phone number"} />
              </div>
              {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"10px", padding:"9px 12px", color:"#FCA5A5", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}
              <button onClick={sendOTP} disabled={loading || !phone}
                style={{ width:"100%", padding:"13px", borderRadius:"16px", background:loading||!phone?"rgba(255,255,255,0.1)":"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:loading||!phone?"not-allowed":"pointer" }}>
                {loading ? "Sending…" : "Send OTP via WhatsApp →"}
              </button>
            </>
          )}

          {/* Step 2: Open WhatsApp + Enter OTP */}
          {step === "otp" && (
            <>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"16px" }}>
                Click the button below to get your OTP on WhatsApp, then enter it here.
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#25D366", color:"white", borderRadius:"16px", padding:"12px 20px", fontWeight:700, fontSize:"13px", textDecoration:"none", marginBottom:"16px" }}>
                💬 Get OTP on WhatsApp
              </a>
              <div style={{ marginBottom:"12px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Enter OTP</label>
                <input value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
                  style={{ ...inp, textAlign:"center", fontSize:"20px", letterSpacing:"8px", fontWeight:700 }} placeholder="000000" />
              </div>
              <div style={{ marginBottom:"12px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} style={inp} placeholder="Min. 6 characters" />
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Confirm Password</label>
                <input type="password" value={confirmPass} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key==="Enter" && verifyAndReset()} style={inp} placeholder="Repeat new password" />
              </div>
              {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"10px", padding:"9px 12px", color:"#FCA5A5", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}
              <button onClick={verifyAndReset} disabled={loading || !otp || !newPass || !confirmPass}
                style={{ width:"100%", padding:"13px", borderRadius:"16px", background:"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                {loading ? "Resetting…" : "Reset Password →"}
              </button>
            </>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:"white", marginBottom:"8px" }}>Password Reset!</div>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", marginBottom:"20px" }}>Your new password has been set. You can now log in.</div>
              <Link href={isTeacher ? "/teacher-login" : "/parent-login"}
                style={{ display:"block", background:"#178F78", color:"white", borderRadius:"16px", padding:"13px", fontWeight:700, fontSize:"14px", textDecoration:"none" }}>
                Go to Login →
              </Link>
            </div>
          )}
        </div>

        <div style={{ textAlign:"center", marginTop:"16px" }}>
          <Link href={isTeacher ? "/teacher-login" : "/parent-login"} style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)" }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
