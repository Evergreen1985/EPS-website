"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "choose" | "verify" | "otp" | "done";

export default function ForgotPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const role   = (params.get("role") || "parent") as "parent" | "teacher";

  const [step, setStep]           = useState<Step>("phone");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(d => { if (d.school?.name) setSchoolName(d.school.name); }).catch(() => {});
  }, []);
  const [phone, setPhone]         = useState("");
  const [dob, setDob]             = useState("");
  const [last4, setLast4]         = useState("");
  const [otp, setOtp]             = useState("");
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirm] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [waLink, setWaLink]       = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [defaultPass, setDefaultPass] = useState("");

  const isTeacher = role === "teacher";
  const inp = { width:"100%", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.15)", padding:"11px 14px", fontSize:"13px", background:"rgba(255,255,255,0.08)", color:"white", outline:"none", fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const };

  const checkPhone = async () => {
    if (!phone) return;
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), role, checkOnly: true }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error || "Phone not found"); setLoading(false); return; }
    setLoading(false);
    // Parents get choice, teachers go straight to OTP
    isTeacher ? sendOTP() : setStep("choose");
  };

  const sendOTP = async () => {
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/reset-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), role }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error); setLoading(false); return; }
    setOtpSent(data.sent === true);
    setWaLink(data.waLink || "");
    setStep("otp");
    setLoading(false);
  };

  const resetToDefault = async () => {
    if (!dob || !last4) return;
    setLoading(true); setError("");
    const res  = await fetch("/api/auth/reset-to-default", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), dob, last4 }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setError(data.error); setLoading(false); return; }
    setDefaultPass(data.defaultPass);
    setStep("done");
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

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1A2F4A,#0f6b5a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Quicksand',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"380px" }}>
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ fontSize:"36px", marginBottom:"10px" }}>🔑</div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.6rem", fontWeight:700, color:"white" }}>Reset Password</div>
          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", marginTop:"4px" }}>
            {isTeacher ? "Teacher Portal" : "Parent Portal"}{schoolName ? ` — ${schoolName}` : ""}
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"24px", padding:"24px" }}>

          {/* Step 1: Phone */}
          {step === "phone" && (
            <>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"16px" }}>
                Enter your {isTeacher ? "username" : "registered phone number"} to reset your password.
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>
                  {isTeacher ? "Username" : "Phone Number"}
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key==="Enter" && checkPhone()}
                  style={inp} placeholder={isTeacher ? "e.g. priya" : "10-digit phone number"} />
              </div>
              {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"10px", padding:"9px 12px", color:"#FCA5A5", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}
              <button onClick={checkPhone} disabled={loading || !phone}
                style={{ width:"100%", padding:"13px", borderRadius:"16px", background:loading||!phone?"rgba(255,255,255,0.1)":"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:loading||!phone?"not-allowed":"pointer" }}>
                {loading ? "Checking…" : "Continue →"}
              </button>
            </>
          )}

          {/* Step 2: Choose method (parents only) */}
          {step === "choose" && (
            <>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"20px" }}>
                How would you like to reset your password?
              </div>
              <button onClick={() => setStep("verify")}
                style={{ width:"100%", padding:"16px", borderRadius:"16px", background:"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:"pointer", marginBottom:"12px", textAlign:"left" }}>
                <div style={{ fontSize:"18px", marginBottom:"4px" }}>✅ Reset to Default Password</div>
                <div style={{ fontSize:"11px", fontWeight:400, opacity:0.85 }}>Verify with child's DOB + last 4 digits — free & instant</div>
              </button>
              <button onClick={sendOTP}
                style={{ width:"100%", padding:"16px", borderRadius:"16px", background:"rgba(255,255,255,0.08)", color:"white", border:"1px solid rgba(255,255,255,0.2)", fontWeight:700, fontSize:"14px", cursor:"pointer", textAlign:"left" }}>
                <div style={{ fontSize:"18px", marginBottom:"4px" }}>💬 Send OTP via WhatsApp</div>
                <div style={{ fontSize:"11px", fontWeight:400, opacity:0.7 }}>Receive a one-time code on your WhatsApp</div>
              </button>
            </>
          )}

          {/* Step 3a: Verify with DOB + last4 */}
          {step === "verify" && (
            <>
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"16px" }}>
                Verify your identity to reset to default password.
              </div>
              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Child's Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]} style={inp} />
              </div>
              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Last 4 Digits of Phone</label>
                <input type="tel" value={last4} onChange={e => setLast4(e.target.value.replace(/\D/g,"").slice(0,4))}
                  maxLength={4} placeholder="e.g. 4504" style={inp} />
              </div>
              {error && <div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:"10px", padding:"9px 12px", color:"#FCA5A5", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}
              <button onClick={resetToDefault} disabled={loading || !dob || last4.length < 4}
                style={{ width:"100%", padding:"13px", borderRadius:"16px", background:loading||!dob||last4.length<4?"rgba(255,255,255,0.1)":"#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor:"pointer", marginBottom:"10px" }}>
                {loading ? "Verifying…" : "Reset to Default →"}
              </button>
              <button onClick={() => { setStep("choose"); setError(""); }}
                style={{ width:"100%", padding:"10px", borderRadius:"16px", background:"transparent", color:"rgba(255,255,255,0.5)", border:"none", fontSize:"12px", cursor:"pointer" }}>
                ← Back
              </button>
            </>
          )}

          {/* Step 3b: OTP */}
          {step === "otp" && (
            <>
              {otpSent ? (
                <div style={{ background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:"12px", padding:"11px 14px", color:"#4ade80", fontSize:"13px", marginBottom:"16px", display:"flex", alignItems:"center", gap:"8px" }}>
                  ✅ OTP sent to your WhatsApp
                </div>
              ) : waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#25D366", color:"white", borderRadius:"16px", padding:"12px 20px", fontWeight:700, fontSize:"13px", textDecoration:"none", marginBottom:"16px" }}>
                  💬 Get OTP on WhatsApp
                </a>
              ) : (
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", marginBottom:"16px" }}>
                  Enter the OTP sent to your WhatsApp.
                </div>
              )}
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

          {/* Done */}
          {step === "done" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>✅</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:"white", marginBottom:"8px" }}>Password Reset!</div>
              {defaultPass ? (
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"12px", padding:"14px", marginBottom:"16px" }}>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", marginBottom:"6px" }}>Your default password is:</div>
                  <div style={{ fontSize:"22px", fontWeight:700, color:"white", letterSpacing:"3px" }}>{defaultPass}</div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", marginTop:"6px" }}>Please change it after login</div>
                </div>
              ) : (
                <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.6)", marginBottom:"20px" }}>Your new password has been set.</div>
              )}
              <Link href="/parent-login"
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
