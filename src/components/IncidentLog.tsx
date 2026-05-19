"use client";
import { useState, useEffect } from "react";

const SEV_COLOR: Record<string,string> = { low: "#178F78", medium: "#F5B829", high: "#E8694A" };
const TYPE_ICON: Record<string,string> = { accident: "🤕", illness: "🤒", behaviour: "😤", injury: "🩹", allergy: "⚠️", other: "📝" };
const TYPES = ["accident","illness","behaviour","injury","allergy","other"];
const SEVERITIES = ["low","medium","high"];
const NOTIFY_VIA = ["","phone","whatsapp","in-person","email"];

interface Incident {
  id: string;
  enquiry_id: string | null;
  child_name: string;
  section_name: string;
  incident_date: string;
  incident_time: string | null;
  incident_type: string;
  severity: string;
  description: string;
  action_taken: string;
  reported_by: string;
  parent_notified: boolean;
  parent_notified_at: string | null;
  parent_notified_via: string;
  follow_up_required: boolean;
  follow_up_notes: string;
  created_at: string;
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };
const ta: React.CSSProperties  = { ...inp, resize: "vertical", minHeight: "60px" };

const BLANK = { childName: "", sectionName: "", incidentDate: new Date().toISOString().split("T")[0], incidentTime: "", incidentType: "accident", severity: "low", description: "", actionTaken: "", reportedBy: "", parentNotified: false, parentNotifiedVia: "", followUpRequired: false, followUpNotes: "" };

