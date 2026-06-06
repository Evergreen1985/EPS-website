"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

type Log = {
  id: string; area: string; feature: string; scenario: string;
  status: "pass" | "fail" | "fixed" | "wip"; severity?: string | null;
  notes?: string | null; fix_note?: string | null; tested_by?: string | null;
  created_at: string; fixed_at?: string | null; updated_at?: string | null;
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  pass:  { bg: "#DCFCE7", fg: "#166534", label: "✓ Pass" },
  fail:  { bg: "#FEE2E2", fg: "#991B1B", label: "✗ Fail (open)" },
  fixed: { bg: "#DBEAFE", fg: "#1E40AF", label: "🛠 Fixed" },
  wip:   { bg: "#FEF9C3", fg: "#854D0E", label: "… In progress" },
};
const SEV_FG: Record<string, string> = { critical: "#991B1B", high: "#B91C1C", medium: "#B45309", low: "#6B7280" };

export default function QaDashboard() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [err, setErr] = useState("");
  const [areaF, setAreaF] = useState("all");
  const [statusF, setStatusF] = useState("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/owner/test-logs", { cache: "no-store" });
    if (res.status === 401) { router.replace("/owner-login"); return; }
    if (!res.ok) { setErr("Failed to load logs"); return; }
    const d = await res.json();
    setLogs(d.logs || []);
  }, [router]);

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const counts = useMemo(() => {
    const c = { total: 0, pass: 0, fail: 0, fixed: 0, wip: 0 };
    (logs || []).forEach(l => { c.total++; (c as any)[l.status]++; });
    return c;
  }, [logs]);

  const areas = useMemo(() => Array.from(new Set((logs || []).map(l => l.area))).sort(), [logs]);
  const filtered = useMemo(() => (logs || []).filter(l =>
    (areaF === "all" || l.area === areaF) && (statusF === "all" || l.status === statusF)
  ), [logs, areaF, statusF]);

  const rowsForExport = () => filtered.map(l => ({
    Area: l.area, Feature: l.feature, Scenario: l.scenario, Status: l.status,
    Severity: l.severity || "", Notes: l.notes || "", "Fix / Resolution": l.fix_note || "",
    "Tested By": l.tested_by || "", "Tested At": fmt(l.created_at), "Fixed At": l.fixed_at ? fmt(l.fixed_at) : "",
  }));

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rowsForExport());
    ws["!cols"] = [{ wch: 12 }, { wch: 16 }, { wch: 46 }, { wch: 10 }, { wch: 10 }, { wch: 44 }, { wch: 40 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QA Test Log");
    XLSX.writeFile(wb, `qa_test_log_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const downloadCsv = () => {
    const ws = XLSX.utils.json_to_sheet(rowsForExport());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `qa_test_log_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };
  const clearAll = async () => {
    if (!confirm("Delete ALL test logs? This cannot be undone.")) return;
    const res = await fetch("/api/owner/test-logs", { method: "DELETE" });
    if (res.ok) load(); else alert("Could not clear logs.");
  };

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <div style={s.head}>
          <div>
            <h1 style={s.h1}>QA Test Log</h1>
            <p style={s.sub}>End-to-end feature testing — live status for founder review</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={downloadCsv} style={s.btnLight}>⬇ CSV</button>
            <button onClick={downloadExcel} style={s.btnLight}>⬇ Excel</button>
            <button onClick={clearAll} style={s.btnDanger}>🗑 Clear all</button>
          </div>
        </div>

        {/* Summary */}
        <div style={s.cards}>
          <Card n={counts.total} label="Total" color="#334155" />
          <Card n={counts.pass} label="Passed" color="#166534" />
          <Card n={counts.fail} label="Open issues" color="#991B1B" />
          <Card n={counts.fixed} label="Fixed" color="#1E40AF" />
          <Card n={counts.wip} label="In progress" color="#854D0E" />
        </div>

        {/* Filters */}
        <div style={s.filters}>
          <select value={areaF} onChange={e => setAreaF(e.target.value)} style={s.select}>
            <option value="all">All areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={s.select}>
            <option value="all">All statuses</option>
            <option value="fail">Open issues</option>
            <option value="fixed">Fixed</option>
            <option value="pass">Passed</option>
            <option value="wip">In progress</option>
          </select>
          <span style={{ fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>auto-refreshes every 20s</span>
        </div>

        {err && <div style={s.err}>{err}</div>}
        {logs === null ? (
          <div style={s.empty}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>No test entries yet.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Area", "Feature", "Scenario", "Status", "Sev", "Notes", "Fix / Resolution", "Tested", "When"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const st = STATUS_STYLE[l.status] || STATUS_STYLE.fail;
                  return (
                    <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={s.td}>{l.area}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{l.feature}</td>
                      <td style={{ ...s.td, maxWidth: 360 }}>{l.scenario}</td>
                      <td style={s.td}><span style={{ ...s.badge, background: st.bg, color: st.fg }}>{st.label}</span></td>
                      <td style={{ ...s.td, color: SEV_FG[l.severity || ""] || "#94a3b8", fontWeight: 600 }}>{l.severity || "—"}</td>
                      <td style={{ ...s.td, maxWidth: 320, color: "#475569" }}>{l.notes || "—"}</td>
                      <td style={{ ...s.td, maxWidth: 300, color: "#1E40AF" }}>{l.fix_note || "—"}</td>
                      <td style={{ ...s.td, color: "#64748b" }}>{l.tested_by || "—"}</td>
                      <td style={{ ...s.td, color: "#94a3b8", whiteSpace: "nowrap" }}>{fmt(l.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ n, label, color }: { n: number; label: string; color: string }) {
  return (
    <div style={s.card}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
    </div>
  );
}

function fmt(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100dvh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#1e293b", padding: "24px 16px" },
  wrap: { maxWidth: 1180, margin: "0 auto" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 18 },
  h1: { fontSize: 24, fontWeight: 800, margin: 0 },
  sub: { fontSize: 13, color: "#64748b", margin: "4px 0 0" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 16 },
  card: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", textAlign: "center" },
  filters: { display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  select: { padding: "8px 12px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 13, background: "#fff" },
  tableWrap: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap", position: "sticky", top: 0 },
  td: { padding: "10px 12px", verticalAlign: "top", lineHeight: 1.5 },
  badge: { display: "inline-block", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" },
  btnLight: { background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  btnDanger: { background: "#fee2e2", border: "1px solid #fecaca", color: "#991B1B", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  empty: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 40, textAlign: "center", color: "#94a3b8" },
  err: { background: "#fee2e2", color: "#991B1B", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13 },
};
