"use client";
import { useState, useEffect, useCallback } from "react";
import TransportOptIn from "@/components/TransportOptIn";
import BusMap from "@/components/BusMap";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function Spin() {
  return <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />;
}

interface Props {
  // If provided, skip loading children and use this child directly (parent-dashboard already knows the selected child)
  fixedChild?: any;
  session: any;
}

export default function TransportParentView({ fixedChild, session }: Props) {
  const [children, setChildren]       = useState<any[]>([]);
  const [selected, setSelected]       = useState<any>(fixedChild || null);
  const [date, setDate]               = useState(todayStr());
  const [optIn, setOptIn]             = useState<any>(null);
  const [childLogs, setChildLogs]     = useState<any[]>([]);   // both routes for this child
  const [allRideLogs, setAllRideLogs] = useState<any[]>([]);   // all children, for vanStarted
  const [locations, setLocations]     = useState<any[]>([]);
  const [loading, setLoading]         = useState(!fixedChild);
  const [confirming, setConfirming]   = useState(false);
  const [showEnroll, setShowEnroll]   = useState(false);

  // Load children list only when no fixedChild is given
  useEffect(() => {
    if (fixedChild) { setSelected(fixedChild); return; }
    if (!session?.phone) return;
    const month = new Date().toISOString().slice(0, 7);
    fetch(`/api/parent/dashboard?phone=${encodeURIComponent(session.phone)}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        const kids = data.enquiries || [];
        setChildren(kids);
        if (kids.length === 1) setSelected(kids[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, fixedChild]);

  // When fixedChild changes externally (e.g. parent switches child in dashboard)
  useEffect(() => { if (fixedChild) setSelected(fixedChild); }, [fixedChild]);

  const loadStatus = useCallback(async () => {
    if (!selected?.id) return;
    try {
      const [oRes, rRes, lRes, arRes] = await Promise.all([
        fetch(`/api/transport/opt-ins?child_id=${selected.id}`),
        fetch(`/api/transport/ride-logs?date=${date}&child_id=${selected.id}`),
        fetch("/api/transport/location"),
        fetch(`/api/transport/ride-logs?date=${date}`),
      ]);
      const [oData, rData, lData, arData] = await Promise.all([oRes.json(), rRes.json(), lRes.json(), arRes.json()]);
      setOptIn(oData.opt_in || null);
      setChildLogs(rData.ride_logs || []);
      setLocations(lData.locations || []);
      setAllRideLogs(arData.ride_logs || []);
    } catch { /* network blip — keep showing last known state */ }
  }, [selected, date]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Poll live location every 5 s so map appears/disappears promptly when staff share/stop
  useEffect(() => {
    if (!selected?.id) return;
    const fetchLoc = async () => {
      try {
        const d = await fetch("/api/transport/location", { cache: "no-store" }).then(r => r.json());
        setLocations(d.locations || []);
      } catch { /* network blip — keep showing last known state, don't crash */ }
    };
    fetchLoc();
    const t = setInterval(fetchLoc, 5000);
    return () => clearInterval(t);
  }, [selected?.id]);

  const confirmHome = async () => {
    if (!selected) return;
    setConfirming(true);
    const afternoonLog = childLogs.find((r: any) => r.route_id === "route_afternoon");
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id: selected.id, child_name: selected.child_name, date,
        route_id: "route_afternoon",
        checkout_time: nowTime(), checked_by: session?.phone || "parent",
        status: "dropped", checkin_time: afternoonLog?.checkin_time || null,
      }),
    });
    await loadStatus();
    setConfirming(false);
  };

  const [ppSaving, setPPSaving] = useState(false);
  const [pdSaving, setPDSaving] = useState(false);

  const markPP = async () => {
    if (!selected) return;
    setPPSaving(true);
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: selected.id, child_name: selected.child_name, date, route_id: "route_afternoon", checked_by: session?.phone || "parent", status: "pp" }),
    });
    await loadStatus();
    setPPSaving(false);
  };

  const cancelPP = async () => {
    if (!selected) return;
    setPPSaving(true);
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: selected.id, child_name: selected.child_name, date, route_id: "route_afternoon", checked_by: session?.phone || "parent", status: "waiting" }),
    });
    await loadStatus();
    setPPSaving(false);
  };

  const markPD = async () => {
    if (!selected) return;
    setPDSaving(true);
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: selected.id, child_name: selected.child_name, date, route_id: "route_morning", checked_by: session?.phone || "parent", status: "pd" }),
    });
    await loadStatus();
    setPDSaving(false);
  };

  const cancelPD = async () => {
    if (!selected) return;
    setPDSaving(true);
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ child_id: selected.id, child_name: selected.child_name, date, route_id: "route_morning", checked_by: session?.phone || "parent", status: "waiting" }),
    });
    await loadStatus();
    setPDSaving(false);
  };

  const vanStarted   = allRideLogs.some((r: any) => r.status === "boarded" || r.status === "dropped");
  const enrolled     = optIn?.opted_in === true;
  const morningLog   = childLogs.find((r: any) => r.route_id === "route_morning"  || !r.route_id);
  const afternoonLog = childLogs.find((r: any) => r.route_id === "route_afternoon");

  const isTodayPickup = enrolled && optIn?.mode === "today";

  const morningStatus   = morningLog?.status;
  const afternoonStatus = afternoonLog?.status;

  let busStatus: string;
  if (!enrolled)                                                   busStatus = "not_enrolled";
  else if (afternoonStatus === "dropped")                          busStatus = "at_home";
  else if (afternoonStatus === "boarded")                          busStatus = "on_van_home";
  else if (morningStatus === "pd" && afternoonStatus === "pp")     busStatus = "parent_drop_and_pickup";
  else if (afternoonStatus === "pp")                               busStatus = "parent_pickup";
  else if (morningStatus === "dropped")                            busStatus = "at_school";
  else if (morningStatus === "boarded")                            busStatus = "on_van_school";
  else if (morningStatus === "pd")                                 busStatus = "parent_drop";
  else if (morningStatus === "absent" || afternoonStatus === "absent") busStatus = "absent";
  else if (isTodayPickup && !vanStarted)                           busStatus = "pickup_pending";
  else if (vanStarted)                                             busStatus = "waiting";
  else                                                             busStatus = "enrolled_pending";

  // Independent flags for buttons — checked against individual logs, NOT busStatus
  const morningOpen   = enrolled && !["pd","boarded","dropped","absent"].includes(morningStatus || "");
  const afternoonOpen = enrolled && !["pp","boarded","dropped","absent"].includes(afternoonStatus || "") &&
                        morningStatus !== "absent";

  const SI: Record<string, { icon: string; label: string; color: string; desc: string }> = {
    not_enrolled:            { icon: "🚫", label: "Not Enrolled",              color: "#9CA3AF", desc: "Expand 'Manage Enrollment' below to join bus service." },
    enrolled_pending:        { icon: "📋", label: "Enrolled · Awaiting",       color: "#178F78", desc: "Pickup hasn't started yet for today." },
    pickup_pending:          { icon: "📅", label: "PP · Pickup Today",         color: "#E8694A", desc: "You requested pickup for today — van will arrive shortly." },
    waiting:                 { icon: "⏳", label: "Waiting for Pickup",        color: "#F5B829", desc: "Van is on the way — watch for a WhatsApp update." },
    on_van_school:           { icon: "🚌", label: "On the Van → School",       color: "#6366F1", desc: `Boarded at ${morningLog?.checkin_time || "—"} · heading to school.` },
    at_school:               { icon: "🏫", label: "At School",                 color: "#178F78", desc: `Dropped at school at ${morningLog?.checkout_time || "—"}.` },
    on_van_home:             { icon: "🚌", label: "On the Van → Home",         color: "#6366F1", desc: `Boarded at ${afternoonLog?.checkin_time || "—"} · heading home.` },
    at_home:                 { icon: "🏠", label: "Safely Home",               color: "#178F78", desc: `Dropped home at ${afternoonLog?.checkout_time || "—"}.` },
    parent_drop:             { icon: "🚗", label: "Parent Drop",               color: "#E8694A", desc: "You will drop your child at school today." },
    parent_pickup:           { icon: "🚗", label: "Parent Pickup",             color: "#E8694A", desc: "You will collect your child from school today." },
    parent_drop_and_pickup:  { icon: "🚗", label: "Parent Drop & Pickup",      color: "#E8694A", desc: "You will drop and collect your child today." },
    absent:                  { icon: "✗",  label: "Absent Today",              color: "#DC2626", desc: "Marked absent from bus." },
  };
  const si = SI[busStatus] || SI.not_enrolled;

  if (loading) return (
    <div style={{ textAlign: "center", padding: "48px", color: "#6B7A99", fontFamily: "'Quicksand',sans-serif" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #EDE8DF", borderTopColor: "#178F78", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
      Loading…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Quicksand',sans-serif" }}>

      {/* Child selector — only when not fixed */}
      {!fixedChild && children.length > 1 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {children.map(c => (
            <button key={c.id} onClick={() => setSelected(c)}
              style={{ padding: "7px 16px", borderRadius: "20px", border: `2px solid ${selected?.id === c.id ? "#178F78" : "#EDE8DF"}`, background: selected?.id === c.id ? "rgba(23,143,120,0.08)" : "white", fontWeight: 700, fontSize: "12px", color: selected?.id === c.id ? "#178F78" : "#6B7A99", cursor: "pointer" }}>
              {c.child_name}
            </button>
          ))}
        </div>
      )}

      {!fixedChild && children.length === 0 && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "28px", textAlign: "center", color: "#6B7A99" }}>
          No enrolled children found.
        </div>
      )}

      {selected && (
        <>
          {/* Date row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <span style={{ fontSize: "12px", color: "#6B7A99", fontWeight: 700 }}>Date:</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "5px 10px", fontSize: "12px", fontFamily: "'Quicksand',sans-serif", color: "#1A2F4A", background: "#FAF0E8" }} />
            <button onClick={loadStatus} style={{ padding: "5px 12px", borderRadius: "10px", border: "1px solid #EDE8DF", background: "white", fontSize: "11px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>↻</button>
          </div>

          {/* Status card */}
          <div style={{ background: `${si.color}10`, border: `2px solid ${si.color}30`, borderRadius: "16px", padding: "18px 20px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "40px", flexShrink: 0 }}>{si.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "18px", fontWeight: 700, color: si.color }}>{si.label}</div>
              <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>{si.desc}</div>
            </div>
          </div>

          {/* Confirm home — only when on afternoon van (heading home) */}
          {busStatus === "on_van_home" && (
            <button onClick={confirmHome} disabled={confirming}
              style={{ width: "100%", padding: "11px", borderRadius: "14px", border: "none", background: "#178F78", color: "white", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "14px", boxShadow: "0 4px 14px rgba(23,143,120,0.3)" }}>
              {confirming ? <><Spin /> Saving…</> : "🏠 Confirm Child Arrived Home"}
            </button>
          )}

          {/* PD button — only when morning slot is still open */}
          {morningOpen && (
            <button onClick={markPD} disabled={pdSaving}
              style={{ width: "100%", padding: "11px", borderRadius: "14px", border: "2px solid #E8694A", background: "white", color: "#E8694A", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              {pdSaving ? <><Spin /> Saving…</> : "🚗 I Will Drop My Child at School Today"}
            </button>
          )}

          {/* Cancel PD — always shown when morningLog is pd, independent of busStatus */}
          {morningStatus === "pd" && (
            <button onClick={cancelPD} disabled={pdSaving}
              style={{ width: "100%", padding: "11px", borderRadius: "14px", border: "2px solid #E8694A", background: "rgba(232,105,74,0.06)", color: "#E8694A", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              {pdSaving ? <><Spin /> Saving…</> : "↩ Cancel — Use Morning Van Instead"}
            </button>
          )}

          {/* PP button — only when afternoon slot is still open */}
          {afternoonOpen && (
            <button onClick={markPP} disabled={ppSaving}
              style={{ width: "100%", padding: "11px", borderRadius: "14px", border: "2px solid #E8694A", background: "white", color: "#E8694A", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              {ppSaving ? <><Spin /> Saving…</> : "🚗 I Will Pick Up My Child Today"}
            </button>
          )}

          {/* Cancel PP — always shown when afternoonLog is pp, independent of busStatus */}
          {afternoonStatus === "pp" && (
            <button onClick={cancelPP} disabled={ppSaving}
              style={{ width: "100%", padding: "11px", borderRadius: "14px", border: "2px solid #E8694A", background: "rgba(232,105,74,0.06)", color: "#E8694A", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "14px" }}>
              {ppSaving ? <><Spin /> Saving…</> : "↩ Cancel — Use Afternoon Van Instead"}
            </button>
          )}

          {/* Live Van Location — visible to all parents whenever someone is sharing */}
          {(
            <div style={{ background: "white", borderRadius: "16px", border: `2px solid ${locations.some((l:any) => l.latitude !== 0) ? "#178F78" : "#EDE8DF"}`, overflow: "hidden", marginBottom: "14px" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #EDE8DF", fontSize: "12px", fontWeight: 700, color: "#178F78", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>📍 Live Van Location</span>
                {(busStatus === "on_van_school" || busStatus === "on_van_home") && <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(99,102,241,0.1)", color: "#6366F1", borderRadius: "20px", padding: "2px 8px" }}>● On the Van</span>}
                {busStatus === "waiting" && <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(245,184,41,0.1)", color: "#F5B829", borderRadius: "20px", padding: "2px 8px" }}>⏳ On the Way</span>}
              </div>
              {locations.some((l: any) => l.latitude !== 0)
                ? <BusMap locations={locations} height="240px" />
                : (
                  <div style={{ height: "100px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#9CA3AF" }}>
                    <span style={{ fontSize: "24px" }}>🛰️</span>
                    <span style={{ fontSize: "11px", textAlign: "center", padding: "0 16px" }}>No live location yet — staff will begin sharing when the van departs</span>
                  </div>
                )
              }
            </div>
          )}

          {/* Enrollment management — collapsible */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
            <button onClick={() => setShowEnroll(v => !v)}
              style={{ width: "100%", padding: "14px 16px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "14px", fontWeight: 700, color: "#178F78" }}>
                🚌 Manage Bus Enrollment
                {optIn?.opted_in && (
                  <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: 700, background: "rgba(23,143,120,0.1)", color: "#178F78", borderRadius: "20px", padding: "2px 8px" }}>
                    {optIn.mode === "permanent" ? "Permanent" : `Until ${new Date(optIn.end_date).toLocaleDateString("en-IN")}`}
                  </span>
                )}
                {optIn && !optIn.opted_in && (
                  <span style={{ marginLeft: "8px", fontSize: "10px", fontWeight: 700, background: "rgba(220,38,38,0.08)", color: "#DC2626", borderRadius: "20px", padding: "2px 8px" }}>Not enrolled</span>
                )}
              </div>
              <span style={{ fontSize: "14px", color: "#6B7A99" }}>{showEnroll ? "▲" : "▼"}</span>
            </button>
            {showEnroll && (
              <div style={{ padding: "0 16px 16px" }}>
                <TransportOptIn
                  childId={selected.id}
                  childName={selected.child_name}
                  parentPhone={session?.phone || ""}
                  updatedBy={session?.phone || "parent"}
                />
              </div>
            )}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
