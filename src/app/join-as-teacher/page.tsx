"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, Square, Play, Pause, RotateCcw } from "lucide-react";

const QUALIFICATIONS = [
  "B.Ed (Bachelor of Education)",
  "D.El.Ed (Diploma in Elementary Education)",
  "NTT (Nursery Teacher Training)",
  "Montessori Diploma",
  "PG in Early Childhood Education",
  "ECCE Certificate",
  "12th Pass / Fresher",
  "Other",
];
const AGE_GROUPS = [
  "Toddlers (1.5–2.5 yrs)",
  "Playgroup (2.5–3.5 yrs)",
  "Nursery (3–4 yrs)",
  "LKG (4–5 yrs)",
  "UKG (5–6 yrs)",
];
const EXPERIENCE_OPTIONS = ["Fresher", "< 1 year", "1–2 years", "3–5 years", "5–10 years", "10+ years"];

const inp: React.CSSProperties = {
  width: "100%", border: "1.5px solid #E5E7EB", borderRadius: "10px",
  padding: "10px 14px", fontSize: "13px", color: "#1A2F4A", background: "white",
  outline: "none", boxSizing: "border-box", fontFamily: "'Quicksand',sans-serif",
};
const sel: React.CSSProperties = { ...inp, cursor: "pointer" };
const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#6B7A99",
  textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px",
};

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
        border: `1.5px solid ${active ? "#178F78" : "#E5E7EB"}`,
        background: active ? "#178F78" : "white",
        color: active ? "white" : "#6B7A99",
        cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
      }}>
      {label}
    </button>
  );
}