export default function IncidentLog({ enquiryId, childName: defaultName, sectionName: defaultSection }: { enquiryId?: string; childName?: string; sectionName?: string; }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...BLANK, childName: defaultName || "", sectionName: defaultSection || "" });
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [filterSev, setFilterSev] = useState("");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (enquiryId) params.set("enquiryId", enquiryId);
    if (filterSev) params.set("severity", filterSev);
    fetch(`/api/incidents?${params}`)
      .then(r => r.json())
      .then(d => setIncidents(Array.isArray(d) ? d : []))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [enquiryId, filterSev]);

  const submit = async () => {
    if (!form.childName.trim() || !form.description.trim() || !form.reportedBy.trim()) {
      setMsg("Child name, description, and reported-by are required."); return;
    }
    setSaving(true); setMsg("");
    const res = await fetch("/api/incidents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, enquiryId: enquiryId || null }),
    });
    const d = await res.json();
    if (d.success) { setForm({ ...BLANK, childName: defaultName || "", sectionName: defaultSection || "" }); setShowForm(false); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const notifyParent = async (id: string, via: string) => {
    await fetch("/api/incidents", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, parentNotified: true, parentNotifiedVia: via }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this incident record?")) return;
    await fetch(`/api/incidents?id=${id}`, { method: "DELETE" });
    load();
  };

  const highCount = incidents.filter(i => i.severity === "high").length;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: enquiryId ? "0" : "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>🚨 Incident Log</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>
            {incidents.length} incidents
            {highCount > 0 && <span style={{ color: "#E8694A", fontWeight: 700 }}> · {highCount} high severity</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {!enquiryId && (
            <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
              style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "7px 12px", fontSize: "12px", color: "#1A2F4A", outline: "none", cursor: "pointer" }}>
              <option value="">All Severity</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          )}
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            style={{ background: "#E8694A", color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            + Log Incident
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ border: "1px solid rgba(232,105,74,0.25)", borderRadius: "16px", padding: "20px", marginBottom: "20px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#E8694A", marginBottom: "14px" }}>🚨 Log New Incident</div>
          {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Child Name *</label><input value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))} style={inp} /></div>
            <div><label style={lbl}>Section / Class</label><input value={form.sectionName} onChange={e => setForm(f => ({ ...f, sectionName: e.target.value }))} placeholder="e.g. Nursery A" style={inp} /></div>
            <div><label style={lbl}>Reported By *</label><input value={form.reportedBy} onChange={e => setForm(f => ({ ...f, reportedBy: e.target.value }))} placeholder="Staff name" style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Date *</label><input type="date" value={form.incidentDate} onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))} style={inp} /></div>
            <div><label style={lbl}>Time</label><input type="time" value={form.incidentTime} onChange={e => setForm(f => ({ ...f, incidentTime: e.target.value }))} style={inp} /></div>
            <div>
              <label style={lbl}>Type</label>
              <select value={form.incidentType} onChange={e => setForm(f => ({ ...f, incidentType: e.target.value }))} style={inp}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_ICON[t]} {t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Severity</label>
              <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} style={inp}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "10px" }}><label style={lbl}>Description *</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happened…" style={ta} /></div>
          <div style={{ marginBottom: "10px" }}><label style={lbl}>Action Taken</label><textarea value={form.actionTaken} onChange={e => setForm(f => ({ ...f, actionTaken: e.target.value }))} placeholder="What was done to help…" style={ta} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.parentNotified} onChange={e => setForm(f => ({ ...f, parentNotified: e.target.checked }))} />Parent notified
              </label>
              {form.parentNotified && (
                <select value={form.parentNotifiedVia} onChange={e => setForm(f => ({ ...f, parentNotifiedVia: e.target.value }))} style={inp}>
                  {NOTIFY_VIA.map(v => <option key={v} value={v}>{v || "— select how —"}</option>)}
                </select>
              )}
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer", marginBottom: "6px" }}>
                <input type="checkbox" checked={form.followUpRequired} onChange={e => setForm(f => ({ ...f, followUpRequired: e.target.checked }))} />Follow-up required
              </label>
              {form.followUpRequired && (
                <input value={form.followUpNotes} onChange={e => setForm(f => ({ ...f, followUpNotes: e.target.value }))} placeholder="Follow-up details…" style={inp} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={submit} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#E8694A", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "🚨 Log Incident"}
            </button>
            <button onClick={() => { setShowForm(false); setMsg(""); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : incidents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No incidents logged</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {incidents.map(inc => {
            const isOpen = expanded === inc.id;
            return (
              <div key={inc.id} style={{ border: `1px solid ${SEV_COLOR[inc.severity]}44`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                  <div style={{ fontSize: "24px" }}>{TYPE_ICON[inc.incident_type]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>
                      {inc.child_name}
                      {inc.section_name && <span style={{ color: "#6B7A99", fontWeight: 400 }}> · {inc.section_name}</span>}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                      {new Date(inc.incident_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {inc.incident_time && ` at ${inc.incident_time.slice(0,5)}`}
                      {" · "}{inc.incident_type} · by {inc.reported_by}
                    </div>
                    <div style={{ fontSize: "12px", color: "#1A2F4A", marginTop: "3px", lineHeight: 1.4 }}>{inc.description.slice(0, 100)}{inc.description.length > 100 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ background: SEV_COLOR[inc.severity] + "22", color: SEV_COLOR[inc.severity], borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{inc.severity.toUpperCase()}</span>
                    {inc.parent_notified
                      ? <span style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Parent Notified ✓</span>
                      : <span style={{ background: "rgba(245,184,41,0.15)", color: "#B08000", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Parent Not Notified</span>}
                    <button onClick={() => setExpanded(isOpen ? null : inc.id)}
                      style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", cursor: "pointer" }}>
                      {isOpen ? "Collapse" : "Details"}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid #EDE8DF", padding: "14px 16px", background: "#FAFAF8" }}>
                    {inc.action_taken && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", marginBottom: "4px" }}>ACTION TAKEN</div>
                        <div style={{ fontSize: "13px", color: "#1A2F4A" }}>{inc.action_taken}</div>
                      </div>
                    )}
                    {inc.follow_up_required && inc.follow_up_notes && (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", marginBottom: "4px" }}>FOLLOW-UP</div>
                        <div style={{ fontSize: "13px", color: "#1A2F4A" }}>{inc.follow_up_notes}</div>
                      </div>
                    )}
                    {!inc.parent_notified && (
                      <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", width: "100%", marginBottom: "4px" }}>NOTIFY PARENT VIA</div>
                        {["phone","whatsapp","in-person"].map(v => (
                          <button key={v} onClick={() => notifyParent(inc.id, v)}
                            style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "8px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>
                            {v === "whatsapp" ? "💬 " : v === "phone" ? "📞 " : "🤝 "}{v}
                          </button>
                        ))}
                      </div>
                    )}
                    <button onClick={() => remove(inc.id)}
                      style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                      Delete Record
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
