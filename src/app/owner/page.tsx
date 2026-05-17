"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Wallet, Receipt, CalendarCheck,
  UserCheck, MessageSquare, Lightbulb, LogOut, TrendingUp,
  AlertCircle, CheckCircle, Clock, Plus, Trash2, Send, RefreshCw, ShieldAlert,
} from "lucide-react";
import AttendanceReport from "@/components/AttendanceReport";

type OwnerTab = "overview" | "admissions" | "fees" | "expenses" | "attendance" | "staff" | "messages" | "insights" | "roles" | "cleanup";

const TABS: { id: OwnerTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview",    label: "Overview",    icon: <LayoutDashboard size={16} /> },
  { id: "admissions",  label: "Admissions",  icon: <Users size={16} /> },
  { id: "fees",        label: "Fees",        icon: <Wallet size={16} /> },
  { id: "expenses",    label: "Expenses",    icon: <Receipt size={16} /> },
  { id: "attendance",  label: "Attendance",  icon: <CalendarCheck size={16} /> },
  { id: "staff",       label: "Staff",       icon: <UserCheck size={16} /> },
  { id: "messages",    label: "Messages",    icon: <MessageSquare size={16} /> },
  { id: "insights",    label: "AI Insights", icon: <Lightbulb size={16} /> },
  { id: "roles",       label: "Staff Roles",  icon: <UserCheck size={16} /> },
  { id: "cleanup",     label: "Data Cleanup", icon: <ShieldAlert size={16} /> },
];

const STATUS_COLORS: Record<string, string> = {
  new: "#4A90D9", called: "#F5B829", visited: "#9B59B6", enrolled: "#178F78",
  "not-interested": "#E8694A", waitlist: "#F39C12", cancelled: "#95A5A6",
};

const FEE_STATUS_COLOR: Record<string, string> = {
  pending: "#F5B829", partial: "#4A90D9", overdue: "#E8694A", paid: "#178F78", waived: "#95A5A6",
};

const EXP_CATEGORIES = ["salaries", "utilities", "maintenance", "supplies", "repairs", "events", "other"];

const ALL_ADMIN_TABS = [
  { key: "enquiries",     label: "📋 Enquiries"     },
  { key: "sections",      label: "🏫 Sections"       },
  { key: "calendar",      label: "📅 Calendar"       },
  { key: "photos",        label: "📸 Photos"         },
  { key: "fees",          label: "💰 Fees"           },
  { key: "staff",         label: "👩‍🏫 Staff"         },
  { key: "settings",      label: "⚙️ Settings"       },
  { key: "import",        label: "📥 Import Data"    },
  { key: "kit",           label: "🎒 Kit Manager"    },
  { key: "announcements", label: "📢 Announcements"  },
  { key: "expenses",      label: "💸 Expenses"       },
  { key: "reports",       label: "📊 Reports"        },
];

// ── Styles ────────────────────────────────────────────────────────────────────
const card = (extra?: object) => ({
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px", padding: "20px", ...extra,
});

const kpiCard = (color: string) => ({
  background: `linear-gradient(135deg, ${color}22, ${color}11)`,
  border: `1px solid ${color}33`, borderRadius: "16px", padding: "20px",
});

const inputStyle: React.CSSProperties = {
  width: "100%", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 14px", fontSize: "13px", background: "rgba(255,255,255,0.07)",
  color: "white", outline: "none", fontFamily: "'Quicksand', sans-serif", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: "pointer",
};

const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
  padding: "10px 20px", borderRadius: "12px", border: "none",
  background: disabled ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #1E4D8C, #2E6BB5)",
  color: "white", fontWeight: 700, fontSize: "13px", cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "'Quicksand', sans-serif",
});

