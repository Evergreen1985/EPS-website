"use client";
import { useState, useEffect, useCallback } from "react";

function todayIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

interface TrailPoint {
  id: number;
  route_id: string;
  latitude: number;
  longitude: number;
  shared_by: string;
  recorded_at: string;
}

interface RideLog {
  id: string;
  child_name: string;
  status: string;
  checkin_time: string | null;
  checkout_time: string | null;
  checked_by: string;
  boarded_by: string | null;
  dropped_by: string | null;
  date: string;
}

const STATUS_COLOR: Record<string, string> = {
  boarded: "#6366F1", dropped: "#178F78", absent: "#DC2626", waiting: "#F5B829",
};

export default function TransportReport() {
  const [date, setDate]         = useState(todayIST());
  const [routeId, setRouteId]   = useState("route_morning");
  const [trail, setTrail]       = useState<TrailPoint[]>([]);
  const [rideLogs, setRideLogs] = useState<RideLog[]>([]);
  const [loading, setLoading]   = useState(false);
  const [section, setSection]   = useState<"trail" | "rides">("trail");
  const [cleaning, setCleaning] = useState(false);
  const [cleanMsg, setCleanMsg] = useState("");
  // Auto-cleanup pause toggle
  const [paused,    setPaused]    = useState(false);
  const [toggling,  setToggling]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/transport/report?date=${date}&route_id=${routeId}`);
      const d = await r.json();
      setTrail(d.trail || []);
      setRideLogs(d.ride_logs || []);
    } catch { /* network error */ }
    setLoading(false);
  }, [date, routeId]);

  useEffect(() => { load(); }, [load]);

  // Load the auto-cleanup pause state once on mount
  useEffect(() => {
    fetch("/api/transport/cleanup-settings")
      .then(r => r.json())
      .then(d => setPaused(d.paused === true))
      .catch(() => {});
  }, []);

  const togglePause = async () => {
    setToggling(true);
    try {
      const next = !paused;
      const r = await fetch("/api/transport/cleanup-settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: next }),
      });
      if (r.ok) setPaused(next);
    } catch { /* network error */ }
    setToggling(false);
  };

  const runCleanup = async () => {
    setCleaning(true);
    setCleanMsg("");
    try {
      const r = await fetch("/api/transport/cleanup", { method: "POST" });
      if (r.ok) {
        setCleanMsg("Cleanup complete — location history older than 7 days and ride logs older than 30 days have been removed.");
      } else {
        const d = await r.json();
        setCleanMsg(`Error: ${d.error || "cleanup failed"}`);
      }
    } catch {
      setCleanMsg("Network error — please try again.");
    }
    setCleaning(false);
  };

  const sharers  = [...new Set(trail.map(t => t.shared_by).filter(Boolean))];
  const boarded  = rideLogs.filter(r => r.status === "boarded" || r.status === "dropped").length;
  const dropped  = rideLogs.filter(r => r.status === "dropped").length;

  return (
    <div style={{ fontFamily: "'Quicksand',sans-serif" }}>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "6px 12px", fontSize: "13px", fontFamily: "'Quicksand',sans-serif", color: "#1A2F4A", background: "white" }} />
        <select value={routeId} onChange={e => setRouteId(e.target.value)}
          style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "6px 10px", fontSize: "12px", fontFamily: "'Quicksand',sans-serif", background: "white", color: "#1A2F4A" }}>
          <option value="route_morning">Morning Route</option>
          <option value="route_afternoon">Afternoon Route</option>
        </select>
        <button onClick={load} style={{ padding: "6px 14px", borderRadius: "10px", border: "1px solid #EDE8DF", background: "white", fontSize: "12px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "GPS Points",  value: trail.length,    color: "#6366F1" },
          { label: "Shared By",   value: sharers.length,  color: "#178F78" },
          { label: "Boarded",     value: boarded,          color: "#6366F1" },
          { label: "Dropped",     value: dropped,          color: "#178F78" },
        ].map(s => (
          <div key={s.label} style={{ background: "white", borderRadius: "12px", border: "1px solid #EDE8DF", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "#6B7A99", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Section toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
        {([
          { key: "trail", label: "📍 Location Trail" },
          { key: "rides", label: "📋 Ride Log" },
        ] as const).map(v => (
          <button key={v.key} onClick={() => setSection(v.key)}
            style={{ padding: "7px 20px", borderRadius: "20px", border: "none", background: section === v.key ? "#1A2F4A" : "#EDE8DF", color: section === v.key ? "white" : "#6B7A99", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>
            {v.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>
          <div style={{ width: "28px", height: "28px", border: "3px solid #EDE8DF", borderTopColor: "#178F78", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
          Loading…
        </div>
      ) : section === "trail" ? (
        trail.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📍</div>
            No location data recorded for {date} on this route.<br />
            <span style={{ fontSize: "11px" }}>Location history is logged every 15 s while a staff member is sharing GPS.</span>
          </div>
        ) : (
          <>
            {/* Sharer badges */}
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #EDE8DF", padding: "10px 14px", marginBottom: "10px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99" }}>Staff who shared:</span>
              {sharers.map(s => (
                <span key={s} style={{ fontSize: "11px", fontWeight: 700, background: "rgba(99,102,241,0.1)", color: "#6366F1", borderRadius: "20px", padding: "2px 10px" }}>📡 {s}</span>
              ))}
              <span style={{ marginLeft: "auto", fontSize: "11px", color: "#9CA3AF" }}>{trail.length} GPS points recorded</span>
            </div>

            {/* Trail table */}
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
              <div style={{ overflowX: "auto", maxHeight: "480px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                    <tr style={{ background: "#FAF0E8" }}>
                      {["#", "Time", "Shared By", "Latitude", "Longitude", ""].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#6B7A99", fontSize: "10px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trail.map((p, i) => (
                      <tr key={p.id} style={{ borderTop: "1px solid #EDE8DF", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                        <td style={{ padding: "7px 12px", color: "#9CA3AF", fontSize: "10px" }}>{i + 1}</td>
                        <td style={{ padding: "7px 12px", fontWeight: 700, color: "#1A2F4A", whiteSpace: "nowrap" }}>
                          {new Date(p.recorded_at).toLocaleTimeString("en-IN")}
                        </td>
                        <td style={{ padding: "7px 12px", color: "#6366F1", fontWeight: 700 }}>{p.shared_by || "—"}</td>
                        <td style={{ padding: "7px 12px", color: "#6B7A99", fontFamily: "monospace", fontSize: "11px" }}>{p.latitude.toFixed(6)}</td>
                        <td style={{ padding: "7px 12px", color: "#6B7A99", fontFamily: "monospace", fontSize: "11px" }}>{p.longitude.toFixed(6)}</td>
                        <td style={{ padding: "7px 12px" }}>
                          <a href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: "10px", color: "#178F78", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                            Maps ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        rideLogs.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "40px", textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
            No ride logs for {date}.
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#FAF0E8" }}>
                    {["Child", "Status", "Boarded At", "Boarded By", "Dropped At", "Dropped By"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#6B7A99", fontSize: "10px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rideLogs.map((r, i) => (
                    <tr key={r.id || i} style={{ borderTop: "1px solid #EDE8DF", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 700, color: "#1A2F4A" }}>{r.child_name}</td>
                      <td style={{ padding: "9px 12px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, background: `${STATUS_COLOR[r.status] || "#9CA3AF"}18`, color: STATUS_COLOR[r.status] || "#9CA3AF", borderRadius: "20px", padding: "2px 8px", textTransform: "capitalize" }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", color: "#6B7A99", whiteSpace: "nowrap" }}>{r.checkin_time  || "—"}</td>
                      <td style={{ padding: "9px 12px", color: "#6366F1", fontWeight: 700 }}>{r.boarded_by || r.checked_by || "—"}</td>
                      <td style={{ padding: "9px 12px", color: "#6B7A99", whiteSpace: "nowrap" }}>{r.checkout_time || "—"}</td>
                      <td style={{ padding: "9px 12px", color: "#178F78", fontWeight: 700 }}>{r.dropped_by  || (r.status === "dropped" ? r.checked_by : "—") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Cleanup panel */}
      <div style={{ marginTop: "24px", background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "18px" }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "14px", fontWeight: 700, color: "#DC2626", marginBottom: "14px" }}>🗑️ Data Cleanup</div>

        {/* Sunday auto-cleanup toggle */}
        <div style={{ background: paused ? "rgba(245,184,41,0.06)" : "rgba(23,143,120,0.06)", border: `1px solid ${paused ? "#F5B82940" : "#178F7840"}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A2F4A" }}>🗓️ Sunday Auto-Cleanup</span>
              <span style={{ fontSize: "10px", fontWeight: 700, borderRadius: "20px", padding: "2px 8px",
                background: paused ? "rgba(245,184,41,0.15)" : "rgba(23,143,120,0.12)",
                color: paused ? "#B8860B" : "#178F78" }}>
                {paused ? "⏸ Paused" : "✓ Active"}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#6B7A99" }}>
              {paused
                ? "Auto-cleanup is paused — the scheduled Sunday job will be skipped until you resume it."
                : "Runs every Sunday: deletes location history > 7 days and ride logs > 30 days."}
            </div>
          </div>
          <button onClick={togglePause} disabled={toggling}
            style={{ padding: "8px 18px", borderRadius: "10px", border: `1px solid ${paused ? "#178F78" : "#F5B829"}`, background: "white", fontWeight: 700, fontSize: "12px", cursor: toggling ? "default" : "pointer", color: paused ? "#178F78" : "#B8860B", whiteSpace: "nowrap" as const }}>
            {toggling ? "Saving…" : paused ? "▶ Resume Auto-Cleanup" : "⏸ Pause Auto-Cleanup"}
          </button>
        </div>

        {/* Manual cleanup (always runs, ignores pause flag) */}
        <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "10px" }}>
          <b>Manual cleanup</b> always runs immediately — it ignores the pause toggle above.
          Removes location history &gt; <b>7 days</b> and ride logs &gt; <b>30 days</b>.
        </div>
        {cleanMsg && (
          <div style={{ fontSize: "12px", fontWeight: 700, color: cleanMsg.startsWith("Error") || cleanMsg.startsWith("Network") ? "#DC2626" : "#178F78", marginBottom: "10px" }}>{cleanMsg}</div>
        )}
        <button onClick={runCleanup} disabled={cleaning}
          style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: cleaning ? "#9CA3AF" : "#DC2626", color: "white", fontWeight: 700, fontSize: "12px", cursor: cleaning ? "default" : "pointer" }}>
          {cleaning ? "Running…" : "🗑️ Run Cleanup Now"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
