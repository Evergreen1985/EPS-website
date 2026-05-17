"use client";
import { useState, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";

type ReportType = "children" | "staff";

const PRESETS = [
  { label: "This Month",  id: "this_month"  },
  { label: "Last Month",  id: "last_month"  },
  { label: "This Year",   id: "this_year"   },
  { label: "Custom",      id: "custom"      },
];

function getPresetDates(preset: string): { from: string; to: string } {
  const now  = new Date();
  const year = now.getFullYear();
  const mon  = now.getMonth();

  if (preset === "this_month") {
    const from = new Date(year, mon, 1).toISOString().split("T")[0];
    const to   = new Date(year, mon + 1, 0).toISOString().split("T")[0];
    return { from, to };
  }
  if (preset === "last_month") {
    const from = new Date(year, mon - 1, 1).toISOString().split("T")[0];
    const to   = new Date(year, mon, 0).toISOString().split("T")[0];
    return { from, to };
  }
  if (preset === "this_year") {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
  return { from: new Date(year, mon, 1).toISOString().split("T")[0], to: new Date().toISOString().split("T")[0] };
}

interface Props {
  theme?: "light" | "dark";
}

export default function AttendanceReport({ theme = "light" }: Props) {
  const dark = theme === "dark";

  const [reportType, setReportType]   = useState<ReportType>("children");
  const [preset, setPreset]           = useState("this_month");
  const [customFrom, setCustomFrom]   = useState(() => getPresetDates("this_month").from);
  const [customTo, setCustomTo]       = useState(() => new Date().toISOString().split("T")[0]);
  const [report, setReport]           = useState<any[]>([]);
  const [meta, setMeta]               = useState<{ from: string; to: string } | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  // ── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background:   dark ? "rgba(255,255,255,0.05)" : "white",
    border:       dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #EDE8DF",
    borderRadius: "16px",
    padding:      "20px",
    color:        dark ? "white" : "#1A2F4A",
  };

  const inp: React.CSSProperties = {
    border:       dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #EDE8DF",
    borderRadius: "10px",
    padding:      "8px 12px",
    fontSize:     "13px",
    background:   dark ? "rgba(255,255,255,0.07)" : "#FAF0E8",
    color:        dark ? "white" : "#1A2F4A",
    outline:      "none",
    fontFamily:   "'Quicksand',sans-serif",
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding:      "7px 16px",
    borderRadius: "20px",
    border:       "none",
    cursor:       "pointer",
    fontSize:     "12px",
    fontWeight:   700,
    fontFamily:   "'Quicksand',sans-serif",
    background:   active
      ? (dark ? "linear-gradient(135deg,#1E4D8C,#2E6BB5)" : "#178F78")
      : (dark ? "rgba(255,255,255,0.07)" : "#EDE8DF"),
    color:        active ? "white" : (dark ? "rgba(255,255,255,0.55)" : "#6B7A99"),
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    const dates = preset === "custom" ? { from: customFrom, to: customTo } : getPresetDates(preset);
    try {
      const r = await fetch(`/api/owner/attendance-report?type=${reportType}&from=${dates.from}&to=${dates.to}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Failed"); setLoading(false); return; }
      setReport(d.report || []);
      setMeta({ from: dates.from, to: dates.to });
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }, [reportType, preset, customFrom, customTo]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!report.length) return;
    let rows: string[][] = [];

    if (reportType === "children") {
      rows = [
        ["Child Name", "Section", "Programme", "Present", "Late", "Absent", "Total Marked", "Attendance %"],
        ...report.map(r => [r.child_name, r.section_name, r.program, r.present, r.late, r.absent, r.total_marked, `${r.rate}%`]),
      ];
    } else {
      rows = [
        ["Staff Name", "Role", "Present", "Absent", "Leave", "Half Day", "Total Marked", "Avg Clock-In"],
        ...report.map(r => [r.staff_name, r.role, r.present, r.absent, r.leave, r.half_day, r.total_marked, r.avg_clock_in]),
      ];
    }

    const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `attendance_${reportType}_${meta?.from}_${meta?.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Summary totals ────────────────────────────────────────────────────────
  const totals = report.reduce(
    (acc, r) => ({
      present:  acc.present  + (r.present  || 0),
      absent:   acc.absent   + (r.absent   || 0),
      late:     acc.late     + (r.late     || 0),
      leave:    acc.leave    + (r.leave    || 0),
      half_day: acc.half_day + (r.half_day || 0),
    }),
    { present: 0, absent: 0, late: 0, leave: 0, half_day: 0 }
  );

  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  const rateColor = (r: number) => r >= 90 ? "#178F78" : r >= 75 ? "#F5B829" : "#E8694A";

  return (
    <div>
      {/* Controls */}
      <div style={{ ...card, marginBottom: "16px" }}>
        {/* Report type toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {(["children", "staff"] as ReportType[]).map(t => (
            <button key={t} onClick={() => { setReportType(t); setReport([]); setMeta(null); }} style={pill(reportType === t)}>
              {t === "children" ? "👶 Children" : "👩‍🏫 Staff"}
            </button>
          ))}
        </div>

        {/* Preset buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)} style={pill(preset === p.id)}>{p.label}</button>
          ))}
        </div>

        {/* Custom date range */}
        {preset === "custom" && (
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <label style={{ fontSize: "11px", color: dark ? "rgba(255,255,255,0.5)" : "#6B7A99", display: "block", marginBottom: "4px" }}>From</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: dark ? "rgba(255,255,255,0.5)" : "#6B7A99", display: "block", marginBottom: "4px" }}>To</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inp} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchReport} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 20px", borderRadius: "12px", border: "none", background: dark ? "linear-gradient(135deg,#1E4D8C,#2E6BB5)" : "#178F78", color: "white", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Quicksand',sans-serif" }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : undefined }} />
            {loading ? "Loading…" : "Generate Report"}
          </button>
          {report.length > 0 && (
            <button onClick={exportCSV}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #EDE8DF", background: "transparent", color: dark ? "rgba(255,255,255,0.7)" : "#6B7A99", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "'Quicksand',sans-serif" }}>
              <Download size={14} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(232,105,74,0.1)", border: "1px solid rgba(232,105,74,0.3)", borderRadius: "12px", padding: "12px 16px", color: "#E8694A", fontSize: "13px", marginBottom: "16px" }}>{error}</div>
      )}

      {/* Results */}
      {report.length > 0 && meta && (
        <>
          {/* Period label */}
          <div style={{ fontSize: "12px", color: dark ? "rgba(255,255,255,0.45)" : "#6B7A99", marginBottom: "14px" }}>
            Report period: <strong style={{ color: dark ? "rgba(255,255,255,0.8)" : "#1A2F4A" }}>{fmtDate(meta.from)} — {fmtDate(meta.to)}</strong>
            <span style={{ marginLeft: "12px" }}>{report.length} {reportType === "children" ? "students" : "staff members"}</span>
          </div>

          {/* Summary cards */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {reportType === "children" ? (
              <>
                {[
                  { label: "Present Days",  value: totals.present, color: "#178F78" },
                  { label: "Late Days",     value: totals.late,    color: "#F5B829" },
                  { label: "Absent Days",   value: totals.absent,  color: "#E8694A" },
                ].map(s => (
                  <div key={s.label} style={{ background: `${s.color}18`, border: `1px solid ${s.color}33`, borderRadius: "12px", padding: "12px 18px", minWidth: "120px" }}>
                    <div style={{ fontSize: "11px", color: dark ? "rgba(255,255,255,0.5)" : "#6B7A99" }}>{s.label}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: "Present",  value: totals.present,  color: "#178F78" },
                  { label: "Absent",   value: totals.absent,   color: "#E8694A" },
                  { label: "Leave",    value: totals.leave,    color: "#9B59B6" },
                  { label: "Half Day", value: totals.half_day, color: "#F5B829" },
                ].map(s => (
                  <div key={s.label} style={{ background: `${s.color}18`, border: `1px solid ${s.color}33`, borderRadius: "12px", padding: "12px 18px", minWidth: "100px" }}>
                    <div style={{ fontSize: "11px", color: dark ? "rgba(255,255,255,0.5)" : "#6B7A99" }}>{s.label}</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              {reportType === "children" ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: dark ? "rgba(255,255,255,0.06)" : "#FAF0E8" }}>
                      {["Child Name", "Section", "Programme", "Present", "Late", "Absent", "Marked Days", "Attendance %"].map(h => (
                        <th key={h} style={{ textAlign: h.includes("%") || ["Present","Late","Absent","Marked Days"].includes(h) ? "center" : "left", padding: "10px 14px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: dark ? "rgba(255,255,255,0.45)" : "#6B7A99", fontWeight: 700, borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #EDE8DF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #EDE8DF", background: i % 2 === 0 ? "transparent" : (dark ? "rgba(255,255,255,0.02)" : "#FAFAFA") }}>
                        <td style={{ padding: "11px 14px", fontWeight: 600 }}>{r.child_name}</td>
                        <td style={{ padding: "11px 14px", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99" }}>{r.section_name}</td>
                        <td style={{ padding: "11px 14px", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99" }}>{r.program}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#178F78", fontWeight: 700 }}>{r.present}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#F5B829", fontWeight: 700 }}>{r.late}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#E8694A", fontWeight: 700 }}>{r.absent}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99" }}>{r.total_marked}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          {r.total_marked === 0 ? (
                            <span style={{ color: dark ? "rgba(255,255,255,0.3)" : "#ccc", fontSize: "12px" }}>No data</span>
                          ) : (
                            <span style={{ background: `${rateColor(r.rate)}22`, color: rateColor(r.rate), borderRadius: "20px", padding: "3px 12px", fontWeight: 800, fontSize: "13px" }}>
                              {r.rate}%
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: dark ? "rgba(255,255,255,0.06)" : "#FAF0E8" }}>
                      {["Staff Name", "Role", "Present", "Absent", "Leave Days", "Half Day", "Total Marked", "Avg Clock-In"].map(h => (
                        <th key={h} style={{ textAlign: ["Present","Absent","Leave Days","Half Day","Total Marked"].includes(h) ? "center" : "left", padding: "10px 14px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: dark ? "rgba(255,255,255,0.45)" : "#6B7A99", fontWeight: 700, borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #EDE8DF" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r, i) => (
                      <tr key={r.id} style={{ borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #EDE8DF", background: i % 2 === 0 ? "transparent" : (dark ? "rgba(255,255,255,0.02)" : "#FAFAFA") }}>
                        <td style={{ padding: "11px 14px", fontWeight: 600 }}>{r.staff_name}</td>
                        <td style={{ padding: "11px 14px", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99" }}>{r.role}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#178F78", fontWeight: 700 }}>{r.present}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#E8694A", fontWeight: 700 }}>{r.absent}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center" }}>
                          <span style={{ background: r.leave > 5 ? "rgba(155,89,182,0.2)" : "rgba(155,89,182,0.1)", color: "#9B59B6", borderRadius: "20px", padding: "3px 12px", fontWeight: 800 }}>
                            {r.leave}
                          </span>
                        </td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: "#F5B829", fontWeight: 700 }}>{r.half_day}</td>
                        <td style={{ padding: "11px 14px", textAlign: "center", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99" }}>{r.total_marked}</td>
                        <td style={{ padding: "11px 14px", color: dark ? "rgba(255,255,255,0.55)" : "#6B7A99", fontSize: "12px" }}>{r.avg_clock_in}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && report.length === 0 && meta && (
        <div style={{ textAlign: "center", padding: "48px", color: dark ? "rgba(255,255,255,0.3)" : "#6B7A99" }}>
          No attendance data found for this period
        </div>
      )}
    </div>
  );
}