export default function OwnerDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<OwnerTab>("overview");
  const [ownerName, setOwnerName] = useState("Owner");

  // Data states
  const [overview, setOverview] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [fees, setFees] = useState<{ pending: any[]; paid: any[] }>({ pending: [], paid: [] });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ date: string; sections: Record<string, any[]>; total: number }>({ date: "", sections: {}, total: 0 });
  const [staffList, setStaffList] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [insights, setInsights] = useState("");
  const [insightsDate, setInsightsDate] = useState("");

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffDate, setStaffDate] = useState(new Date().toISOString().split("T")[0]);
  const [expMonth, setExpMonth] = useState(new Date().toISOString().slice(0, 7));

  // Expense form
  const [expForm, setExpForm] = useState({ category: "salaries", title: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
  const [showExpForm, setShowExpForm] = useState(false);

  // Message reply
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Insights loading
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Roles state
  const [rolesList, setRolesList]     = useState<any[]>([]);
  const [roleForm, setRoleForm]       = useState({ name: "", color: "#178F78", permissions: [] as string[] });
  const [roleSaving, setRoleSaving]   = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editRoleVal, setEditRoleVal] = useState({ name: "", color: "", permissions: [] as string[] });

  // Cleanup state
  const [cleanupMeta, setCleanupMeta]       = useState<{ tables: Record<string, any>; counts: Record<string, number>; errors?: Record<string, string> } | null>(null);
  const [cleanupSelected, setCleanupSelected] = useState<Set<string>>(new Set());
  const [cleanupConfirm, setCleanupConfirm] = useState("");
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupResult, setCleanupResult]   = useState<Record<string, { deleted: number; error?: string }> | null>(null);

  const setLoad = (key: string, v: boolean) => setLoading(p => ({ ...p, [key]: v }));

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchOverview = useCallback(async () => {
    setLoad("overview", true);
    const r = await fetch("/api/owner/dashboard", { cache: "no-store" });
    if (r.ok) setOverview(await r.json());
    setLoad("overview", false);
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setLoad("admissions", true);
    const r = await fetch("/api/owner/admissions", { cache: "no-store" });
    if (r.ok) { const d = await r.json(); setEnquiries(d.enquiries || []); }
    setLoad("admissions", false);
  }, []);

  const fetchFees = useCallback(async () => {
    setLoad("fees", true);
    const r = await fetch("/api/owner/fees", { cache: "no-store" });
    if (r.ok) { const d = await r.json(); setFees({ pending: d.pending || [], paid: d.paid || [] }); }
    setLoad("fees", false);
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoad("expenses", true);
    const r = await fetch(`/api/owner/expenses?month=${expMonth}`, { cache: "no-store" });
    if (r.ok) { const d = await r.json(); setExpenses(d.expenses || []); }
    setLoad("expenses", false);
  }, [expMonth]);

  const fetchAttendance = useCallback(async () => {
    setLoad("attendance", true);
    const r = await fetch(`/api/owner/attendance?date=${attDate}`, { cache: "no-store" });
    if (r.ok) setAttendance(await r.json());
    setLoad("attendance", false);
  }, [attDate]);

  const fetchStaff = useCallback(async () => {
    setLoad("staff", true);
    const r = await fetch(`/api/owner/staff-attendance?date=${staffDate}`, { cache: "no-store" });
    if (r.ok) { const d = await r.json(); setStaffList(d.staff || []); }
    setLoad("staff", false);
  }, [staffDate]);

  const fetchMessages = useCallback(async () => {
    setLoad("messages", true);
    const r = await fetch("/api/owner/messages", { cache: "no-store" });
    if (r.ok) { const d = await r.json(); setMessages(d.messages || []); }
    setLoad("messages", false);
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (tab === "overview") fetchOverview();
    else if (tab === "admissions") fetchEnquiries();
    else if (tab === "fees") fetchFees();
    else if (tab === "expenses") fetchExpenses();
    else if (tab === "attendance") fetchAttendance();
    else if (tab === "staff") fetchStaff();
    else if (tab === "messages") fetchMessages();
    else if (tab === "roles") {
      fetch("/api/owner/roles", { cache: "no-store" }).then(r => r.json()).then(d => setRolesList(d.roles || []));
    }
    else if (tab === "cleanup") {
      fetch("/api/owner/cleanup", { cache: "no-store" }).then(r => r.json()).then(d => setCleanupMeta(d));
    }
  }, [tab, fetchOverview, fetchEnquiries, fetchFees, fetchExpenses, fetchAttendance, fetchStaff, fetchMessages]);

  useEffect(() => { if (tab === "expenses") fetchExpenses(); }, [expMonth, fetchExpenses, tab]);
  useEffect(() => { if (tab === "attendance") fetchAttendance(); }, [attDate, fetchAttendance, tab]);
  useEffect(() => { if (tab === "staff") fetchStaff(); }, [staffDate, fetchStaff, tab]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await fetch("/api/owner/logout", { method: "POST" });
    router.push("/owner-login");
  };

  const addExpense = async () => {
    if (!expForm.title || !expForm.amount || !expForm.date) return;
    await fetch("/api/owner/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...expForm, amount: parseFloat(expForm.amount) }),
    });
    setExpForm({ category: "salaries", title: "", amount: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setShowExpForm(false);
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/owner/expenses?id=${id}`, { method: "DELETE" });
    fetchExpenses();
  };

  const markRead = async (id: string) => {
    await fetch("/api/owner/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read_by_owner: true }),
    });
    fetchMessages();
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    await fetch("/api/owner/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, owner_reply: replyText, read_by_owner: true }),
    });
    setReplyTarget(null);
    setReplyText("");
    fetchMessages();
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    const r = await fetch("/api/owner/ai-insights", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      setInsights(d.insights || "");
      setInsightsDate(d.generatedAt || "");
    }
    setInsightsLoading(false);
  };

  const markStaffAttendance = async (staffId: string, staffName: string, status: string) => {
    await fetch("/api/owner/staff-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId, staff_name: staffName, date: staffDate, status }),
    });
    fetchStaff();
  };

  const runCleanup = async () => {
    if (cleanupConfirm !== "DELETE" || cleanupSelected.size === 0 || cleanupRunning) return;
    setCleanupRunning(true);
    setCleanupResult(null);
    const r = await fetch("/api/owner/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tables: Array.from(cleanupSelected), confirm: cleanupConfirm }),
    });
    const d = await r.json();
    setCleanupResult(d.results || null);
    setCleanupRunning(false);
    setCleanupConfirm("");
    setCleanupSelected(new Set());
    // Refresh counts
    fetch("/api/owner/cleanup").then(r2 => r2.json()).then(d2 => setCleanupMeta(d2));
  };

  const toggleCleanup = (table: string) => {
    setCleanupSelected(prev => {
      const next = new Set(prev);
      next.has(table) ? next.delete(table) : next.add(table);
      return next;
    });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const fmtDate = (iso: string) => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const expTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const expByCategory = expenses.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {});

  const admBreakdown = enquiries.reduce((acc: Record<string, number>, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  const unreadCount = messages.filter(m => !m.read_by_owner).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0F1F35", fontFamily: "'Quicksand', sans-serif", color: "white" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#1E4D8C,#2E6BB5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              🏫
            </div>
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>Owner Portal</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Evergreen Preschool & Daycare</div>
            </div>
          </div>
          <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(255,255,255,0.6)", padding: "8px 14px", cursor: "pointer", fontSize: "12px" }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
        {/* Tab Nav */}
        <div style={{ display: "flex", gap: "4px", padding: "16px 0", overflowX: "auto" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px",
                border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
                fontFamily: "'Quicksand', sans-serif", transition: "all 0.15s",
                background: tab === t.id ? "linear-gradient(135deg,#1E4D8C,#2E6BB5)" : "rgba(255,255,255,0.05)",
                color: tab === t.id ? "white" : "rgba(255,255,255,0.55)",
                position: "relative",
              }}
            >
              {t.icon} {t.label}
              {t.id === "messages" && unreadCount > 0 && (
                <span style={{ background: "#E8694A", color: "white", borderRadius: "10px", padding: "1px 6px", fontSize: "10px", fontWeight: 700 }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            {loading.overview ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
            ) : overview ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div style={kpiCard("#178F78")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Enrolled</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#178F78", marginTop: "6px" }}>{overview.admissions?.enrolled}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{overview.admissions?.thisMonth} new this month</div>
                  </div>
                  <div style={kpiCard("#E8694A")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fees Pending</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#E8694A", marginTop: "6px" }}>{fmt(overview.fees?.pendingAmount || 0)}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{overview.fees?.overdueCount} overdue</div>
                  </div>
                  <div style={kpiCard("#4A90D9")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Attendance Today</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4A90D9", marginTop: "6px" }}>{overview.attendance?.rate}%</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>{overview.attendance?.presentToday}/{overview.attendance?.totalToday} present</div>
                  </div>
                  <div style={kpiCard("#9B59B6")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kit Pending Ack</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#9B59B6", marginTop: "6px" }}>{overview.kits?.pendingAck}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>items awaiting parent</div>
                  </div>
                  <div style={kpiCard("#F5B829")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Expenses (Month)</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#F5B829", marginTop: "6px" }}>{fmt(overview.expenses?.monthTotal || 0)}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>this month</div>
                  </div>
                  <div style={kpiCard("#E8694A")}>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Staff Messages</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#E8694A", marginTop: "6px" }}>{overview.unreadMessages}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>unread</div>
                  </div>
                </div>

                {/* Admissions funnel */}
                <div style={card({ marginBottom: "20px" })}>
                  <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}>Admissions Pipeline</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {Object.entries(overview.admissions?.breakdown || {}).map(([status, count]) => (
                      <div key={status} style={{ background: `${STATUS_COLORS[status] || "#888"}22`, border: `1px solid ${STATUS_COLORS[status] || "#888"}44`, borderRadius: "10px", padding: "10px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: STATUS_COLORS[status] || "#888" }}>{count as number}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Program breakdown */}
                {Object.keys(overview.admissions?.programBreakdown || {}).length > 0 && (
                  <div style={card()}>
                    <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}>Enrolled by Programme</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                      {Object.entries(overview.admissions.programBreakdown).map(([prog, cnt]) => (
                        <div key={prog} style={{ background: "rgba(23,143,120,0.15)", border: "1px solid rgba(23,143,120,0.3)", borderRadius: "10px", padding: "10px 18px", textAlign: "center" }}>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#178F78" }}>{cnt as number}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{prog}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ── ADMISSIONS TAB ────────────────────────────────────────────────── */}
        {tab === "admissions" && (
          <div>
            {/* Status summary pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {Object.entries(admBreakdown).map(([status, cnt]) => (
                <div key={status} style={{ background: `${STATUS_COLORS[status] || "#888"}22`, border: `1px solid ${STATUS_COLORS[status] || "#888"}44`, borderRadius: "20px", padding: "6px 16px", fontSize: "12px", fontWeight: 700, color: STATUS_COLORS[status] || "#888" }}>
                  {status}: {cnt as number}
                </div>
              ))}
            </div>

            <div style={card()}>
              <div style={{ fontWeight: 700, marginBottom: "12px" }}>All Enquiries ({enquiries.length})</div>
              {loading.admissions ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Child</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Parent</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Programme</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Section</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiries.map(e => (
                        <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.child_name}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{e.parent_name}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{e.program_label || "—"}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{e.section_name || "—"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: `${STATUS_COLORS[e.status] || "#888"}22`, color: STATUS_COLORS[e.status] || "#888", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{e.status}</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{fmtDate(e.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FEES TAB ──────────────────────────────────────────────────────── */}
        {tab === "fees" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={kpiCard("#E8694A")}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Total Pending</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#E8694A" }}>
                  {fmt(fees.pending.reduce((s, f) => s + (f.amount - (f.paid_amount || 0)), 0))}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{fees.pending.length} assignments</div>
              </div>
              <div style={kpiCard("#178F78")}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Total Collected</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#178F78" }}>
                  {fmt(fees.paid.reduce((s, f) => s + (f.paid_amount || f.amount), 0))}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>{fees.paid.length} paid</div>
              </div>
            </div>

            <div style={card()}>
              <div style={{ fontWeight: 700, marginBottom: "12px" }}>Pending Fees ({fees.pending.length})</div>
              {loading.fees ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Child</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Fee Type</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Amount</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Paid</th>
                        <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Balance</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Due</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fees.pending.map(f => (
                        <tr key={f.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{f.child_name}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)" }}>{f.fee_type}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>{fmt(f.amount)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#178F78" }}>{fmt(f.paid_amount || 0)}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", color: "#E8694A", fontWeight: 700 }}>{fmt(f.amount - (f.paid_amount || 0))}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{fmtDate(f.due_date)}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: `${FEE_STATUS_COLOR[f.status] || "#888"}22`, color: FEE_STATUS_COLOR[f.status] || "#888", borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{f.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EXPENSES TAB ──────────────────────────────────────────────────── */}
        {tab === "expenses" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <input type="month" value={expMonth} onChange={e => setExpMonth(e.target.value)} style={{ ...inputStyle, width: "160px" }} />
              </div>
              <button onClick={() => setShowExpForm(!showExpForm)} style={{ ...btnPrimary(), display: "flex", alignItems: "center", gap: "6px" }}>
                <Plus size={14} /> Add Expense
              </button>
            </div>

            {showExpForm && (
              <div style={{ ...card({ marginBottom: "20px" }), border: "1px solid rgba(30,77,140,0.4)" }}>
                <div style={{ fontWeight: 700, marginBottom: "16px" }}>New Expense</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Category</label>
                    <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                      {EXP_CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#1A2F4A" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Title *</label>
                    <input value={expForm.title} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Teacher salaries" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Amount (₹) *</label>
                    <input type="number" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Date *</label>
                    <input type="date" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Notes</label>
                    <input value={expForm.notes} onChange={e => setExpForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={addExpense} style={btnPrimary(!expForm.title || !expForm.amount)}>Save Expense</button>
                  <button onClick={() => setShowExpForm(false)} style={{ ...btnPrimary(), background: "rgba(255,255,255,0.07)" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Category totals */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              <div style={kpiCard("#F5B829")}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Month Total</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#F5B829" }}>{fmt(expTotal)}</div>
              </div>
              {Object.entries(expByCategory).map(([cat, amt]) => (
                <div key={cat} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>{cat}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>{fmt(amt as number)}</div>
                </div>
              ))}
            </div>

            <div style={card()}>
              <div style={{ fontWeight: 700, marginBottom: "12px" }}>Expense Records</div>
              {loading.expenses ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
              ) : expenses.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)" }}>No expenses recorded this month</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Category</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Title</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Amount</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Notes</th>
                      <th style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{fmtDate(e.date)}</td>
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ background: "rgba(245,184,41,0.15)", color: "#F5B829", borderRadius: "6px", padding: "2px 8px", fontSize: "11px", textTransform: "capitalize" }}>{e.category}</span>
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.title}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#F5B829" }}>{fmt(e.amount)}</td>
                        <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>{e.notes || "—"}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <button onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(232,105,74,0.6)" }}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ATTENDANCE TAB ────────────────────────────────────────────────── */}
        {tab === "attendance" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ ...inputStyle, width: "180px" }} />
              <button onClick={fetchAttendance} style={{ ...btnPrimary(), display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={14} /> Refresh</button>
            </div>

            {loading.attendance ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
            ) : (
              <>
                <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                  {["present", "absent", "late", "unmarked"].map(s => {
                    const count = s === "unmarked"
                      ? Object.values(attendance.sections).flat().filter((c: any) => !c.attendance).length
                      : Object.values(attendance.sections).flat().filter((c: any) => c.attendance?.status === s).length;
                    const color = s === "present" ? "#178F78" : s === "absent" ? "#E8694A" : s === "late" ? "#F5B829" : "#888";
                    return (
                      <div key={s} style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "12px", padding: "12px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color }}>{count}</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{s}</div>
                      </div>
                    );
                  })}
                </div>

                {Object.entries(attendance.sections).map(([section, children]) => (
                  <div key={section} style={{ ...card({ marginBottom: "16px" }) }}>
                    <div style={{ fontWeight: 700, marginBottom: "12px", fontSize: "14px" }}>{section} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>({children.length} students)</span></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                      {children.map((c: any) => {
                        const status = c.attendance?.status;
                        const color = status === "present" ? "#178F78" : status === "absent" ? "#E8694A" : status === "late" ? "#F5B829" : "#888";
                        return (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 14px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.child_name}</div>
                              <div style={{ fontSize: "11px", color, textTransform: "capitalize" }}>{status || "Not marked"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {Object.keys(attendance.sections).length === 0 && (
                  <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.3)" }}>No enrolled students found</div>
                )}
              </>
            )}

            {/* Attendance Reports */}
            <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px" }}>
              <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Attendance Reports</div>
              <AttendanceReport theme="dark" />
            </div>
          </div>
        )}

        {/* ── STAFF TAB ─────────────────────────────────────────────────────── */}
        {tab === "staff" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <input type="date" value={staffDate} onChange={e => setStaffDate(e.target.value)} style={{ ...inputStyle, width: "180px" }} />
              <button onClick={fetchStaff} style={{ ...btnPrimary(), display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={14} /> Refresh</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "20px" }}>
              {["present", "absent", "leave", "half_day"].map(s => {
                const count = staffList.filter((st: any) => st.attendance?.status === s).length;
                const unmarked = staffList.filter((st: any) => !st.attendance).length;
                const color = s === "present" ? "#178F78" : s === "absent" ? "#E8694A" : s === "leave" ? "#9B59B6" : "#F5B829";
                return (
                  <div key={s} style={{ background: `${color}22`, border: `1px solid ${color}44`, borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color }}>{s === "present" ? count : count}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{s.replace("_", " ")}</div>
                  </div>
                );
              })}
            </div>

            {loading.staff ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
            ) : (
              <div style={card()}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textTransform: "uppercase" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Role</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Clock In</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Clock Out</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((s: any) => {
                      const att = s.attendance;
                      const status = att?.status || "unmarked";
                      const color = status === "present" ? "#178F78" : status === "absent" ? "#E8694A" : status === "leave" ? "#9B59B6" : status === "half_day" ? "#F5B829" : "#888";
                      return (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{s.name}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.55)" }}>{s.role}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.55)" }}>{att?.clock_in ? fmtTime(att.clock_in) : "—"}</td>
                          <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.55)" }}>{att?.clock_out ? fmtTime(att.clock_out) : "—"}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: `${color}22`, color, borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700, textTransform: "capitalize" }}>{status.replace("_", " ")}</span>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {["present", "absent", "leave", "half_day"].map(st => (
                                <button key={st} onClick={() => markStaffAttendance(s.id, s.name, st)}
                                  style={{ padding: "4px 8px", borderRadius: "6px", border: "none", fontSize: "10px", fontWeight: 700, cursor: "pointer", background: att?.status === st ? `${STATUS_COLORS[st] || "#888"}33` : "rgba(255,255,255,0.07)", color: att?.status === st ? (STATUS_COLORS[st] || "#888") : "rgba(255,255,255,0.4)" }}>
                                  {st.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MESSAGES TAB ──────────────────────────────────────────────────── */}
        {tab === "messages" && (
          <div>
            {loading.messages ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.3)" }}>No messages from teachers yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.map(m => (
                  <div key={m.id} style={{ ...card(), border: m.read_by_owner ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(74,144,217,0.4)", background: m.read_by_owner ? "rgba(255,255,255,0.04)" : "rgba(74,144,217,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>{m.subject}</div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                          From <span style={{ color: "#4A90D9" }}>{m.from_teacher_name}</span>
                          {m.from_section && <span> · {m.from_section}</span>}
                          <span> · {fmtDate(m.created_at)}</span>
                        </div>
                      </div>
                      {!m.read_by_owner && (
                        <span style={{ background: "rgba(74,144,217,0.25)", color: "#4A90D9", borderRadius: "10px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>New</span>
                      )}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: "12px" }}>
                      {m.message}
                    </div>
                    {m.owner_reply && (
                      <div style={{ background: "rgba(30,77,140,0.2)", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: "12px", borderLeft: "3px solid #2E6BB5" }}>
                        <div style={{ fontSize: "11px", color: "#4A90D9", fontWeight: 700, marginBottom: "4px" }}>Your reply · {fmtDate(m.replied_at)}</div>
                        {m.owner_reply}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                      {!m.read_by_owner && (
                        <button onClick={() => markRead(m.id)} style={{ ...btnPrimary(), background: "rgba(255,255,255,0.07)", fontSize: "12px" }}>
                          <CheckCircle size={12} style={{ display: "inline", marginRight: "4px" }} /> Mark Read
                        </button>
                      )}
                      <button onClick={() => { setReplyTarget(replyTarget === m.id ? null : m.id); setReplyText(""); }} style={{ ...btnPrimary(), fontSize: "12px" }}>
                        <Send size={12} style={{ display: "inline", marginRight: "4px" }} /> {replyTarget === m.id ? "Cancel" : "Reply"}
                      </button>
                    </div>
                    {replyTarget === m.id && (
                      <div style={{ marginTop: "12px" }}>
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Type your reply…"
                          rows={3}
                          style={{ ...inputStyle, resize: "vertical" }}
                        />
                        <button onClick={() => sendReply(m.id)} disabled={!replyText.trim()} style={{ ...btnPrimary(!replyText.trim()), marginTop: "8px" }}>Send Reply</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AI INSIGHTS TAB ───────────────────────────────────────────────── */}
        {tab === "insights" && (
          <div>
            <div style={card({ marginBottom: "20px" })}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#9B59B6,#7D3C98)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Lightbulb size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px" }}>AI School Development Insights</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>Powered by Claude — analyzes your school data to suggest improvements</div>
                </div>
              </div>
              <button
                onClick={generateInsights}
                disabled={insightsLoading}
                style={{ ...btnPrimary(insightsLoading), background: insightsLoading ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#9B59B6,#7D3C98)", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {insightsLoading ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : <><TrendingUp size={14} /> Generate Insights</>}
              </button>
            </div>

            {insights && (
              <div style={card()}>
                {insightsDate && (
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "16px" }}>
                    Generated {fmtDate(insightsDate)} at {fmtTime(insightsDate)}
                  </div>
                )}
                <div style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: 1.8, color: "rgba(255,255,255,0.85)" }}>
                  {insights}
                </div>
              </div>
            )}

            {!insights && !insightsLoading && (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(255,255,255,0.3)" }}>
                <Lightbulb size={40} style={{ opacity: 0.2, marginBottom: "12px" }} />
                <div>Click Generate Insights to get AI-powered suggestions for your school</div>
              </div>
            )}
          </div>
        )}

        {/* ── ROLES TAB ────────────────────────────────────────────────────── */}
        {tab === "roles" && (
          <div>
            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>Staff Roles</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "20px" }}>
              Define roles and set which admin tabs each role can access. Admin can then assign these roles when adding staff.
            </div>

            {/* Add role form */}
            <div style={card({ marginBottom: "20px" })}>
              <div style={{ fontWeight: 700, marginBottom: "14px" }}>Add New Role</div>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "16px" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Role Name *</label>
                  <input value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Class Teacher, Coordinator"
                    style={{ ...inputStyle }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "6px" }}>Colour</label>
                  <input type="color" value={roleForm.color} onChange={e => setRoleForm(p => ({ ...p, color: e.target.value }))}
                    style={{ width: "48px", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", cursor: "pointer", padding: "2px" }} />
                </div>
              </div>

              {/* Tab access checkboxes */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Admin Tab Access</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Select which tabs this role can see in the admin dashboard</span>
                  <button onClick={() => setRoleForm(p => ({ ...p, permissions: ALL_ADMIN_TABS.map(t => t.key) }))}
                    style={{ marginLeft: "auto", fontSize: "11px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)", borderRadius: "6px", padding: "3px 10px", cursor: "pointer" }}>
                    All
                  </button>
                  <button onClick={() => setRoleForm(p => ({ ...p, permissions: [] }))}
                    style={{ fontSize: "11px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)", borderRadius: "6px", padding: "3px 10px", cursor: "pointer" }}>
                    None
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: "6px" }}>
                  {ALL_ADMIN_TABS.map(t => {
                    const checked = roleForm.permissions.includes(t.key);
                    return (
                      <label key={t.key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "8px", cursor: "pointer", background: checked ? "rgba(30,77,140,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${checked ? "rgba(46,107,181,0.5)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.12s" }}>
                        <input type="checkbox" checked={checked}
                          onChange={e => setRoleForm(p => ({ ...p, permissions: e.target.checked ? [...p.permissions, t.key] : p.permissions.filter(k => k !== t.key) }))}
                          style={{ accentColor: "#2E6BB5", cursor: "pointer", width: "14px", height: "14px" }} />
                        <span style={{ fontSize: "12px", color: checked ? "white" : "rgba(255,255,255,0.5)" }}>{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={roleSaving || !roleForm.name.trim()}
                onClick={async () => {
                  setRoleSaving(true);
                  const r = await fetch("/api/owner/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(roleForm) });
                  if (r.ok) {
                    const d = await r.json();
                    setRolesList(p => [...p, d.role]);
                    setRoleForm({ name: "", color: "#178F78", permissions: [] });
                  }
                  setRoleSaving(false);
                }}
                style={{ ...btnPrimary(!roleForm.name.trim()), padding: "10px 22px" }}>
                {roleSaving ? "Saving…" : "+ Add Role"}
              </button>
            </div>

            {/* Roles list */}
            {rolesList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "rgba(255,255,255,0.3)" }}>Loading roles…</div>
            ) : (
              <div style={card()}>
                <div style={{ fontWeight: 700, marginBottom: "14px" }}>Defined Roles ({rolesList.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {rolesList.map((r: any) => (
                    <div key={r.id} style={{ padding: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: `1px solid ${editingRole === r.id ? "rgba(46,107,181,0.5)" : "rgba(255,255,255,0.07)"}` }}>
                      {editingRole === r.id ? (
                        <div>
                          {/* Edit header row */}
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                            <input type="color" value={editRoleVal.color}
                              onChange={e => setEditRoleVal(p => ({ ...p, color: e.target.value }))}
                              style={{ width: "36px", height: "36px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", padding: "2px", flexShrink: 0 }} />
                            <input value={editRoleVal.name}
                              onChange={e => setEditRoleVal(p => ({ ...p, name: e.target.value }))}
                              style={{ ...inputStyle, flex: 1 }}
                              autoFocus />
                          </div>
                          {/* Permissions grid */}
                          <div style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Admin Tab Access</span>
                              <button onClick={() => setEditRoleVal(p => ({ ...p, permissions: ALL_ADMIN_TABS.map(t => t.key) }))}
                                style={{ fontSize: "10px", background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", borderRadius: "5px", padding: "2px 8px", cursor: "pointer" }}>
                                All
                              </button>
                              <button onClick={() => setEditRoleVal(p => ({ ...p, permissions: [] }))}
                                style={{ fontSize: "10px", background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", borderRadius: "5px", padding: "2px 8px", cursor: "pointer" }}>
                                None
                              </button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: "5px" }}>
                              {ALL_ADMIN_TABS.map(t => {
                                const checked = editRoleVal.permissions.includes(t.key);
                                return (
                                  <label key={t.key} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 9px", borderRadius: "7px", cursor: "pointer", background: checked ? "rgba(30,77,140,0.22)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked ? "rgba(46,107,181,0.45)" : "rgba(255,255,255,0.06)"}` }}>
                                    <input type="checkbox" checked={checked}
                                      onChange={e => setEditRoleVal(p => ({ ...p, permissions: e.target.checked ? [...p.permissions, t.key] : p.permissions.filter(k => k !== t.key) }))}
                                      style={{ accentColor: "#2E6BB5", cursor: "pointer", width: "13px", height: "13px" }} />
                                    <span style={{ fontSize: "11px", color: checked ? "white" : "rgba(255,255,255,0.45)" }}>{t.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                          {/* Save/Cancel */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={async () => {
                              if (!editRoleVal.name.trim()) return;
                              const res = await fetch("/api/owner/roles", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, name: editRoleVal.name, color: editRoleVal.color, permissions: editRoleVal.permissions }) });
                              if (res.ok) {
                                const d = await res.json();
                                setRolesList(p => p.map(x => x.id === r.id ? d.role : x));
                                setEditingRole(null);
                              }
                            }} style={{ ...btnPrimary(), padding: "7px 16px", fontSize: "12px" }}>Save Changes</button>
                            <button onClick={() => setEditingRole(null)} style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.5)", padding: "7px 14px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "14px" }}>{r.name}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                              {!r.permissions || r.permissions.length === 0
                                ? "No tab access"
                                : r.permissions.length === ALL_ADMIN_TABS.length
                                ? "Full access — all tabs"
                                : `${r.permissions.length} tabs: ${r.permissions.slice(0, 4).map((k: string) => ALL_ADMIN_TABS.find(t => t.key === k)?.label?.replace(/\p{Emoji}/gu, "").trim() || k).join(", ")}${r.permissions.length > 4 ? ` +${r.permissions.length - 4} more` : ""}`
                              }
                            </div>
                          </div>
                          <button onClick={() => { setEditingRole(r.id); setEditRoleVal({ name: r.name, color: r.color, permissions: r.permissions || [] }); }}
                            style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.5)", padding: "6px 14px", cursor: "pointer", fontSize: "12px" }}>
                            Edit
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`Delete role "${r.name}"?`)) return;
                            await fetch(`/api/owner/roles?id=${r.id}`, { method: "DELETE" });
                            setRolesList(p => p.filter(x => x.id !== r.id));
                          }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(232,105,74,0.7)", padding: "6px" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "14px", fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                  Roles appear in Admin → Staff when creating staff. The tab access controls what each role sees in the admin dashboard.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CLEANUP TAB ──────────────────────────────────────────────────── */}
        {tab === "cleanup" && (
          <div>
            {/* Warning banner */}
            <div style={{ background: "rgba(232,105,74,0.12)", border: "1px solid rgba(232,105,74,0.4)", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <ShieldAlert size={28} color="#E8694A" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "#E8694A", marginBottom: "6px" }}>Danger Zone — Permanent Data Deletion</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                  This will permanently delete selected data. <strong style={{ color: "white" }}>Only Admin &amp; Owner login accounts are never deletable.</strong> Everything else is your choice — if you don't want to delete something, simply leave it unchecked. This action cannot be undone.
                </div>
              </div>
            </div>

            {/* Table selection */}
            {!cleanupMeta ? (
              <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading…</div>
            ) : cleanupMeta.errors && Object.keys(cleanupMeta.errors).length > 0 ? (
              <div style={{ background: "rgba(232,105,74,0.12)", border: "1px solid rgba(232,105,74,0.5)", borderRadius: "14px", padding: "20px 24px" }}>
                <div style={{ fontWeight: 800, color: "#E8694A", marginBottom: "10px" }}>⚠ Supabase Permission Error</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "14px", lineHeight: 1.7 }}>
                  The database is blocking row count queries. Run these SQL statements in your <strong>Supabase → SQL Editor</strong>, then refresh this page:
                </div>
                <pre style={{ background: "rgba(0,0,0,0.4)", borderRadius: "10px", padding: "14px", fontSize: "12px", color: "#7FDBCA", overflowX: "auto", lineHeight: 1.8 }}>{
Object.keys(cleanupMeta.errors).map(t => `GRANT ALL ON ${t} TO anon;`).join("\n")
                }</pre>
              </div>
            ) : (
              <>
                <div style={card({ marginBottom: "20px" })}>
                  <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>Select data to delete:</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px", gap: "10px" }}>
                    <button onClick={() => setCleanupSelected(new Set(Object.keys(cleanupMeta.tables)))}
                      style={{ fontSize: "12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "5px 12px", cursor: "pointer" }}>
                      Select All
                    </button>
                    <button onClick={() => setCleanupSelected(new Set())}
                      style={{ fontSize: "12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", borderRadius: "8px", padding: "5px 12px", cursor: "pointer" }}>
                      Clear All
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Object.entries(cleanupMeta.tables).map(([key, info]: [string, any]) => {
                      const count   = cleanupMeta.counts[key] || 0;
                      const checked = cleanupSelected.has(key);
                      return (
                        <label key={key} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderRadius: "12px", background: checked ? "rgba(232,105,74,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked ? "rgba(232,105,74,0.35)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.15s" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleCleanup(key)}
                            style={{ width: "16px", height: "16px", accentColor: "#E8694A", cursor: "pointer" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "13px" }}>{info.label}</div>
                            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "1px" }}>{info.description}</div>
                          </div>
                          <span style={{ background: count > 0 ? "rgba(232,105,74,0.2)" : "rgba(255,255,255,0.06)", color: count > 0 ? "#E8694A" : "rgba(255,255,255,0.35)", borderRadius: "10px", padding: "3px 10px", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                            {count.toLocaleString()} rows
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Confirmation */}
                {cleanupSelected.size > 0 && (
                  <div style={card({ borderColor: "rgba(232,105,74,0.3)" })}>
                    <div style={{ fontWeight: 700, marginBottom: "6px", color: "#E8694A" }}>
                      You are about to delete {cleanupSelected.size} category{cleanupSelected.size > 1 ? "ies" : ""}:
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>
                      {Array.from(cleanupSelected).map(k => cleanupMeta.tables[k]?.label).join(" · ")}
                    </div>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", display: "block", marginBottom: "8px" }}>
                        Type <strong style={{ color: "#E8694A" }}>DELETE</strong> to confirm:
                      </label>
                      <input
                        value={cleanupConfirm}
                        onChange={e => setCleanupConfirm(e.target.value)}
                        placeholder="Type DELETE"
                        style={{ ...inputStyle, maxWidth: "260px", borderColor: cleanupConfirm === "DELETE" ? "#E8694A" : "rgba(255,255,255,0.12)" }}
                      />
                    </div>
                    <button
                      onClick={runCleanup}
                      disabled={cleanupConfirm !== "DELETE" || cleanupRunning}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "14px", cursor: cleanupConfirm !== "DELETE" || cleanupRunning ? "not-allowed" : "pointer", fontFamily: "'Quicksand',sans-serif", background: cleanupConfirm !== "DELETE" ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#c0392b,#e74c3c)", color: cleanupConfirm !== "DELETE" ? "rgba(255,255,255,0.3)" : "white", boxShadow: cleanupConfirm === "DELETE" ? "0 6px 20px rgba(231,76,60,0.4)" : "none" }}>
                      <Trash2 size={16} /> {cleanupRunning ? "Deleting…" : "Permanently Delete Selected Data"}
                    </button>
                  </div>
                )}

                {/* Results */}
                {cleanupResult && (() => {
                  const entries = Object.entries(cleanupResult) as [string, { deleted: number; error?: string }][];
                  const hasErrors = entries.some(([, r]) => r.error);
                  const totalDeleted = entries.reduce((s, [, r]) => s + (r.deleted || 0), 0);
                  return (
                    <div style={{ marginTop: "20px" }}>
                      {hasErrors && (
                        <div style={{ background: "rgba(232,105,74,0.12)", border: "1px solid rgba(232,105,74,0.5)", borderRadius: "12px", padding: "14px 18px", marginBottom: "12px", fontSize: "13px", color: "#E8694A", lineHeight: 1.6 }}>
                          <strong>Some tables could not be deleted</strong> — this is usually a Supabase permission issue.<br />
                          Run the GRANT statements from <code style={{ background: "rgba(0,0,0,0.3)", padding: "1px 6px", borderRadius: "4px", fontSize: "12px" }}>owner-portal-sql.sql</code> in your Supabase SQL editor, then try again.
                        </div>
                      )}
                      <div style={{ ...card(), borderColor: hasErrors ? "rgba(232,105,74,0.3)" : "rgba(23,143,120,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div style={{ fontWeight: 700, color: hasErrors ? "#F5B829" : "#178F78" }}>
                            {hasErrors ? "Cleanup Partial" : "Cleanup Complete"}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{totalDeleted.toLocaleString()} total rows deleted</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {entries.map(([table, res]) => (
                            <div key={table} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: res.error ? "rgba(232,105,74,0.08)" : "rgba(255,255,255,0.04)", borderRadius: "8px", border: res.error ? "1px solid rgba(232,105,74,0.25)" : "none" }}>
                              <span style={{ fontSize: "13px" }}>{cleanupMeta?.tables[table]?.label || table}</span>
                              {res.error ? (
                                <span style={{ color: "#E8694A", fontSize: "12px" }}>✕ {res.error}</span>
                              ) : (
                                <span style={{ color: "#178F78", fontWeight: 700, fontSize: "13px" }}>✓ {res.deleted} rows deleted</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        <div style={{ height: "40px" }} />
      </div>
    </div>
  );
}
