"use client";
import { useState } from "react";

/* ─── Print styles injected once ─── */
const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #activity-planner-results, #activity-planner-results * { visibility: visible !important; }
  #activity-planner-results { position: fixed; inset: 0; padding: 20px; background: #fff; }
  .no-print { display: none !important; }
}
`;

interface Activity {
  name: string;
  emoji: string;
  materials: string[];
  steps: string[];
  goals: string[];
  source: string;
}

interface ApiResponse {
  activities: Activity[];
  sources: string[];
}

const INTEREST_OPTIONS = [
  { label: "Art & Craft", emoji: "🎨" },
  { label: "Music", emoji: "🎵" },
  { label: "Outdoor Play", emoji: "🌳" },
  { label: "Sensory Play", emoji: "🌊" },
  { label: "Language & Stories", emoji: "📚" },
  { label: "Math & Puzzles", emoji: "🔢" },
  { label: "Science & Nature", emoji: "🔬" },
  { label: "Movement & Dance", emoji: "💃" },
];

const DURATIONS = [15, 30, 45];

const GOAL_COLORS: Record<string, { bg: string; color: string }> = {
  "Fine Motor":       { bg: "rgba(137,87,229,0.12)", color: "#8957E5" },
  "Language":         { bg: "rgba(59,130,246,0.12)",  color: "#3B82F6" },
  "Cognitive":        { bg: "rgba(245,184,41,0.15)",  color: "#B08000" },
  "Social-Emotional": { bg: "rgba(232,105,74,0.12)",  color: "#E8694A" },
};

function goalStyle(goal: string) {
  for (const key of Object.keys(GOAL_COLORS)) {
    if (goal.includes(key)) return GOAL_COLORS[key];
  }
  return { bg: "rgba(23,143,120,0.1)", color: "#178F78" };
}

function ageLabel(months: number) {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} months`;
  if (m === 0) return `${y} year${y > 1 ? "s" : ""}`;
  return `${y} yr${y > 1 ? "s" : ""} ${m} mo`;
}

