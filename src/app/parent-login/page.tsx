"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";

type Step = "choose" | "first-login" | "login" | "success";

export default function ParentLoginPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>("choose");
  const [phone, setPhone]       = useState("");
  const [dob, setDob]           = useState("");
  const [last4, setLast4]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState<any>(null);

  const inp  = "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all";
  const inpS = { borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" };

  const call = async (action: string, extra: any = {}) => {
    setLoading(true); setError("");
    try {
      const res  = await fetch("/api/auth/parent-login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone, dob, last4, password, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong");
        if (data.alreadySetup) setStep("login");
        if (data.needsSetup)   setStep("first-login");
      } else {
        setResult(data);
        // Save persistent session to localStorage
        localStorage.setItem("ep_parent_session", JSON.stringify({
          phone:     phone,
          childName: data.childName || "",
          loginTime: Date.now(),
          firstLogin: data.firstLogin || false,
        }));
        setStep("success");
        // Open WhatsApp if first login
        if (data.waUrl) setTimeout(() => window.open(data.waUrl, "_blank"), 500);
        // Redirect to dashboard after short delay
        if (!data.firstLogin) {
          setTimeout(() => router.push("/parent-dashboard"), 800);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const inpCls = `${inp} focus:ring-teal-400`;

  return (
    <div style={{ minHeight:"100vh", background:"#FEFCF8", fontFamily:"'Quicksand',sans-serif", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#178F78,#0f6b5a)", padding:"32px 20px 28px", textAlign:"center" }}>
        <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:"24px" }}>👨‍👩‍👧</div>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.8rem", fontWeight:700, color:"white", marginBottom:"4px" }}>Parent Portal</div>
        <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.75)" }}>Evergreen Preschool & Daycare</p>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
        <div style={{ width:"100%", maxWidth:"400px" }}>

          {/* CHOOSE step */}
          {step === "choose" && (
            <div style={{ background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", padding:"28px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:"#178F78", marginBottom:"6px" }}>Welcome Back!</div>
              <p style={{ fontSize:"13px", color:"#6B7A99", marginBottom:"24px" }}>How would you like to log in?</p>

              <button onClick={() => setStep("first-login")}
                style={{ width:"100%", padding:"16px", border:"2px solid #178F78", borderRadius:"16px", background:"rgba(23,143,120,0.05)", cursor:"pointer", textAlign:"left", marginBottom:"12px", display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(23,143,120,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🆕</div>
                <div>
                  <div style={{ fontWeight:700, color:"#178F78", fontSize:"14px", marginBottom:"2px" }}>First Time Login</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99" }}>Use your child&apos;s DOB + last 4 digits of phone</div>
                </div>
                <ArrowRight style={{ width:"16px", height:"16px", color:"#178F78", marginLeft:"auto" }} />
              </button>

              <button onClick={() => setStep("login")}
                style={{ width:"100%", padding:"16px", border:"2px solid #EDE8DF", borderRadius:"16px", background:"white", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"rgba(232,105,74,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🔐</div>
                <div>
                  <div style={{ fontWeight:700, color:"#E8694A", fontSize:"14px", marginBottom:"2px" }}>Login with Password</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99" }}>Already set up your account</div>
                </div>
                <ArrowRight style={{ width:"16px", height:"16px", color:"#6B7A99", marginLeft:"auto" }} />
              </button>

              <div style={{ textAlign:"center", marginTop:"20px", fontSize:"12px", color:"#6B7A99" }}>
                New here?{" "}
                <Link href="/enquiry" style={{ color:"#178F78", fontWeight:700 }}>Submit an enquiry first →</Link>
              </div>
            </div>
          )}

          {/* FIRST TIME LOGIN */}
          {step === "first-login" && (
            <div style={{ background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", padding:"28px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
              <button onClick={() => { setStep("choose"); setError(""); }} style={{ fontSize:"12px", color:"#6B7A99", background:"none", border:"none", cursor:"pointer", marginBottom:"16px", padding:0 }}>← Back</button>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:"#178F78", marginBottom:"4px" }}>First Time Setup</div>
              <p style={{ fontSize:"12px", color:"#6B7A99", marginBottom:"20px" }}>Verify your identity to create your password</p>

              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6B7A99", display:"block", marginBottom:"6px" }}>Phone Number (WhatsApp) *</label>
                <div style={{ display:"flex", gap:"8px" }}>
                  <div style={{ background:"#FAF0E8", border:"1px solid #EDE8DF", borderRadius:"12px", padding:"0 12px", display:"flex", alignItems:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"12px", color:"#6B7A99" }}>🇮🇳 +91</span>
                  </div>
                  <input className={inpCls} style={{ ...inpS, flex:1 }} type="tel" placeholder="10-digit number"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} />
                </div>
              </div>

              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6B7A99", display:"block", marginBottom:"6px" }}>Child&apos;s Date of Birth *</label>
                <input className={inpCls} style={inpS} type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={dob} onChange={e => setDob(e.target.value)} />
              </div>

              <div style={{ marginBottom:"20px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6B7A99", display:"block", marginBottom:"6px" }}>Last 4 Digits of Phone *</label>
                <input className={inpCls} style={inpS} type="tel" placeholder="e.g. 4504" maxLength={4}
                  value={last4} onChange={e => setLast4(e.target.value.replace(/\D/g,"").slice(0,4))} />
                <p style={{ fontSize:"10px", color:"#6B7A99", marginTop:"4px" }}>Last 4 digits of the phone number you registered with</p>
              </div>

              {error && <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"12px", padding:"10px 14px", color:"#DC2626", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}

              <button disabled={loading || !phone || !dob || !last4}
                onClick={() => call("first-login")}
                style={{ width:"100%", padding:"13px", borderRadius:"20px", background: loading||!phone||!dob||!last4 ? "#ccc" : "#178F78", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor: loading||!phone||!dob||!last4 ? "not-allowed" : "pointer", boxShadow:"0 5px 16px rgba(23,143,120,0.3)" }}>
                {loading ? "Verifying..." : "Verify & Create Password →"}
              </button>

              <div style={{ textAlign:"center", marginTop:"14px" }}>
                <button onClick={() => { setStep("login"); setError(""); }} style={{ fontSize:"12px", color:"#178F78", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Already have a password? Login →</button>
              </div>
            </div>
          )}

          {/* REGULAR LOGIN */}
          {step === "login" && (
            <div style={{ background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", padding:"28px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
              <button onClick={() => { setStep("choose"); setError(""); }} style={{ fontSize:"12px", color:"#6B7A99", background:"none", border:"none", cursor:"pointer", marginBottom:"16px", padding:0 }}>← Back</button>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.3rem", fontWeight:700, color:"#178F78", marginBottom:"4px" }}>Parent Login</div>
              <p style={{ fontSize:"12px", color:"#6B7A99", marginBottom:"20px" }}>Enter your phone and password</p>

              <div style={{ marginBottom:"14px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6B7A99", display:"block", marginBottom:"6px" }}>Phone Number *</label>
                <div style={{ display:"flex", gap:"8px" }}>
                  <div style={{ background:"#FAF0E8", border:"1px solid #EDE8DF", borderRadius:"12px", padding:"0 12px", display:"flex", alignItems:"center", flexShrink:0 }}>
                    <span style={{ fontSize:"12px", color:"#6B7A99" }}>🇮🇳 +91</span>
                  </div>
                  <input className={inpCls} style={{ ...inpS, flex:1 }} type="tel" placeholder="10-digit number"
                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} />
                </div>
              </div>

              <div style={{ marginBottom:"20px" }}>
                <label style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#6B7A99", display:"block", marginBottom:"6px" }}>Password *</label>
                <div style={{ position:"relative" }}>
                  <input className={inpCls} style={{ ...inpS, paddingRight:"44px" }}
                    type={showPass ? "text" : "password"} placeholder="Your password"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button onClick={() => setShowPass(!showPass)} type="button"
                    style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6B7A99" }}>
                    {showPass ? <EyeOff style={{ width:"16px", height:"16px" }} /> : <Eye style={{ width:"16px", height:"16px" }} />}
                  </button>
                </div>
              </div>

              {error && <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"12px", padding:"10px 14px", color:"#DC2626", fontSize:"12px", marginBottom:"14px" }}>{error}</div>}

              <button disabled={loading || !phone || !password}
                onClick={() => call("login")}
                style={{ width:"100%", padding:"13px", borderRadius:"20px", background: loading||!phone||!password ? "#ccc" : "#E8694A", color:"white", border:"none", fontWeight:700, fontSize:"14px", cursor: loading||!phone||!password ? "not-allowed" : "pointer", boxShadow:"0 5px 16px rgba(232,105,74,0.3)" }}>
                {loading ? "Logging in..." : "Login →"}
              </button>

              <div style={{ textAlign:"center", marginTop:"14px" }}>
                <button onClick={() => { setStep("first-login"); setError(""); }} style={{ fontSize:"12px", color:"#178F78", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>First time? Set up your account →</button>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && result && (
            <div style={{ background:"white", borderRadius:"24px", border:"1px solid #EDE8DF", padding:"28px", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", textAlign:"center" }}>
              <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:"rgba(23,143,120,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:"28px" }}>✅</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"1.5rem", fontWeight:700, color:"#178F78", marginBottom:"6px" }}>
                {result.firstLogin ? "Account Created!" : `Welcome back!`}
              </div>
              <p style={{ fontSize:"13px", color:"#6B7A99", marginBottom:"20px" }}>
                {result.firstLogin
                  ? "Your login credentials have been sent to your WhatsApp!"
                  : `Logged in as ${result.childName ? result.childName + "'s parent" : "Parent"}`}
              </p>

              {result.firstLogin && result.password && (
                <div style={{ background:"rgba(23,143,120,0.06)", border:"1.5px solid rgba(23,143,120,0.2)", borderRadius:"16px", padding:"16px", marginBottom:"20px", textAlign:"left" }}>
                  <div style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#178F78", marginBottom:"10px" }}>🔐 Your Login Details</div>
                  <div style={{ fontSize:"13px", marginBottom:"6px" }}>
                    <span style={{ color:"#6B7A99" }}>Phone: </span>
                    <span style={{ fontWeight:700, color:"#1A2F4A" }}>{phone}</span>
                  </div>
                  <div style={{ fontSize:"13px", marginBottom:"12px" }}>
                    <span style={{ color:"#6B7A99" }}>Password: </span>
                    <span style={{ fontWeight:700, color:"#178F78", fontFamily:"monospace", fontSize:"15px", letterSpacing:"2px" }}>{result.password}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", background:"rgba(245,184,41,0.1)", border:"1px solid rgba(245,184,41,0.3)", borderRadius:"8px", padding:"8px 10px" }}>
                    💬 These credentials have been sent to your WhatsApp. Please save them!
                  </div>
                </div>
              )}

              {result.waUrl && (
                <a href={result.waUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#25D366", color:"white", borderRadius:"20px", padding:"11px 20px", fontWeight:700, fontSize:"13px", textDecoration:"none", marginBottom:"12px" }}>
                  💬 Open WhatsApp to see your credentials
                </a>
              )}

              <Link href="/parent-dashboard"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#178F78", color:"white", borderRadius:"20px", padding:"11px 20px", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>
                Go to Dashboard →
              </Link>

              <div style={{ marginTop:"12px" }}>
                <Link href="/" style={{ fontSize:"12px", color:"#6B7A99" }}>Back to Home</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
