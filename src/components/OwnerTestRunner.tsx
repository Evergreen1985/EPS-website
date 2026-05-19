"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type TestStatus = "pass" | "fail" | "error" | "skip" | "pending" | "running";

interface TestCase {
  tcId: string;
  module: string;
  subModule: string;
  title: string;
  run: () => Promise<{ ok: boolean; message: string }>;
}

interface TestResult {
  tcId: string;
  module: string;
  subModule: string;
  title: string;
  status: TestStatus;
  message: string;
  durationMs: number;
}

interface RunSummary {
  id: string;
  started_at: string;
  completed_at: string | null;
  total: number;
  passed: number;
  failed: number;
  errors: number;
  skipped: number;
  status: string;
  triggered_by: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);

async function apiTest(
  url: string,
  options: RequestInit,
  expect: { status?: number; bodyCheck?: (b: any) => string | null }
): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(url, options);
    if (expect.status && res.status !== expect.status) {
      return { ok: false, message: `Expected HTTP ${expect.status}, got ${res.status}` };
    }
    if (expect.bodyCheck) {
      const body = await res.json().catch(() => null);
      const err = expect.bodyCheck(body);
      if (err) return { ok: false, message: err };
    }
    return { ok: true, message: `HTTP ${res.status} OK` };
  } catch (e: any) {
    return { ok: false, message: `Network error: ${e?.message}` };
  }
}