export default function ActivityPlanner() {
  const [ageMonths, setAgeMonths]     = useState(36);
  const [interests, setInterests]     = useState<string[]>([]);
  const [duration, setDuration]       = useState(30);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ApiResponse | null>(null);
  const [error, setError]             = useState("");

  function toggleInterest(label: string) {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  }

  async function handlePlan() {
    if (interests.length === 0) { setError("Please select at least one interest area."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ageMonths, interests, duration }),
      });
      if (!res.ok) throw new Error("API error");
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch {
      setError("Failed to fetch activities. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <div style={{ fontFamily: "'Quicksand', 'Fredoka', sans-serif", maxWidth: "900px", margin: "0 auto", padding: "20px" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #178F78, #3B82F6)", borderRadius: "20px", padding: "24px 28px", marginBottom: "24px", color: "#fff" }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>
            🌱 Activity Planner
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9 }}>
            AI-powered age-appropriate activities grounded in NCF-FS & curriculum guidelines
          </div>
        </div>

        {/* Form card */}
        <div className="no-print" style={{ background: "#fff", borderRadius: "20px", padding: "24px 28px", boxShadow: "0 4px 20px rgba(23,143,120,0.08)", marginBottom: "24px" }}>

          {/* Age slider */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ fontSize: "14px", fontWeight: 700, color: "#1A2F4A" }}>Child Age</label>
              <span style={{ background: "linear-gradient(135deg, #178F78, #3B82F6)", color: "#fff", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", fontWeight: 700 }}>
                {ageLabel(ageMonths)}
              </span>
            </div>
            <input
              type="range"
              min={6}
              max={72}
              value={ageMonths}
              onChange={e => setAgeMonths(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#178F78", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
              <span>6 months</span>
              <span>6 years</span>
            </div>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 700, color: "#1A2F4A", display: "block", marginBottom: "12px" }}>
              Interest Areas <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(select all that apply)</span>
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
              {INTEREST_OPTIONS.map(opt => {
                const active = interests.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    onClick={() => toggleInterest(opt.label)}
                    style={{ padding: "10px 14px", borderRadius: "12px", border: active ? "2px solid #178F78" : "1.5px solid #EDE8DF", background: active ? "rgba(23,143,120,0.08)" : "#fff", color: active ? "#178F78" : "#4B5563", fontFamily: "'Quicksand', sans-serif", fontSize: "13px", fontWeight: active ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s", textAlign: "left" }}
                  >
                    <span style={{ fontSize: "18px" }}>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "14px", fontWeight: 700, color: "#1A2F4A", display: "block", marginBottom: "10px" }}>
              Session Duration
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {DURATIONS.map(d => (
                <label key={d} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 20px", borderRadius: "12px", border: duration === d ? "2px solid #178F78" : "1.5px solid #EDE8DF", background: duration === d ? "rgba(23,143,120,0.08)" : "#fff", cursor: "pointer", fontSize: "14px", fontWeight: duration === d ? 700 : 500, color: duration === d ? "#178F78" : "#4B5563", transition: "all 0.2s" }}>
                  <input type="radio" name="duration" value={d} checked={duration === d} onChange={() => setDuration(d)} style={{ accentColor: "#178F78" }} />
                  {d} min
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(232,105,74,0.1)", border: "1px solid rgba(232,105,74,0.3)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#C0390A", marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handlePlan}
            disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: loading ? "#EDE8DF" : "linear-gradient(135deg, #178F78, #3B82F6)", color: loading ? "#9CA3AF" : "#fff", fontFamily: "'Fredoka', sans-serif", fontSize: "17px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "background 0.2s" }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: "18px", height: "18px", border: "3px solid rgba(255,255,255,0.4)", borderTopColor: "#9CA3AF", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Planning activities…
              </>
            ) : "🌟 Plan Activities"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div id="activity-planner-results">
            {/* Result header */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "18px", fontWeight: 700, color: "#1A2F4A" }}>
                  Activities for {ageLabel(ageMonths)} · {duration} min sessions
                </div>
                <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>
                  Based on: {result.sources?.join(" · ") || "NCF-FS, Curriculum Guide"}
                </div>
              </div>
              <button
                onClick={() => window.print()}
                style={{ padding: "9px 20px", borderRadius: "12px", border: "1.5px solid #178F78", background: "#fff", color: "#178F78", fontFamily: "'Quicksand', sans-serif", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                🖨️ Print
              </button>
            </div>

            {/* Activity grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "16px" }}>
              {result.activities.map((act, idx) => (
                <div key={idx} style={{ background: "#fff", borderRadius: "18px", boxShadow: "0 4px 18px rgba(23,143,120,0.08)", overflow: "hidden", border: "1px solid #EEF2FF" }}>
                  {/* Card header */}
                  <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #F0F4FF" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "30px" }}>{act.emoji}</span>
                        <div>
                          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A2F4A" }}>{act.name}</div>
                          <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                            Suitable for {ageLabel(ageMonths)}
                          </div>
                        </div>
                      </div>
                      <span style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", flexShrink: 0 }}>
                        {duration} min
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "16px 20px" }}>
                    {/* Materials */}
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#E8694A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Materials Needed</div>
                      <ul style={{ margin: 0, paddingLeft: "18px", listStyleType: "disc" }}>
                        {act.materials.map((m, i) => (
                          <li key={i} style={{ fontSize: "13px", color: "#4B5563", marginBottom: "3px" }}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Instructions</div>
                      <ol style={{ margin: 0, paddingLeft: "20px" }}>
                        {act.steps.map((s, i) => (
                          <li key={i} style={{ fontSize: "13px", color: "#4B5563", marginBottom: "4px", lineHeight: "1.5" }}>{s}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Learning goals */}
                    {act.goals && act.goals.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#8957E5", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Learning Goals</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {act.goals.map((g, i) => {
                            const gs = goalStyle(g);
                            return (
                              <span key={i} style={{ padding: "4px 12px", borderRadius: "20px", background: gs.bg, color: gs.color, fontSize: "12px", fontWeight: 700 }}>
                                {g}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Citation */}
                    {act.source && (
                      <div style={{ fontSize: "11px", color: "#9CA3AF", borderTop: "1px solid #F0F4FF", paddingTop: "10px", marginTop: "4px" }}>
                        📎 Based on: <span style={{ color: "#178F78", fontWeight: 600 }}>{act.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Print-only footer */}
            <div style={{ marginTop: "20px", fontSize: "11px", color: "#9CA3AF", textAlign: "center" }}>
              Evergreen Preschool, Electronic City, Bengaluru · Activities generated for {ageLabel(ageMonths)} · {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        )}

        {/* RAG explanation card */}
        <div className="no-print" style={{ background: "linear-gradient(135deg, rgba(23,143,120,0.06), rgba(59,130,246,0.06))", borderRadius: "20px", padding: "24px 28px", marginTop: "28px", border: "1.5px solid rgba(23,143,120,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontSize: "24px" }}>🧠</span>
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "17px", fontWeight: 700, color: "#1A2F4A" }}>Why RAG Activities?</div>
              <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "1px" }}>Retrieval-Augmented Generation</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(232,105,74,0.07)", borderRadius: "14px", padding: "14px 16px", borderLeft: "3px solid #E8694A" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#E8694A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Plain AI</div>
              <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.6" }}>
                "Generate activities for a 3-year-old" → generic answer from training data only
              </div>
            </div>
            <div style={{ background: "rgba(23,143,120,0.07)", borderRadius: "14px", padding: "14px 16px", borderLeft: "3px solid #178F78" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#178F78", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>RAG (This Planner)</div>
              <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.6" }}>
                Same request + retrieved NCF curriculum docs + your school's activity library → specific, curriculum-aligned, age-accurate response
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