function StepBar({ step }: { step: number }) {
  const steps = ["Your Profile", "Voice Assessment"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", maxWidth: "640px", margin: "0 auto 28px" }}>
      {steps.map((label, i) => {
        const s = i + 1;
        const done = step > s;
        const active = step === s;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px", flex: i < steps.length - 1 ? "none" : 1 }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0,
              background: done ? "#178F78" : active ? "white" : "rgba(255,255,255,0.15)",
              color: done ? "white" : active ? "#1A2F4A" : "rgba(255,255,255,0.4)",
            }}>
              {done ? "✓" : s}
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: active ? "white" : "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)", margin: "0 4px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function JoinAsTeacherPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [school, setSchool] = useState({ name: "Evergreen Preschool & Daycare", shortName: "Evergreen", address: { short: "Electronic City, Bengaluru" } });
  useEffect(() => { fetch("/api/config").then(r=>r.json()).then(d=>{if(d.school)setSchool(d.school);}).catch(()=>{}); }, []);

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [qualification, setQualification] = useState("");
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [prevSchool, setPrevSchool] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");

  // Audio
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleAgeGroup = (g: string) =>
    setAgeGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
      setRecSeconds(0);
      setAudioUrl(null);
      setAudioBlob(null);
      timerRef.current = setInterval(() => {
        setRecSeconds(s => {
          if (s >= 59) { stopRecording(); return 60; }
          return s + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please allow microphone and try again.");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      mediaRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const resetRecording = () => {
    setAudioUrl(null); setAudioBlob(null); setRecSeconds(0); setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioElRef.current || !audioUrl) return;
    if (playing) { audioElRef.current.pause(); setPlaying(false); }
    else { audioElRef.current.play(); setPlaying(true); }
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      let audioBase64: string | null = null;
      if (audioBlob) {
        const buf = await audioBlob.arrayBuffer();
        audioBase64 = Buffer.from(buf).toString("base64");
      }
      const res = await fetch("/api/teacher-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, email, city, experience, qualification,
          age_groups: ageGroups, prev_school: prevSchool,
          available_from: availableFrom || null,
          audio_base64: audioBase64,
          audio_duration_seconds: audioBase64 ? recSeconds : null,
        }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const step1Valid = name.trim().length > 1 && phone.trim().length >= 10 && !!experience && !!qualification;

  // ── Success screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0F2A1E,#1A2F4A)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Quicksand',sans-serif" }}>
        <div style={{ background: "white", borderRadius: "24px", padding: "48px 40px", maxWidth: "460px", width: "100%", textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#178F78,#0F766E)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "36px" }}>
            🎉
          </div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "26px", fontWeight: 700, color: "#1A2F4A", marginBottom: "12px" }}>
            Application Received!
          </div>
          <div style={{ fontSize: "14px", color: "#6B7A99", lineHeight: 1.75, marginBottom: "28px" }}>
            Thank you <strong style={{ color: "#1A2F4A" }}>{name.split(" ")[0]}</strong>! We've received your profile
            {audioBlob ? " and voice assessment" : ""}.<br /><br />
            Our team at <strong>{school.shortName}</strong> will review your application and reach out within <strong>2–3 working days</strong>.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => router.push("/ai-tools/general")}
              style={{ background: "linear-gradient(135deg,#178F78,#0F766E)", color: "white", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand',sans-serif" }}>
              Explore Free AI Tools →
            </button>
            <button onClick={() => router.push("/")}
              style={{ background: "none", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: "pointer", color: "#6B7A99", fontFamily: "'Quicksand',sans-serif" }}>
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0F2A1E 0%,#1A2F4A 100%)", padding: "32px 20px 60px", fontFamily: "'Quicksand',sans-serif" }}>

      {/* Header */}
      <div style={{ maxWidth: "640px", margin: "0 auto 24px", display: "flex", alignItems: "center", gap: "14px" }}>
        <button onClick={() => step === 1 ? router.back() : setStep(1)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "7px 14px", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft style={{ width: "12px", height: "12px" }} /> Back
        </button>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "white" }}>
            🌿 Join Our Teaching Team
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
            {school.name} · {school.address.short}
          </div>
        </div>
      </div>

      <StepBar step={step} />

      <div style={{ maxWidth: "640px", margin: "0 auto", background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>

        {/* ── STEP 1: Profile ──────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ padding: "32px" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "22px", fontWeight: 700, color: "#1A2F4A", marginBottom: "4px" }}>
              Tell us about yourself
            </div>
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "28px" }}>
              Share your background — we'd love to get to know you
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Full Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Priya Sharma" style={inp} />
              </div>

              <div>
                <label style={lbl}>Phone Number *</label>
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile" style={inp} type="tel" />
              </div>

              <div>
                <label style={lbl}>Email Address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inp} type="email" />
              </div>

              <div>
                <label style={lbl}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Bengaluru, Mysuru…" style={inp} />
              </div>

              <div>
                <label style={lbl}>Previous / Current School</label>
                <input value={prevSchool} onChange={e => setPrevSchool(e.target.value)} placeholder="School name (optional)" style={inp} />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Teaching Experience *</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {EXPERIENCE_OPTIONS.map(e => (
                    <Chip key={e} label={e} active={experience === e} onClick={() => setExperience(e)} />
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Highest Qualification *</label>
                <select value={qualification} onChange={e => setQualification(e.target.value)} style={sel}>
                  <option value="">Select qualification…</option>
                  {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Comfortable Teaching Age Groups</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                  {AGE_GROUPS.map(g => (
                    <Chip key={g} label={g} active={ageGroups.includes(g)} onClick={() => toggleAgeGroup(g)} />
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Available to Join From</label>
                <input value={availableFrom} onChange={e => setAvailableFrom(e.target.value)}
                  type="date" style={inp} min={new Date().toISOString().split("T")[0]} />
              </div>

            </div>

            <button onClick={() => setStep(2)} disabled={!step1Valid}
              style={{
                marginTop: "28px", width: "100%", padding: "14px", borderRadius: "14px",
                border: "none", fontWeight: 700, fontSize: "14px", color: "white",
                cursor: step1Valid ? "pointer" : "not-allowed",
                background: step1Valid ? "linear-gradient(135deg,#178F78,#0F766E)" : "#E5E7EB",
                fontFamily: "'Quicksand',sans-serif",
                boxShadow: step1Valid ? "0 6px 20px rgba(23,143,120,0.35)" : "none",
              }}>
              Next: Voice Assessment →
            </button>
            {!step1Valid && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                Fill in name, phone, experience and qualification to continue
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Voice Assessment ──────────────────────────────── */}
        {step === 2 && (
          <div style={{ padding: "32px" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "22px", fontWeight: 700, color: "#1A2F4A", marginBottom: "4px" }}>
              🎤 Voice Assessment
            </div>
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "24px" }}>
              A short voice note helps us understand your communication style
            </div>

            {/* Prompt card */}
            <div style={{ background: "linear-gradient(135deg,rgba(23,143,120,0.07),rgba(15,118,110,0.03))", border: "1.5px solid rgba(23,143,120,0.25)", borderRadius: "14px", padding: "20px 22px", marginBottom: "28px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#178F78", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Your Prompt
              </div>
              <div style={{ fontSize: "14px", color: "#1A2F4A", lineHeight: 1.75, fontStyle: "italic" }}>
                "Introduce yourself and tell us — why do you love teaching young children?
                Share a moment that made you feel this is the right path for you."
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "12px" }}>
                🗣️ Speak naturally in English, Kannada, or Hindi · Aim for 30–60 seconds
              </div>
            </div>

            {/* Recorder area */}
            <div style={{ background: "#F8FAFC", borderRadius: "18px", padding: "32px 20px", textAlign: "center", minHeight: "180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>

              {!recording && !audioUrl && (
                <>
                  <button onClick={startRecording}
                    style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg,#178F78,#0F766E)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 28px rgba(23,143,120,0.35)", transition: "transform 0.15s" }}>
                    <Mic style={{ width: "30px", height: "30px", color: "white" }} />
                  </button>
                  <div style={{ fontSize: "13px", color: "#6B7A99" }}>Tap to start recording</div>
                </>
              )}

              {recording && (
                <>
                  <button onClick={stopRecording}
                    style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg,#E8694A,#C0392B)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 28px rgba(232,105,74,0.45)", animation: "rec-pulse 1.2s ease-in-out infinite" }}>
                    <Square style={{ width: "24px", height: "24px", color: "white" }} />
                  </button>
                  <div style={{ fontFamily: "monospace", fontSize: "26px", fontWeight: 700, color: "#E8694A", letterSpacing: "0.08em" }}>
                    {fmtTime(recSeconds)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF" }}>Recording… tap to stop · max 60 sec</div>
                  {/* Audio wave bars */}
                  <div style={{ display: "flex", gap: "4px", alignItems: "center", height: "36px" }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} style={{
                        width: "4px", background: "#178F78", borderRadius: "3px",
                        animation: `wave ${0.5 + i * 0.08}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.07}s`,
                      }} />
                    ))}
                  </div>
                </>
              )}

              {audioUrl && !recording && (
                <>
                  <audio ref={audioElRef} src={audioUrl} onEnded={() => setPlaying(false)} style={{ display: "none" }} />
                  <button onClick={togglePlay}
                    style={{ width: "76px", height: "76px", borderRadius: "50%", background: "linear-gradient(135deg,#8957E5,#6366F1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 28px rgba(137,87,229,0.35)" }}>
                    {playing
                      ? <Pause style={{ width: "28px", height: "28px", color: "white" }} />
                      : <Play style={{ width: "28px", height: "28px", color: "white" }} />}
                  </button>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#178F78" }}>
                    ✅ Recorded · {fmtTime(recSeconds)}
                  </div>
                  <button onClick={resetRecording}
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1.5px solid #E5E7EB", borderRadius: "20px", padding: "7px 16px", fontSize: "12px", color: "#6B7A99", cursor: "pointer", fontWeight: 700 }}>
                    <RotateCcw style={{ width: "11px", height: "11px" }} /> Re-record
                  </button>
                </>
              )}
            </div>

            {error && (
              <div style={{ marginTop: "16px", background: "rgba(232,105,74,0.08)", border: "1px solid rgba(232,105,74,0.3)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#E8694A", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              style={{
                marginTop: "24px", width: "100%", padding: "14px", borderRadius: "14px",
                border: "none", fontWeight: 700, fontSize: "14px", color: "white",
                cursor: submitting ? "not-allowed" : "pointer",
                background: submitting ? "#D1D5DB" : "linear-gradient(135deg,#178F78,#0F766E)",
                fontFamily: "'Quicksand',sans-serif",
                boxShadow: submitting ? "none" : "0 6px 20px rgba(23,143,120,0.35)",
              }}>
              {submitting ? "Submitting…" : audioUrl ? "🚀 Submit Application" : "Submit Without Recording →"}
            </button>
            {!audioUrl && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>
                Voice assessment is optional but strongly recommended
              </div>
            )}
          </div>
        )}
      </div>

      {/* Benefits strip */}
      <div style={{ maxWidth: "640px", margin: "28px auto 0", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {[["💼", "Competitive salary"], ["📚", "Ongoing training"], ["🌿", "Nurturing environment"], ["⭐", "Growth opportunities"]].map(([ic, tx]) => (
          <div key={tx as string} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px", padding: "7px 14px", fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
            {ic} {tx}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes rec-pulse {
          0%, 100% { box-shadow: 0 8px 28px rgba(232,105,74,0.45); transform: scale(1); }
          50%       { box-shadow: 0 8px 40px rgba(232,105,74,0.7);  transform: scale(1.04); }
        }
        @keyframes wave {
          from { height: 6px; }
          to   { height: 30px; }
        }
      `}</style>
    </div>
  );
}