// ─── Test Suite ──────────────────────────────────────────────────────────────
function buildTestSuite(): TestCase[] {
  const suite: TestCase[] = [];

  // ── Config / Auth ──────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT001", module: "Config", subModule: "API", title: "GET /api/config returns 200",
    run: () => apiTest("/api/config", {}, { status: 200 }),
  });
  suite.push({
    tcId: "AT002", module: "Config", subModule: "API", title: "Config response has no secret keys",
    run: async () => {
      const res = await fetch("/api/config");
      const body = await res.json().catch(() => ({}));
      const dangerous = ["service_role", "SERVICE_ROLE", "secret", "ANON_KEY"];
      const found = dangerous.find(k => JSON.stringify(body).toLowerCase().includes(k.toLowerCase()));
      return found
        ? { ok: false, message: `Found sensitive key in response: ${found}` }
        : { ok: true, message: "No sensitive keys exposed" };
    },
  });

  // ── Transport Ride Logs ────────────────────────────────────────────────────
  suite.push({
    tcId: "AT010", module: "Transport", subModule: "Ride Logs", title: "GET /api/transport/ride-logs returns 200",
    run: () => apiTest(`/api/transport/ride-logs?date=${today()}`, {},
      { status: 200, bodyCheck: b => Array.isArray(b?.ride_logs) ? null : "ride_logs not an array" }),
  });
  suite.push({
    tcId: "AT011", module: "Transport", subModule: "Ride Logs", title: "Ride logs with route_id=route_morning returns 200",
    run: () => apiTest(`/api/transport/ride-logs?date=${today()}&route_id=route_morning`, {},
      { status: 200, bodyCheck: b => Array.isArray(b?.ride_logs) ? null : "ride_logs not an array" }),
  });
  suite.push({
    tcId: "AT012", module: "Transport", subModule: "Ride Logs", title: "Ride logs with route_id=route_afternoon returns 200",
    run: () => apiTest(`/api/transport/ride-logs?date=${today()}&route_id=route_afternoon`, {},
      { status: 200, bodyCheck: b => Array.isArray(b?.ride_logs) ? null : "ride_logs not an array" }),
  });
  suite.push({
    tcId: "AT013", module: "Transport", subModule: "Ride Logs", title: "POST ride-logs — missing child_id returns 400",
    run: () => apiTest("/api/transport/ride-logs",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ child_name: "Test", date: today(), checked_by: "test" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT014", module: "Transport", subModule: "Ride Logs", title: "POST ride-logs — missing child_name returns 400",
    run: () => apiTest("/api/transport/ride-logs",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ child_id: "00000000-0000-0000-0000-000000000000", date: today(), checked_by: "test" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT015", module: "Transport", subModule: "Ride Logs", title: "POST ride-logs — missing checked_by returns 400",
    run: () => apiTest("/api/transport/ride-logs",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ child_id: "00000000-0000-0000-0000-000000000000", child_name: "Test", date: today() }) },
      { status: 400 }),
  });

  // ── Attendance ─────────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT020", module: "Attendance", subModule: "API", title: "GET attendance without sectionId returns 400",
    run: () => apiTest("/api/teacher/attendance", {}, { status: 400 }),
  });
  suite.push({
    tcId: "AT021", module: "Attendance", subModule: "API", title: "GET attendance with invalid date format returns 400",
    run: () => apiTest("/api/teacher/attendance?sectionId=test&from=notadate", {}, { status: 400 }),
  });
  suite.push({
    tcId: "AT022", module: "Attendance", subModule: "API", title: "POST attendance — missing studentId returns 400",
    run: () => apiTest("/api/teacher/attendance",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today(), status: "present" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT023", module: "Attendance", subModule: "API", title: "POST attendance — missing date returns 400",
    run: () => apiTest("/api/teacher/attendance",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: "test", status: "present" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT024", module: "Attendance", subModule: "API", title: "POST attendance — invalid status returns 400",
    run: () => apiTest("/api/teacher/attendance",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: "test", date: today(), status: "invalid_status" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT025", module: "Attendance", subModule: "API", title: "POST attendance — invalid date format returns 400",
    run: () => apiTest("/api/teacher/attendance",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: "test", date: "baddate", status: "present" }) },
      { status: 400 }),
  });

  // ── Feature Flags ──────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT030", module: "System", subModule: "Feature Flags", title: "GET feature flag without key returns 400",
    run: () => apiTest("/api/owner/feature-flags", {}, { status: 400 }),
  });
  suite.push({
    tcId: "AT031", module: "System", subModule: "Feature Flags", title: "GET test_runner feature flag returns boolean",
    run: () => apiTest("/api/owner/feature-flags?key=test_runner", {},
      { status: 200, bodyCheck: b => typeof b?.enabled === "boolean" ? null : "enabled field missing or not boolean" }),
  });

  // ── Test Results API ────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT040", module: "System", subModule: "Test Results", title: "GET test-results returns runs array",
    run: () => apiTest("/api/owner/test-results", {},
      { status: 200, bodyCheck: b => Array.isArray(b?.runs) ? null : "runs field missing or not array" }),
  });

  // ── Enquiries ───────────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT050", module: "Enquiry", subModule: "API", title: "GET /api/enquiry returns 200 or 405",
    run: async () => {
      const res = await fetch("/api/enquiry");
      return res.status === 200 || res.status === 405 || res.status === 401
        ? { ok: true, message: `HTTP ${res.status}` }
        : { ok: false, message: `Unexpected status ${res.status}` };
    },
  });

  // ── Fees ───────────────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT060", module: "Fees", subModule: "API", title: "GET /api/fees/reports accessible",
    run: async () => {
      const res = await fetch("/api/fees/reports");
      return res.status < 500
        ? { ok: true, message: `HTTP ${res.status}` }
        : { ok: false, message: `Server error: ${res.status}` };
    },
  });

  // ── Sections ───────────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT070", module: "Sections", subModule: "API", title: "GET /api/admin/sections accessible",
    run: async () => {
      const res = await fetch("/api/admin/sections");
      return res.status < 500
        ? { ok: true, message: `HTTP ${res.status}` }
        : { ok: false, message: `Server error: ${res.status}` };
    },
  });

  // ── Security Checks ────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT080", module: "Security", subModule: "Headers", title: "Response does not expose server version",
    run: async () => {
      const res = await fetch("/api/config");
      const server = res.headers.get("server") || "";
      return server.toLowerCase().includes("next") || server === ""
        ? { ok: true, message: "Server header OK" }
        : { ok: false, message: `Server header exposes: ${server}` };
    },
  });
  suite.push({
    tcId: "AT081", module: "Security", subModule: "XSS", title: "XSS in attendance studentId — returns 400 or safe response",
    run: () => apiTest("/api/teacher/attendance",
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: "<script>alert(1)</script>", date: today(), status: "present" }) },
      { status: 400 }),
  });
  suite.push({
    tcId: "AT082", module: "Security", subModule: "Injection", title: "SQL injection in attendance studentId — safe response",
    run: async () => {
      const res = await fetch("/api/teacher/attendance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "'; DROP TABLE attendance; --", date: today(), status: "present" }),
      });
      // Should fail with 400 (invalid UUID) or 500, but NOT succeed and corrupt DB
      const body = await res.json().catch(() => ({}));
      if (res.status === 200 && !body.error) {
        return { ok: false, message: "SQL injection was not blocked — check DB" };
      }
      return { ok: true, message: `Blocked: HTTP ${res.status}` };
    },
  });

  // ── Response Time ──────────────────────────────────────────────────────────
  suite.push({
    tcId: "AT090", module: "Performance", subModule: "Response Time", title: "Config API responds in < 3 seconds",
    run: async () => {
      const start = Date.now();
      await fetch("/api/config");
      const ms = Date.now() - start;
      return ms < 3000
        ? { ok: true, message: `${ms}ms` }
        : { ok: false, message: `Too slow: ${ms}ms (limit 3000ms)` };
    },
  });
  suite.push({
    tcId: "AT091", module: "Performance", subModule: "Response Time", title: "Ride logs API responds in < 3 seconds",
    run: async () => {
      const start = Date.now();
      await fetch(`/api/transport/ride-logs?date=${today()}`);
      const ms = Date.now() - start;
      return ms < 3000
        ? { ok: true, message: `${ms}ms` }
        : { ok: false, message: `Too slow: ${ms}ms (limit 3000ms)` };
    },
  });
  suite.push({
    tcId: "AT092", module: "Performance", subModule: "Response Time", title: "Attendance API responds in < 3 seconds",
    run: async () => {
      const start = Date.now();
      await fetch("/api/teacher/attendance?sectionId=test");
      const ms = Date.now() - start;
      return ms < 3000
        ? { ok: true, message: `${ms}ms` }
        : { ok: false, message: `Too slow: ${ms}ms (limit 3000ms)` };
    },
  });

  // ── Database Connectivity ──────────────────────────────────────────────────
  suite.push({
    tcId: "AT100", module: "Database", subModule: "Connectivity", title: "Supabase readable — test_runs table accessible",
    run: () => apiTest("/api/owner/test-results", {},
      { status: 200 }),
  });
  suite.push({
    tcId: "AT101", module: "Database", subModule: "Connectivity", title: "Transport ride_logs table readable",
    run: () => apiTest(`/api/transport/ride-logs?date=${today()}`, {},
      { status: 200, bodyCheck: b => "ride_logs" in b ? null : "ride_logs key missing" }),
  });

  return suite;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px", padding: "20px",
};

