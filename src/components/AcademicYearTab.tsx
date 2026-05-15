"use client";
/**
 * ACADEMIC YEAR TAB
 * src/components/AcademicYearTab.tsx
 * Add to admin/page.tsx:
 *   import AcademicYearTab from "@/components/AcademicYearTab";
 *   { key: "academic", label: "🎓 Academic Year", count: 0 }
 *   {tab === "academic" && <AcademicYearTab onYearChange={loadEnquiries} />}
 */

import { useState, useEffect, useCallback } from "react";

const inp: React.CSSProperties = {
  border: "1px solid #EDE8DF", borderRadius: "10px", padding: "9px 13px",
  fontSize: "13px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#6B7A99",
  display: "block", marginBottom: "5px",
};

interface AcademicYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

interface Props {
  onYearChange?: () => void;
}

export default function AcademicYearTab({ onYearChange }: Props) {
  const [years, setYears]         = useState<AcademicYear[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [rolloverModal, setRolloverModal] = useState(false);
  const [rolloverFrom, setRolloverFrom]   = useState("");
  const [rolloverTo, setRolloverTo]       = useState("");
  const [rolloverMsg, setRolloverMsg]     = useState("");
  const [form, setForm] = useState({ label: "", start_date: "", end_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/academic-years");
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load");
      else setYears(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCurrent = async (id: string) => {
    setSaving(true);
    const res  = await fetch("/api/academic-years", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_current", id }),
    });
    const data = await res.json();
    if (data.success) { load(); onYearChange?.(); }
    else setError(data.error);
    setSaving(false);
  };

  const addYear = async () => {
    if (!form.label || !form.start_date || !form.end_date) return;
    setSaving(true);
    const res  = await fetch("/api/academic-years", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) { setShowForm(false); setForm({ label: "", start_date: "", end_date: "" }); load(); }
    else setError(data.error);
    setSaving(false);
  };

  const doRollover = async () => {
    if (!rolloverFrom || !rolloverTo) return;
    setSaving(true);
    setRolloverMsg("");
    const res  = await fetch("/api/academic-years", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rollover", from_year_id: rolloverFrom, to_year_id: rolloverTo }),
    });
    const data = await res.json();
    if (data.success) {
      setRolloverMsg("✅ Children rolled over successfully!");
      onYearChange?.();
      load();
    } else setRolloverMsg("❌ " + data.error);
    setSaving(false);
  };

  const deleteYear = async (id: string, label: string) => {
    if (!confirm(`Delete academic year "${label}"? This cannot be undone.`)) return;
    const res  = await fetch("/api/academic-years", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error);
  };

  const currentYear = years.find(y => y.is_current);
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ maxWidth: "760px" }}>

      {/* Current year banner */}
      {currentYear && (
        <div style={{ background: "linear-gradient(135deg,#178F78,#0F766E)", borderRadius: "18px", padding: "20px 24px", marginBottom: "20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.8, letterSpacing: "1px", marginBottom: "4px" }}>CURRENT ACADEMIC YEAR</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "28px", fontWeight: 700 }}>{currentYear.label}</div>
            <div style={{ fontSize: "13px", opacity: 0.85, marginTop: "4px" }}>
              {fmt(currentYear.start_date)} — {fmt(currentYear.end_date)}
            </div>
          </div>
          <div style={{ fontSize: "48px" }}>🎓</div>
        </div>
      )}

      {/* Actions row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
          + New Academic Year
        </button>
        <button onClick={() => setRolloverModal(true)}
          style={{ background: "#F5B829", color: "#1A2F4A", border: "none", borderRadius: "12px", padding: "9px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
          🔄 Year Rollover
        </button>
      </div>

      {/* Add year form */}
      {showForm && (
        <div style={{ background: "white", borderRadius: "16px", border: "2px solid #178F78", padding: "18px", marginBottom: "16px" }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, color: "#178F78", marginBottom: "14px" }}>
            Add New Academic Year
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={lbl}>YEAR LABEL *</label>
              <input style={inp} value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. 2026-27" />
            </div>
            <div>
              <label style={lbl}>START DATE *</label>
              <input type="date" style={inp} value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>END DATE *</label>
              <input type="date" style={inp} value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={addYear} disabled={saving || !form.label || !form.start_date || !form.end_date}
              style={{ background: !form.label || !form.start_date || !form.end_date ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "9px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Adding…" : "+ Add Year"}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "10px 14px", color: "#DC2626", fontSize: "12px", fontWeight: 600, marginBottom: "12px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Years list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {years.map(y => {
            const now     = new Date();
            const start   = new Date(y.start_date);
            const end     = new Date(y.end_date);
            const active  = now >= start && now <= end;
            const past    = now > end;
            const future  = now < start;
            const pct     = active ? Math.round(((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100) : past ? 100 : 0;

            return (
              <div key={y.id} style={{ background: "white", borderRadius: "16px", border: `2px solid ${y.is_current ? "#178F78" : "#EDE8DF"}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                  {/* Year label */}
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "20px", fontWeight: 700, color: "#1A2F4A" }}>{y.label}</div>
                      {y.is_current && (
                        <span style={{ background: "#178F78", color: "white", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", fontWeight: 700 }}>CURRENT</span>
                      )}
                      {past && !y.is_current && (
                        <span style={{ background: "#EDE8DF", color: "#6B7A99", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", fontWeight: 700 }}>PAST</span>
                      )}
                      {future && (
                        <span style={{ background: "rgba(245,184,41,0.15)", color: "#B08000", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", fontWeight: 700 }}>UPCOMING</span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>
                      {fmt(y.start_date)} → {fmt(y.end_date)}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ flex: 2, minWidth: "160px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6B7A99", marginBottom: "4px" }}>
                      <span>{past ? "Completed" : active ? `${pct}% complete` : "Not started"}</span>
                      <span>{pct}%</span>
                    </div>
                    <div style={{ background: "#FAF0E8", borderRadius: "20px", height: "6px", overflow: "hidden" }}>
                      <div style={{ background: past ? "#6B7A99" : "#178F78", height: "100%", width: `${pct}%`, borderRadius: "20px", transition: "width 0.4s" }} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    {!y.is_current && (
                      <button onClick={() => setCurrent(y.id)} disabled={saving}
                        style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "8px", padding: "7px 14px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        ✓ Set Current
                      </button>
                    )}
                    {!y.is_current && (
                      <button onClick={() => deleteYear(y.id, y.label)}
                        style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "none", borderRadius: "8px", padding: "7px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rollover Modal */}
      {rolloverModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "28px", width: "100%", maxWidth: "460px" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "20px", fontWeight: 700, color: "#1A2F4A", marginBottom: "6px" }}>🔄 Year Rollover</div>
            <div style={{ fontSize: "13px", color: "#6B7A99", marginBottom: "20px" }}>
              Move all <strong>enrolled</strong> children from one academic year to the next. Their section assignments will be cleared so you can re-assign them.
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>FROM YEAR (source)</label>
              <select style={inp} value={rolloverFrom} onChange={e => setRolloverFrom(e.target.value)}>
                <option value="">— Select year —</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.label}{y.is_current ? " (current)" : ""}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={lbl}>TO YEAR (destination)</label>
              <select style={inp} value={rolloverTo} onChange={e => setRolloverTo(e.target.value)}>
                <option value="">— Select year —</option>
                {years.filter(y => y.id !== rolloverFrom).map(y => <option key={y.id} value={y.id}>{y.label}{y.is_current ? " (current)" : ""}</option>)}
              </select>
            </div>

            {rolloverMsg && (
              <div style={{ background: rolloverMsg.startsWith("✅") ? "rgba(23,143,120,0.1)" : "rgba(220,38,38,0.1)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontWeight: 600, color: rolloverMsg.startsWith("✅") ? "#178F78" : "#DC2626", marginBottom: "14px" }}>
                {rolloverMsg}
              </div>
            )}

            <div style={{ background: "rgba(245,184,41,0.12)", border: "1px solid rgba(245,184,41,0.4)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#B08000", marginBottom: "20px" }}>
              ⚠️ This will move all enrolled children and clear their section assignments. This action cannot be undone.
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={doRollover} disabled={saving || !rolloverFrom || !rolloverTo}
                style={{ flex: 1, background: !rolloverFrom || !rolloverTo ? "#ccc" : "#F5B829", color: "#1A2F4A", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: !rolloverFrom || !rolloverTo ? "not-allowed" : "pointer" }}>
                {saving ? "Rolling over…" : "🔄 Confirm Rollover"}
              </button>
              <button onClick={() => { setRolloverModal(false); setRolloverMsg(""); }}
                style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
