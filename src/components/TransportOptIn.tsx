"use client";
import { useState, useEffect, useCallback } from "react";

type Mode = "permanent" | "today" | "week" | "month" | "custom";

interface Props {
  childId:     string;
  childName:   string;
  parentPhone: string;
  updatedBy:   string;   // phone or name of the person making the change
}

const MODE_LABELS: Record<Mode, string> = {
  permanent: "Permanent",
  today:     "Today only",
  week:      "1 Week",
  month:     "1 Month",
  custom:    "Custom dates",
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

function addDays(from: string, n: number) {
  const d = new Date(from); d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function TransportOptIn({ childId, childName, parentPhone, updatedBy }: Props) {
  const [optIn, setOptIn]       = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Form state
  const [wantOptIn, setWantOptIn]     = useState(false);
  const [mode, setMode]               = useState<Mode>("permanent");
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd]     = useState(addDays(todayStr(), 7));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/transport/opt-ins?child_id=${childId}`);
    const data = await res.json();
    const rec = data.opt_in;
    setOptIn(rec || null);
    if (rec) {
      setWantOptIn(rec.opted_in);
      setMode((rec.mode as Mode) || "permanent");
      if (rec.start_date) setCustomStart(rec.start_date);
      if (rec.end_date)   setCustomEnd(rec.end_date);
    }
    setLoading(false);
  }, [childId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setError(""); setSuccess("");

    let start = todayStr();
    let end: string | null = null;

    if (wantOptIn) {
      if (mode === "today")     { start = todayStr(); end = todayStr(); }
      else if (mode === "week") { start = todayStr(); end = addDays(start, 6); }
      else if (mode === "month"){ start = todayStr(); end = addDays(start, 29); }
      else if (mode === "custom") {
        if (!customStart || !customEnd || customEnd < customStart) {
          setError("End date must be on or after start date."); setSaving(false); return;
        }
        start = customStart; end = customEnd;
      }
      // permanent: start = today, end = null
    }

    const res = await fetch("/api/transport/opt-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id:    childId,
        child_name:  childName,
        parent_phone: parentPhone,
        opted_in:    wantOptIn,
        mode,
        start_date:  start,
        end_date:    end,
        updated_by:  updatedBy,
      }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); }
    else { setSuccess("Saved!"); await load(); }
    setSaving(false);
  };

  // Derive active status label from saved record
  function statusBadge() {
    if (!optIn || !optIn.opted_in) return null;
    const today = todayStr();
    const m = optIn.mode as Mode;

    if (m === "permanent") {
      if (optIn.end_date && optIn.end_date < today) return { label:"Expired", color:"#DC2626" };
      return { label:"Permanent", color:"#178F78" };
    }
    if (!optIn.start_date || !optIn.end_date) return null;
    if (optIn.end_date < today) return { label:"Expired", color:"#DC2626" };
    if (optIn.start_date > today) return { label:`Starts ${formatDate(optIn.start_date)}`, color:"#F5B829" };
    return { label:`Until ${formatDate(optIn.end_date)}`, color:"#6366F1" };
  }

  const badge = statusBadge();

  if (loading) return (
    <div style={{ padding:"20px", textAlign:"center", color:"#6B7A99", fontSize:"12px" }}>
      <div style={{ width:"24px", height:"24px", border:"2px solid #EDE8DF", borderTopColor:"#178F78", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 8px" }} />
      Loading…
    </div>
  );

  return (
    <div style={{ fontFamily:"'Quicksand',sans-serif" }}>

      {/* Current status row */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px", flexWrap:"wrap" }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:optIn?.opted_in ? "#178F78" : "#6B7A99" }}>
          {optIn?.opted_in ? "✅ On Bus" : "🚫 Not enrolled"}
        </div>
        {badge && (
          <span style={{ fontSize:"10px", fontWeight:700, background:`${badge.color}15`, color:badge.color, borderRadius:"20px", padding:"2px 10px" }}>
            {badge.label}
          </span>
        )}
        {optIn?.updated_by && (
          <span style={{ fontSize:"10px", color:"#9CA3AF" }}>by {optIn.updated_by}</span>
        )}
      </div>

      {/* Opt-in toggle */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
        <button onClick={() => setWantOptIn(true)}
          style={{ flex:1, padding:"9px", borderRadius:"12px", border:`2px solid ${wantOptIn?"#178F78":"#EDE8DF"}`, background:wantOptIn?"rgba(23,143,120,0.08)":"white", fontWeight:700, fontSize:"13px", color:wantOptIn?"#178F78":"#6B7A99", cursor:"pointer", transition:"all 0.2s" }}>
          ✅ Enroll in Bus
        </button>
        <button onClick={() => setWantOptIn(false)}
          style={{ flex:1, padding:"9px", borderRadius:"12px", border:`2px solid ${!wantOptIn?"#DC2626":"#EDE8DF"}`, background:!wantOptIn?"rgba(220,38,38,0.06)":"white", fontWeight:700, fontSize:"13px", color:!wantOptIn?"#DC2626":"#6B7A99", cursor:"pointer", transition:"all 0.2s" }}>
          ✗ Not Using Bus
        </button>
      </div>

      {/* Duration selector — only shown when opted in */}
      {wantOptIn && (
        <div style={{ marginBottom:"14px" }}>
          <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", marginBottom:"8px" }}>Duration</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"6px", marginBottom:"10px" }}>
            {(["permanent","today","week","month","custom"] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ padding:"8px", borderRadius:"10px", border:`2px solid ${mode===m?"#178F78":"#EDE8DF"}`, background:mode===m?"rgba(23,143,120,0.08)":"white", fontWeight:700, fontSize:"12px", color:mode===m?"#178F78":"#6B7A99", cursor:"pointer", transition:"all 0.2s" }}>
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {mode === "permanent" && (
            <div style={{ fontSize:"11px", color:"#178F78", background:"rgba(23,143,120,0.08)", borderRadius:"10px", padding:"8px 12px" }}>
              Child will always be on the bus roster unless you change this setting.
            </div>
          )}
          {mode === "today" && (
            <div style={{ fontSize:"11px", color:"#F5B829", background:"rgba(245,184,41,0.08)", borderRadius:"10px", padding:"8px 12px" }}>
              Active for today ({formatDate(todayStr())}) only.
            </div>
          )}
          {mode === "week" && (
            <div style={{ fontSize:"11px", color:"#6366F1", background:"rgba(99,102,241,0.08)", borderRadius:"10px", padding:"8px 12px" }}>
              Active from today until {formatDate(addDays(todayStr(), 6))}.
            </div>
          )}
          {mode === "month" && (
            <div style={{ fontSize:"11px", color:"#E8694A", background:"rgba(232,105,74,0.08)", borderRadius:"10px", padding:"8px 12px" }}>
              Active from today until {formatDate(addDays(todayStr(), 29))}.
            </div>
          )}
          {mode === "custom" && (
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"10px", color:"#6B7A99", marginBottom:"4px" }}>From</div>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"6px 10px", fontSize:"12px", fontFamily:"'Quicksand',sans-serif", color:"#1A2F4A", background:"white" }} />
              </div>
              <div>
                <div style={{ fontSize:"10px", color:"#6B7A99", marginBottom:"4px" }}>To</div>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"6px 10px", fontSize:"12px", fontFamily:"'Quicksand',sans-serif", color:"#1A2F4A", background:"white" }} />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", color:"#DC2626", marginBottom:"10px" }}>❌ {error}</div>
      )}
      {success && (
        <div style={{ background:"rgba(23,143,120,0.08)", border:"1px solid rgba(23,143,120,0.25)", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", color:"#178F78", marginBottom:"10px" }}>✅ {success}</div>
      )}

      <button onClick={save} disabled={saving}
        style={{ width:"100%", padding:"10px", borderRadius:"14px", border:"none", background:saving?"#b2dfdb":"#178F78", color:"white", fontWeight:700, fontSize:"13px", cursor:saving?"not-allowed":"pointer", boxShadow:saving?"none":"0 4px 14px rgba(23,143,120,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
        {saving
          ? <><span style={{ width:"13px", height:"13px", border:"2px solid rgba(255,255,255,0.35)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} /> Saving…</>
          : "💾 Save Transport Setting"
        }
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