const STATUS_COLOR: Record<TestStatus, string> = {
  pass: "#178F78", fail: "#E8694A", error: "#F5B829",
  skip: "#95A5A6", pending: "rgba(255,255,255,0.3)", running: "#4A90D9",
};
const STATUS_LABEL: Record<TestStatus, string> = {
  pass: "✅ PASS", fail: "❌ FAIL", error: "⚠️ ERROR",
  skip: "⏭ SKIP", pending: "⏳", running: "🔄",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OwnerTestRunner() {
  const [pluggedIn, setPluggedIn]   = useState(false);
  const [loadingFlag, setLoadingFlag] = useState(true);

  const [running, setRunning]       = useState(false);
  const [results, setResults]       = useState<TestResult[]>([]);
  const [progress, setProgress]     = useState(0);
  const [currentTest, setCurrentTest] = useState("");

  const [runs, setRuns]             = useState<RunSummary[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<TestResult[]>([]);
  const [view, setView]             = useState<"runner" | "history">("runner");

  const [filterModule, setFilterModule] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [saving, setSaving]         = useState(false);

  // ── Load plug-in flag ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/owner/feature-flags?key=test_runner")
      .then(r => r.json())
      .then(d => setPluggedIn(d.enabled ?? false))
      .catch(() => {})
      .finally(() => setLoadingFlag(false));
  }, []);

  const togglePlugin = async () => {
    const next = !pluggedIn;
    setPluggedIn(next);
    await fetch("/api/owner/feature-flags", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "test_runner", enabled: next }),
    });
  };

  // ── Load past runs ─────────────────────────────────────────────────────────
  const loadRuns = useCallback(async () => {
    const res = await fetch("/api/owner/test-results").catch(() => null);
    if (!res?.ok) return;
    const d = await res.json();
    setRuns(d.runs || []);
  }, []);

  useEffect(() => { if (pluggedIn) loadRuns(); }, [pluggedIn, loadRuns]);

  const loadRunResults = async (runId: string) => {
    setSelectedRun(runId);
    const res = await fetch(`/api/owner/test-results?runId=${runId}`).catch(() => null);
    if (!res?.ok) return;
    const d = await res.json();
    setRunResults(d.results || []);
  };

  const deleteRun = async (runId: string) => {
    await fetch(`/api/owner/test-results?runId=${runId}`, { method: "DELETE" });
    setRuns(r => r.filter(x => x.id !== runId));
    if (selectedRun === runId) { setSelectedRun(null); setRunResults([]); }
  };

  // ── Run tests ─────────────────────────────────────────────────────────────
  const runTests = async (moduleFilter?: string) => {
    setRunning(true);
    setResults([]);
    setProgress(0);
    setView("runner");

    // Create run session in DB
    const runRes = await fetch("/api/owner/run-tests", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggeredBy: "owner" }),
    }).catch(() => null);
    const { runId } = runRes ? await runRes.json() : { runId: null };

    const suite = buildTestSuite().filter(t =>
      !moduleFilter || moduleFilter === "All" || t.module === moduleFilter
    );

    const collected: TestResult[] = [];

    for (let i = 0; i < suite.length; i++) {
      const tc = suite[i];
      setCurrentTest(tc.title);
      setProgress(Math.round((i / suite.length) * 100));

      const start = Date.now();
      let result: TestResult;
      try {
        const { ok, message } = await tc.run();
        result = {
          tcId: tc.tcId, module: tc.module, subModule: tc.subModule,
          title: tc.title, status: ok ? "pass" : "fail",
          message, durationMs: Date.now() - start,
        };
      } catch (e: any) {
        result = {
          tcId: tc.tcId, module: tc.module, subModule: tc.subModule,
          title: tc.title, status: "error",
          message: e?.message || "Unexpected error", durationMs: Date.now() - start,
        };
      }
      collected.push(result);
      setResults([...collected]);
    }

    setProgress(100);
    setCurrentTest("");
    setRunning(false);

    // Save results to DB
    if (runId) {
      setSaving(true);
      await fetch("/api/owner/run-tests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, results: collected, status: "completed" }),
      }).catch(() => {});
      setSaving(false);
      loadRuns();
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const modules = ["All", ...Array.from(new Set(buildTestSuite().map(t => t.module)))];
  const passed  = results.filter(r => r.status === "pass").length;
  const failed  = results.filter(r => r.status === "fail").length;
  const errors  = results.filter(r => r.status === "error").length;

  const filteredResults = results.filter(r =>
    (filterModule === "All" || r.module === filterModule) &&
    (filterStatus === "All" || r.status === filterStatus)
  );

  const historyFiltered = runResults.filter(r =>
    (filterModule === "All" || r.module === filterModule) &&
    (filterStatus === "All" || r.status === filterStatus)
  );

  // ─── Unplug state ─────────────────────────────────────────────────────────
  if (loadingFlag) return <div style={{ color: "rgba(255,255,255,0.4)", padding: "20px" }}>Loading test runner...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header + Plugin toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ color: "white", margin: 0, fontSize: "18px" }}>🔬 Automated Test Runner</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: "4px 0 0", fontSize: "12px" }}>
            Run API & smoke tests against the live system. Results saved per run.
          </p>
        </div>
        <button
          onClick={togglePlugin}
          style={{
            padding: "8px 18px", borderRadius: "10px", cursor: "pointer",
            fontWeight: 700, fontSize: "13px",
            background: pluggedIn ? "#E8694A22" : "#178F7822",
            color: pluggedIn ? "#E8694A" : "#178F78",
            border: `1px solid ${pluggedIn ? "#E8694A55" : "#178F7855"}`,
          }}
        >
          {pluggedIn ? "🔌 Unplug Test Runner" : "🔌 Plug In Test Runner"}
        </button>
      </div>

      {!pluggedIn ? (
        <div style={{ ...card, textAlign: "center", padding: "48px 20px", color: "rgba(255,255,255,0.4)" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔌</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>Test Runner is unplugged</div>
          <div style={{ fontSize: "13px", marginTop: "8px" }}>Click "Plug In Test Runner" above to enable automated testing.</div>
        </div>
      ) : (
        <>
          {/* View toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            {(["runner","history"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "7px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: "13px",
                background: view === v ? "#4A90D9" : "rgba(255,255,255,0.07)",
                color: view === v ? "white" : "rgba(255,255,255,0.6)",
              }}>
                {v === "runner" ? "▶ Test Runner" : "📋 Run History"}
              </button>
            ))}
          </div>

          {view === "runner" && (
            <>
              {/* Controls */}
              <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <button onClick={() => runTests()} disabled={running} style={{
                  padding: "10px 20px", borderRadius: "10px", border: "none", cursor: running ? "not-allowed" : "pointer",
                  background: running ? "rgba(255,255,255,0.1)" : "#178F78", color: "white", fontWeight: 700, fontSize: "13px",
                }}>
                  {running ? `🔄 Running... ${progress}%` : "▶ Run All Tests"}
                </button>
                {modules.filter(m => m !== "All").map(mod => (
                  <button key={mod} onClick={() => runTests(mod)} disabled={running} style={{
                    padding: "8px 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.15)",
                    cursor: running ? "not-allowed" : "pointer", background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.7)", fontSize: "12px",
                  }}>
                    ▶ {mod}
                  </button>
                ))}
                {saving && <span style={{ color: "#F5B829", fontSize: "12px" }}>💾 Saving results...</span>}
              </div>

              {/* Progress bar */}
              {running && (
                <div style={{ ...card, padding: "12px 20px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "8px" }}>
                    {currentTest || "Preparing..."}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#4A90D9", transition: "width 0.3s" }} />
                  </div>
                </div>
              )}

              {/* Summary cards */}
              {results.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: "12px" }}>
                  {[
                    { label: "Total", value: results.length, color: "#4A90D9" },
                    { label: "✅ Passed", value: passed, color: "#178F78" },
                    { label: "❌ Failed", value: failed, color: "#E8694A" },
                    { label: "⚠️ Errors", value: errors, color: "#F5B829" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      background: `${color}15`, border: `1px solid ${color}33`,
                      borderRadius: "12px", padding: "16px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "24px", fontWeight: 800, color }}>{value}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              {results.length > 0 && (
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <select value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{
                    padding: "7px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: "12px",
                  }}>
                    {["All",...Array.from(new Set(results.map(r=>r.module)))].map(m => <option key={m}>{m}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                    padding: "7px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: "12px",
                  }}>
                    {["All","pass","fail","error","skip"].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
                    Showing {filteredResults.length} of {results.length}
                  </span>
                </div>
              )}

              {/* Results table */}
              {filteredResults.length > 0 && (
                <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        {["TC ID","Module","Test Case","Status","Message","Time"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((r, i) => (
                        <tr key={r.tcId} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                          <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{r.tcId}</td>
                          <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.7)" }}>{r.module}</td>
                          <td style={{ padding: "10px 14px", color: "white" }}>{r.title}</td>
                          <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                            <span style={{ background: STATUS_COLOR[r.status] + "22", color: STATUS_COLOR[r.status], padding: "3px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "11px" }}>
                              {STATUS_LABEL[r.status]}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px", color: r.status === "pass" ? "rgba(255,255,255,0.4)" : "#F5B829", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis" }}>{r.message}</td>
                          <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{r.durationMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {view === "history" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
                {/* Run list */}
                <div style={{ ...card, padding: "12px", display: "flex", flexDirection: "column", gap: "8px", maxHeight: "600px", overflowY: "auto" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>Past Runs ({runs.length})</div>
                  {runs.length === 0 && <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>No runs yet</div>}
                  {runs.map(run => (
                    <div key={run.id} onClick={() => loadRunResults(run.id)} style={{
                      padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                      background: selectedRun === run.id ? "rgba(74,144,217,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedRun === run.id ? "#4A90D9" : "rgba(255,255,255,0.08)"}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                          {new Date(run.started_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                        <button onClick={e => { e.stopPropagation(); deleteRun(run.id); }} style={{
                          background: "none", border: "none", color: "#E8694A", cursor: "pointer", fontSize: "12px",
                        }}>🗑</button>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "6px", fontSize: "11px" }}>
                        <span style={{ color: "#178F78" }}>✅ {run.passed}</span>
                        <span style={{ color: "#E8694A" }}>❌ {run.failed}</span>
                        <span style={{ color: "#F5B829" }}>⚠️ {run.errors}</span>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>/ {run.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Run detail */}
                <div>
                  {!selectedRun && (
                    <div style={{ ...card, textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.3)" }}>
                      Select a run from the left to view results
                    </div>
                  )}
                  {selectedRun && (
                    <>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} style={{ padding: "6px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: "12px" }}>
                          {["All",...Array.from(new Set(runResults.map(r=>r.module)))].map(m => <option key={m}>{m}</option>)}
                        </select>
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "6px 10px", borderRadius: "7px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: "12px" }}>
                          {["All","pass","fail","error","skip"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                          <thead>
                            <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                              {["TC ID","Module","Test Case","Status","Message","Time"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {historyFiltered.map((r: any, i: number) => (
                              <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.5)" }}>{r.tc_id}</td>
                                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.7)" }}>{r.module}</td>
                                <td style={{ padding: "10px 14px", color: "white" }}>{r.title}</td>
                                <td style={{ padding: "10px 14px" }}>
                                  <span style={{ background: STATUS_COLOR[r.status as TestStatus] + "22", color: STATUS_COLOR[r.status as TestStatus], padding: "3px 10px", borderRadius: "20px", fontWeight: 700, fontSize: "11px" }}>
                                    {STATUS_LABEL[r.status as TestStatus]}
                                  </span>
                                </td>
                                <td style={{ padding: "10px 14px", color: r.status === "pass" ? "rgba(255,255,255,0.4)" : "#F5B829", maxWidth: "240px" }}>{r.message}</td>
                                <td style={{ padding: "10px 14px", color: "rgba(255,255,255,0.4)" }}>{r.duration_ms}ms</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
