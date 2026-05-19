"use client";
import { useState, useEffect } from "react";

const STATUS_COLOR: Record<string,string> = {
  pending: "#F5B829", contacted: "#4A90D9", enrolled: "#178F78", rewarded: "#9B59B6", "not-interested": "#6B7A99",
};
const STATUS_OPTS = ["pending","contacted","enrolled","rewarded","not-interested"];

interface Referral {
  id: string;
  referrer_name: string;
  referee_name: string;
  referee_phone: string;
  referee_email: string;
  status: string;
  reward_amount: number;
  reward_given_at: string | null;
  notes: string;
  created_at: string;
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };

const BLANK = { referrerName: "", refereeName: "", refereePhone: "", refereeEmail: "", notes: "" };

export default function ReferralTab({ enquiryId = "", referrerName: defaultName = "", readOnly = false }: { enquiryId?: string; referrerName?: string; readOnly?: boolean; }) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ ...BLANK, referrerName: defaultName });
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState("");
  const [editing, setEditing]     = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<Record<string,string>>({});

  const load = () => {
    setLoading(true);
    const url = enquiryId ? `/api/referrals?enquiryId=${enquiryId}` : "/api/referrals";
    fetch(url)
      .then(r => r.json())
      .then(d => setReferrals(Array.isArray(d) ? d : []))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [enquiryId]);

  const submit = async () => {
    if (!form.referrerName.trim() || !form.refereeName.trim() || !form.refereePhone.trim()) {
      setMsg("Referrer name, referee name, and phone are required."); return;
    }
    setSaving(true); setMsg("");
    const res = await fetch("/api/referrals", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerEnquiryId: enquiryId || null, ...form }),
    });
    const d = await res.json();
    if (d.success) { setForm({ ...BLANK, referrerName: defaultName }); setShowForm(false); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/referrals", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load(); setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this referral?")) return;
    await fetch(`/api/referrals?id=${id}`, { method: "DELETE" });
    load();
  };

  const stats = { total: referrals.length, enrolled: referrals.filter(r => r.status === "enrolled" || r.status === "rewarded").length };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: enquiryId ? "0" : "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>🎁 Referral Programme</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{stats.total} referrals · {stats.enrolled} enrolled</div>
        </div>
        {!readOnly && (
          <button onClick={() => { setShowForm(true); setMsg(""); }}
            style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            + Add Referral
          </button>
        )}
      </div>

      {!readOnly && showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "16px", marginBottom: "20px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#178F78", marginBottom: "14px" }}>➕ New Referral</div>
          {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Referrer Name *</label><input value={form.referrerName} onChange={e => setForm(f => ({ ...f, referrerName: e.target.value }))} placeholder="Parent who referred" style={inp} /></div>
            <div><label style={lbl}>Referee Name *</label><input value={form.refereeName} onChange={e => setForm(f => ({ ...f, refereeName: e.target.value }))} placeholder="Friend's child name" style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Referee Phone *</label><input type="tel" value={form.refereePhone} onChange={e => setForm(f => ({ ...f, refereePhone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={inp} /></div>
            <div><label style={lbl}>Referee Email</label><input type="email" value={form.refereeEmail} onChange={e => setForm(f => ({ ...f, refereeEmail: e.target.value }))} placeholder="Optional" style={inp} /></div>
          </div>
          <div style={{ marginBottom: "14px" }}><label style={lbl}>Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional…" style={inp} /></div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={submit} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "✅ Save Referral"}
            </button>
            <button onClick={() => { setShowForm(false); setMsg(""); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : referrals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No referrals yet</div>
          <div style={{ fontSize: "11px" }}>Encourage parents to refer friends and earn rewards!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {referrals.map(r => (
            <div key={r.id} style={{ border: "1px solid #EDE8DF", borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>
                    {r.referee_name} <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: "12px" }}>referred by {r.referrer_name}</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                    <a href={`tel:${r.referee_phone}`} style={{ color: "#178F78", textDecoration: "none", fontWeight: 600 }}>{r.referee_phone}</a>
                    {r.referee_email && <> · {r.referee_email}</>}
                  </div>
                  {r.notes && <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "3px", fontStyle: "italic" }}>{r.notes}</div>}
                  <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "4px" }}>{new Date(r.created_at).toLocaleDateString("en-IN")}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <span style={{ background: STATUS_COLOR[r.status] + "22", color: STATUS_COLOR[r.status], borderRadius: "8px", padding: "3px 10px", fontSize: "10px", fontWeight: 700 }}>{r.status}</span>
                  {!readOnly && (
                    <div style={{ display: "flex", gap: "4px" }}>
                      {editing === r.id ? (
                        <>
                          <select value={editStatus[r.id] || r.status} onChange={e => setEditStatus(s => ({ ...s, [r.id]: e.target.value }))}
                            style={{ ...inp, width: "130px", fontSize: "11px", padding: "4px 8px" }}>
                            {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => updateStatus(r.id, editStatus[r.id] || r.status)}
                            style={{ background: "#178F78", color: "white", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>Save</button>
                          <button onClick={() => setEditing(null)}
                            style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditing(r.id); setEditStatus(s => ({ ...s, [r.id]: r.status })); }}
                            style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>Status</button>
                          <button onClick={() => remove(r.id)}
                            style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", color: "#DC2626", cursor: "pointer" }}>Del</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
