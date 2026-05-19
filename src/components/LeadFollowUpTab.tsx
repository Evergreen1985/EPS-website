"use client";
import { useState, useEffect } from "react";

const STATUS_COLOR: Record<string,string> = {
  pending: "#F5B829", done: "#178F78", "no-answer": "#E8694A", rescheduled: "#4A90D9",
};
const STATUS_OPTS = ["pending","done","no-answer","rescheduled"];

interface FollowUp {
  id: string;
  enquiry_id: string;
  followup_date: string;
  notes: string;
  status: string;
  added_by: string;
  created_at: string;
  enquiries?: { child_name: string; parent_name: string; phone: string; status: string; };
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };

export default function LeadFollowUpTab({ enquiryId, childName }: { enquiryId?: string; childName?: string; }) {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [date, setDate]           = useState("");
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (enquiryId)    params.set("enquiryId", enquiryId);
    if (filterDate)   params.set("date", filterDate);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/followups?${params}`)
      .then(r => r.json())
      .then(d => setFollowups(Array.isArray(d) ? d : []))
      .catch(() => setFollowups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [enquiryId, filterDate, filterStatus]);

  const submit = async () => {
    if (!date) { setMsg("Date is required."); return; }
    setSaving(true); setMsg("");
    const res = await fetch("/api/followups", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enquiryId, followupDate: date, notes }),
    });
    const d = await res.json();
    if (d.success) { setDate(""); setNotes(""); setShowForm(false); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/followups", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this follow-up?")) return;
    await fetch(`/api/followups?id=${id}`, { method: "DELETE" });
    load();
  };

  const today = new Date().toISOString().split("T")[0];
  const overdue  = followups.filter(f => f.status === "pending" && f.followup_date < today);
  const todayFu  = followups.filter(f => f.followup_date === today);
  const upcoming = followups.filter(f => f.status === "pending" && f.followup_date > today);
  const done     = followups.filter(f => f.status !== "pending" || f.followup_date > today).filter(f => f.status !== "pending");

  const Section = ({ title, items }: { title: string; items: FollowUp[] }) => items.length === 0 ? null : (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map(f => {
          const enq = f.enquiries;
          return (
            <div key={f.id} style={{ border: "1px solid #EDE8DF", borderRadius: "12px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  {!enquiryId && enq && (
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A" }}>
                      {enq.child_name}
                      <span style={{ color: "#6B7A99", fontWeight: 400 }}> · {enq.parent_name}</span>
                      {enq.phone && <> · <a href={`tel:${enq.phone}`} style={{ color: "#178F78", textDecoration: "none", fontSize: "12px" }}>{enq.phone}</a></>}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: enquiryId ? 0 : "2px" }}>
                    📅 {new Date(f.followup_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {f.added_by && <span style={{ color: "#9CA3AF" }}> · by {f.added_by}</span>}
                  </div>
                  {f.notes && <div style={{ fontSize: "12px", color: "#1A2F4A", marginTop: "4px" }}>{f.notes}</div>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <span style={{ background: STATUS_COLOR[f.status] + "22", color: STATUS_COLOR[f.status], borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{f.status}</span>
                  {f.status === "pending" && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => updateStatus(f.id, "done")}
                        style={{ background: "rgba(23,143,120,0.1)", border: "1px solid rgba(23,143,120,0.3)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>Done</button>
                      <button onClick={() => updateStatus(f.id, "no-answer")}
                        style={{ background: "rgba(232,105,74,0.07)", border: "1px solid rgba(232,105,74,0.2)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", color: "#E8694A", cursor: "pointer" }}>No Answer</button>
                    </div>
                  )}
                  <button onClick={() => remove(f.id)}
                    style={{ background: "none", border: "none", fontSize: "10px", color: "#9CA3AF", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: enquiryId ? "0" : "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>📋 Lead Follow-Ups</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{overdue.length} overdue · {todayFu.length} today · {upcoming.length} upcoming</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {!enquiryId && (
            <>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...inp, width: "150px" }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: "130px" }}>
                <option value="">All Status</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 16px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            + Schedule
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "14px", marginBottom: "16px", background: "#FEFCF8" }}>
          {msg && <div style={{ color: "#DC2626", fontSize: "12px", marginBottom: "8px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Follow-up Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="What to discuss…" style={inp} /></div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={submit} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "9px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "✅ Schedule"}
            </button>
            <button onClick={() => { setShowForm(false); setMsg(""); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "9px 14px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : followups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📋</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No follow-ups scheduled</div>
        </div>
      ) : (
        <>
          <Section title={`🔴 Overdue (${overdue.length})`}  items={overdue} />
          <Section title={`🟡 Today (${todayFu.length})`}    items={todayFu} />
          <Section title={`🟢 Upcoming (${upcoming.length})`} items={upcoming} />
          <Section title={`✅ Completed (${done.length})`}    items={done} />
        </>
      )}
    </div>
  );
}
