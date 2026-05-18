"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import BusMap from "@/components/BusMap";
import TransportReport from "@/components/TransportReport";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function Spin({ white = true }: { white?: boolean }) {
  const c = white ? "rgba(255,255,255,0.35)" : "#EDE8DF";
  const t = white ? "white" : "#178F78";
  return <span style={{ display:"inline-block", width:"14px", height:"14px", border:`2px solid ${c}`, borderTopColor:t, borderRadius:"50%", animation:"spin 0.8s linear infinite", flexShrink:0 }} />;
}

export default function TransportStaffView({ session, isAdmin = false }: { session: any; isAdmin?: boolean }) {
  const [date, setDate]         = useState(todayStr());
  const [optIns, setOptIns]     = useState<any[]>([]);
  const [rideLogs, setRideLogs] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState<string | null>(null);
  const [mainView, setMainView] = useState<"roster" | "report">("roster");

  // Location sharing
  const [routeId, setRouteId]     = useState("route_morning");
  const [sharing, setSharing]     = useState(false);
  const [locStatus, setLocStatus] = useState("");
  const locRef                    = useRef<any>(null);

  // Map
  const [locations, setLocations] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [oRes, rRes, lRes] = await Promise.all([
        fetch(`/api/transport/opt-ins?date=${date}`),
        fetch(`/api/transport/ride-logs?date=${date}&route_id=${routeId}`),
        fetch("/api/transport/location"),
      ]);
      const [oData, rData, lData] = await Promise.all([oRes.json(), rRes.json(), lRes.json()]);
      setOptIns(oData.opt_ins || []);
      setRideLogs(rData.ride_logs || []);
      setLocations(lData.locations || []);
    } catch { /* network blip — keep showing last known state */ }
    setLoading(false);
  }, [date, routeId]);

  useEffect(() => { load(); }, [load]);

  // Poll location every 5 s for viewers who aren't sharing
  useEffect(() => {
    if (sharing) return; // sharer pushes via GPS callback; poll would overwrite with stale DB data
    const fetchLoc = async () => {
      try {
        const d = await fetch("/api/transport/location", { cache: "no-store" }).then(r => r.json());
        setLocations(d.locations || []);
      } catch { /* network blip — keep showing last known state */ }
    };
    fetchLoc();
    const t = setInterval(fetchLoc, 5000);
    return () => clearInterval(t);
  }, [sharing]);

  const rideMap: Record<string, any> = Object.fromEntries(rideLogs.map(r => [r.child_id, r]));
  const vanStarted = rideLogs.some(r => r.status === "boarded" || r.status === "dropped");

  const orderField = routeId === "route_afternoon" ? "drop_order" : "pickup_order";
  const roster = [...optIns].sort((a, b) => (a[orderField] || 0) - (b[orderField] || 0) || a.child_name.localeCompare(b.child_name));

  const markStatus = async (child: any, status: string) => {
    setSaving(child.child_id);
    const log      = rideMap[child.child_id] || {};
    const staffName = session?.name || session?.email || "Staff";
    const body = {
      child_id:      child.child_id,
      child_name:    child.child_name,
      date,
      route_id:      routeId,
      checkin_time:  status === "boarded" ? nowTime() : (log.checkin_time  || null),
      checkout_time: status === "dropped" ? nowTime() : (log.checkout_time || null),
      checked_by:    staffName,
      status,
      boarded_by:    status === "boarded" ? staffName : (log.boarded_by || null),
      dropped_by:    status === "dropped" ? staffName : null,
    };
    await fetch("/api/transport/ride-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const nRes = await fetch("/api/transport/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: child.parent_phone, child_name: child.child_name, status, checkin_time: body.checkin_time, checkout_time: body.checkout_time }),
    });
    const nData = await nRes.json();
    if (nData.waLink) window.open(nData.waLink, "_blank");
    await load();
    setSaving(null);
  };

  const unmark = async (child: any) => {
    setSaving(child.child_id);
    const log        = rideMap[child.child_id] || {};
    const prevStatus = log.status === "dropped" ? "boarded" : "waiting";
    await fetch("/api/transport/ride-logs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        child_id:     child.child_id,
        child_name:   child.child_name,
        date,
        route_id:     routeId,
        checkin_time:  prevStatus === "waiting" ? null : log.checkin_time,
        checkout_time: null,
        checked_by:    session?.name || "Staff",
        status:        prevStatus,
        boarded_by:    prevStatus === "boarded" ? log.boarded_by : null,
        dropped_by:    null,
      }),
    });
    await load();
    setSaving(null);
  };

  const moveOrder = async (list: any[], idx: number, dir: -1 | 1, field: "pickup_order" | "drop_order") => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const a = list[idx], b = list[swapIdx];
    await Promise.all([
      fetch("/api/transport/opt-ins", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ child_id: a.child_id, [field]: swapIdx + 1 }) }),
      fetch("/api/transport/opt-ins", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ child_id: b.child_id, [field]: idx + 1 }) }),
    ]);
    await load();
  };

  const startSharing = () => {
    if (!navigator.geolocation) { setLocStatus("GPS not available"); return; }
    setSharing(true);
    const staffName      = session?.name || session?.username || "Staff";
    const currentRouteId = routeId;
    const push = () => navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        const updated_at = new Date().toISOString();
        // Save to DB first — if this fails, show the error so we can diagnose
        const res  = await fetch("/api/transport/location", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route_id: currentRouteId, latitude, longitude, shared_by: staffName }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLocStatus(`❌ ${data.error || "DB save failed"}`);
          return;
        }
        // Update local state after confirmed DB write so sharer and pollers stay in sync
        setLocations(prev => {
          const exists = prev.some(l => l.route_id === currentRouteId);
          const row    = { route_id: currentRouteId, latitude, longitude, shared_by: staffName, updated_at };
          return exists
            ? prev.map(l => l.route_id === currentRouteId ? { ...l, ...row } : l)
            : [...prev, row];
        });
        setLocStatus(`📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)} · ${nowTime()}`);
      },
      () => setLocStatus("GPS error — retrying…")
    );
    push();
    locRef.current = setInterval(push, 15000);
  };
  const stopSharing = async () => {
    clearInterval(locRef.current);
    setLocStatus("Stopping…");
    const currentRouteId = routeId;

    // PUT latitude=0 — same endpoint and same permissions as startSharing, so this
    // always succeeds if sharing worked. The GET endpoint filters neq(latitude, 0),
    // so all pollers (staff + parents) immediately receive an empty locations array
    // and stop showing the map / "someone is sharing" badge.
    await fetch("/api/transport/location", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route_id: currentRouteId, latitude: 0, longitude: 0, shared_by: "" }),
    });

    // Clear local state AFTER the DB write so the re-activated poll sees the zeroed row
    // (which GET will filter out) rather than the old live coordinates.
    setLocations(prev => prev.filter(l => l.route_id !== currentRouteId));
    setSharing(false);
    setLocStatus("Stopped");
  };
  useEffect(() => () => clearInterval(locRef.current), []);

  const stats = {
    enrolled: optIns.length,
    waiting:  vanStarted ? optIns.filter(o => !rideMap[o.child_id] || rideMap[o.child_id].status === "waiting").length : 0,
    onVan:    rideLogs.filter(r => r.status === "boarded").length,
    dropped:  rideLogs.filter(r => r.status === "dropped").length,
    absent:   rideLogs.filter(r => r.status === "absent").length,
  };

  const sc: Record<string, string> = { waiting: "#F5B829", boarded: "#6366F1", dropped: "#178F78", absent: "#DC2626", pp: "#E8694A", pd: "#E8694A" };

  // Detect who is sharing — any route, not just the one currently selected in the dropdown.
  // Filtering by routeId caused the map to stay blank when the sharer and viewer had
  // different routes selected (e.g. admin on route_morning, staff on route_afternoon).
  const myName             = session?.name || session?.username || "Staff";
  const activeLocation     = locations.find((l: any) => l.latitude !== 0);
  const activeSharer       = activeLocation?.shared_by || "";
  // "my stale share" = DB shows ME as sharer but I didn't click Start this session
  // (e.g. after a page refresh). Show Stop so I can clear the stale DB row.
  const isMyStaleShare     = !sharing && !!activeLocation && activeSharer === myName;
  const someoneElseSharing = !sharing && !!activeLocation && !isMyStaleShare;

  return (
    <div style={{ fontFamily: "'Quicksand',sans-serif" }}>
      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "6px 12px", fontSize: "13px", fontFamily: "'Quicksand',sans-serif", color: "#1A2F4A", background: "white" }} />
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: "10px", border: "1px solid #EDE8DF", background: "white", fontSize: "12px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>↻ Refresh</button>
        <select value={routeId} onChange={e => setRouteId(e.target.value)}
          style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "6px 10px", fontSize: "12px", fontFamily: "'Quicksand',sans-serif", background: "white", color: "#1A2F4A" }}>
          <option value="route_morning">Morning Route</option>
          <option value="route_afternoon">Afternoon Route</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "Enrolled", value: stats.enrolled, color: "#178F78" },
          { label: "Waiting",  value: stats.waiting,  color: "#F5B829" },
          { label: "On Van",   value: stats.onVan,    color: "#6366F1" },
          { label: "Dropped",  value: stats.dropped,  color: "#E8694A" },
          { label: "Absent",   value: stats.absent,   color: "#DC2626" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "12px", border: "1px solid #EDE8DF", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "#6B7A99", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Live Location card — always visible ── */}
      <div style={{ background: "white", borderRadius: "16px", border: `2px solid ${(sharing || isMyStaleShare) ? "#178F78" : someoneElseSharing ? "#F5B829" : "#EDE8DF"}`, overflow: "hidden", marginBottom: "16px" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #EDE8DF", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#178F78" }}>📍 Live Vehicle Location</span>
            {(sharing || isMyStaleShare) && (
              <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(23,143,120,0.12)", color: "#178F78", borderRadius: "20px", padding: "2px 10px" }}>● You are sharing</span>
            )}
            {someoneElseSharing && (
              <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(245,184,41,0.12)", color: "#B8860B", borderRadius: "20px", padding: "2px 10px" }}>
                📡 {activeSharer ? `${activeSharer} is sharing` : "Someone is sharing"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {locStatus && <span style={{ fontSize: "10px", color: "#6B7A99" }}>{locStatus}</span>}
            {/* Stop button: shown when actively sharing OR when DB still shows me as sharer (stale/after refresh) */}
            {(sharing || isMyStaleShare) && (
              <button onClick={stopSharing} style={{ padding: "6px 16px", borderRadius: "20px", border: "none", background: "#DC2626", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>■ Stop</button>
            )}
            {/* Start button: only when nobody is sharing for this route */}
            {!sharing && !isMyStaleShare && !someoneElseSharing && (
              <button onClick={startSharing} style={{ padding: "6px 16px", borderRadius: "20px", border: "none", background: "#178F78", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>📡 Start Sharing</button>
            )}
          </div>
        </div>
        {/* State 1: GPS being acquired (sharer clicked Start but first fix not confirmed yet) */}
        {sharing && !activeLocation && (
          <div style={{ height: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#178F78" }}>
            <Spin white={false} />
            <span style={{ fontSize: "12px", textAlign: "center", padding: "0 16px" }}>Acquiring GPS position… this may take a few seconds</span>
          </div>
        )}
        {/* State 2: Active location confirmed — show map */}
        {activeLocation && (
          <BusMap locations={locations} height="280px" />
        )}
        {/* State 3: Nobody sharing */}
        {!sharing && !activeLocation && (
          <div style={{ height: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", color: "#9CA3AF" }}>
            <span style={{ fontSize: "28px" }}>🛰️</span>
            <span style={{ fontSize: "12px", textAlign: "center", padding: "0 16px" }}>No live location yet — any staff member can click <b>Start Sharing</b> above to broadcast their GPS</span>
          </div>
        )}
      </div>

      {/* Main view toggle: Roster | Report (report only for admin) */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        <button onClick={() => setMainView("roster")}
          style={{ padding: "7px 20px", borderRadius: "20px", border: "none", background: mainView === "roster" ? "#1A2F4A" : "#EDE8DF", color: mainView === "roster" ? "white" : "#6B7A99", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
          🚌 Roster
        </button>
        {isAdmin && (
          <button onClick={() => setMainView("report")}
            style={{ padding: "7px 20px", borderRadius: "20px", border: "none", background: mainView === "report" ? "#6366F1" : "#EDE8DF", color: mainView === "report" ? "white" : "#6B7A99", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
            📊 Report
          </button>
        )}
      </div>

      {/* Report view */}
      {mainView === "report" && <TransportReport />}

      {/* Roster — unified, all actions in one place */}
      {mainView === "roster" && (loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : roster.length === 0 ? (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "32px", textAlign: "center", color: "#6B7A99" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚌</div>
          No children enrolled in transport for {date}.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {roster.map((o: any, idx: number) => {
            const log     = rideMap[o.child_id];
            const status  = log?.status || (vanStarted ? "waiting" : "enrolled");
            const color   = status === "enrolled" ? "#9CA3AF" : (sc[status] || "#9CA3AF");
            const isBusy  = saving === o.child_id;
            const boarded = status === "boarded" || status === "dropped";
            const dropped = status === "dropped";
            const absent  = status === "absent";
            const isPP    = status === "pp";
            const isPD    = status === "pd";

            return (
              <div key={o.child_id} style={{ background: "white", borderRadius: "14px", border: `1px solid ${color}30`, padding: "11px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

                  {/* Sequence ▲▼ */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" }}>
                    <button onClick={() => moveOrder(roster, idx, -1, orderField)} disabled={idx === 0}
                      style={{ width: "20px", height: "18px", border: "1px solid #EDE8DF", borderRadius: "4px", background: "#FAF0E8", cursor: idx === 0 ? "default" : "pointer", fontSize: "9px", color: "#6B7A99", opacity: idx === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", lineHeight: 1 }}>{idx + 1}</span>
                    <button onClick={() => moveOrder(roster, idx, 1, orderField)} disabled={idx === roster.length - 1}
                      style={{ width: "20px", height: "18px", border: "1px solid #EDE8DF", borderRadius: "4px", background: "#FAF0E8", cursor: idx === roster.length - 1 ? "default" : "pointer", fontSize: "9px", color: "#6B7A99", opacity: idx === roster.length - 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: "100px" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {o.child_name}
                      {o.mode === "today" && (
                        <span style={{ fontSize: "9px", fontWeight: 800, background: "#E8694A", color: "white", borderRadius: "6px", padding: "1px 6px", letterSpacing: "0.5px" }}>PP</span>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "#6B7A99" }}>
                      {o.parent_phone}
                      {log?.checkin_time  && <span style={{ marginLeft: "8px" }}>📍 {log.checkin_time}</span>}
                      {log?.checkout_time && <span style={{ marginLeft: "8px" }}>🏠 {log.checkout_time}</span>}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{ fontSize: "10px", fontWeight: 700, background: `${color}15`, color, borderRadius: "20px", padding: "3px 10px", whiteSpace: "nowrap" as const, textTransform: "capitalize" as const }}>
                    {status === "enrolled" ? "Not started" : status === "pp" ? "Parent Pickup" : status === "pd" ? "Parent Drop" : status}
                  </span>

                  {/* All actions in one place — shown based on current status */}
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>

                    {/* Not yet boarded / absent / PP / PD → show Boarded + Absent + route-specific parent option */}
                    {!boarded && !absent && !isPP && !isPD && (
                      <>
                        <button onClick={() => markStatus(o, "boarded")} disabled={!!isBusy}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", border: "none", background: "#6366F1", color: "white", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin /> : "✅"} Boarded
                        </button>
                        <button onClick={() => markStatus(o, "absent")} disabled={!!isBusy}
                          style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #DC2626", background: "white", color: "#DC2626", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          ✗ Absent
                        </button>
                        {routeId === "route_morning" ? (
                          <button onClick={() => markStatus(o, "pd")} disabled={!!isBusy}
                            style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #E8694A", background: "white", color: "#E8694A", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            🚗 PD
                          </button>
                        ) : (
                          <button onClick={() => markStatus(o, "pp")} disabled={!!isBusy}
                            style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #E8694A", background: "white", color: "#E8694A", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            🚗 PP
                          </button>
                        )}
                      </>
                    )}

                    {/* Parent Drop (morning) → badge + Undo */}
                    {isPD && (
                      <>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#E8694A", background: "rgba(232,105,74,0.1)", borderRadius: "20px", padding: "6px 12px" }}>🚗 Parent Drop</span>
                        <button onClick={() => unmark(o)} disabled={!!isBusy}
                          style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #EDE8DF", background: "white", color: "#6B7A99", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin white={false} /> : "↩ Undo"}
                        </button>
                      </>
                    )}

                    {/* Parent Pickup (afternoon) → badge + Undo */}
                    {isPP && (
                      <>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#E8694A", background: "rgba(232,105,74,0.1)", borderRadius: "20px", padding: "6px 12px" }}>🚗 Parent Pickup</span>
                        <button onClick={() => unmark(o)} disabled={!!isBusy}
                          style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #EDE8DF", background: "white", color: "#6B7A99", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin white={false} /> : "↩ Undo"}
                        </button>
                      </>
                    )}

                    {/* Boarded (on van) → show Dropped + Undo */}
                    {boarded && !dropped && (
                      <>
                        <button onClick={() => markStatus(o, "dropped")} disabled={!!isBusy}
                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "20px", border: "none", background: "#178F78", color: "white", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin /> : "🏠"} Dropped
                        </button>
                        <button onClick={() => unmark(o)} disabled={!!isBusy}
                          style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #EDE8DF", background: "white", color: "#6B7A99", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin white={false} /> : "↩ Undo"}
                        </button>
                      </>
                    )}

                    {/* Dropped → Done badge + Undo */}
                    {dropped && (
                      <>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#178F78", background: "rgba(23,143,120,0.1)", borderRadius: "20px", padding: "6px 12px" }}>✅ Done</span>
                        <button onClick={() => unmark(o)} disabled={!!isBusy}
                          style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #EDE8DF", background: "white", color: "#6B7A99", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {isBusy ? <Spin white={false} /> : "↩ Undo"}
                        </button>
                      </>
                    )}

                    {/* Absent → Undo only */}
                    {absent && (
                      <button onClick={() => unmark(o)} disabled={!!isBusy}
                        style={{ padding: "6px 10px", borderRadius: "20px", border: "1px solid #EDE8DF", background: "white", color: "#6B7A99", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        {isBusy ? <Spin white={false} /> : "↩ Undo"}
                      </button>
                    )}

                    {/* WhatsApp notify */}
                    {o.parent_phone && (
                      <button onClick={async () => {
                        const r = await fetch("/api/transport/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: o.parent_phone, child_name: o.child_name, status, checkin_time: log?.checkin_time, checkout_time: log?.checkout_time }) });
                        const d = await r.json();
                        if (d.waLink) window.open(d.waLink, "_blank");
                      }} style={{ padding: "6px 10px", borderRadius: "20px", border: "none", background: "#25D366", color: "white", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        💬
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
