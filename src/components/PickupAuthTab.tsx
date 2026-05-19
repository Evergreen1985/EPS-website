"use client";
import { useState, useEffect } from "react";

const RELATIONS = ["Parent", "Grandparent", "Uncle", "Aunt", "Sibling", "Driver", "Nanny", "Other"];
const ID_TYPES  = [
  { value: "aadhaar",         label: "Aadhaar Card" },
  { value: "pan",             label: "PAN Card" },
  { value: "driving_license", label: "Driving Licence" },
  { value: "passport",        label: "Passport" },
  { value: "voter_id",        label: "Voter ID" },
  { value: "other",           label: "Other ID" },
];

interface Auth {
  id: string;
  authorized_name: string;
  relation: string;
  phone: string;
  id_type: string;
  id_number: string;
  notes: string;
  is_active: boolean;
  created_at: string;
}

const BLANK_FORM = { authorizedName: "", relation: "Parent", phone: "", idType: "aadhaar", idNumber: "", notes: "" };

export default function PickupAuthTab({
  enquiryId, childName, addedBy = "parent", readOnly = false,
}: {
  enquiryId: string; childName?: string; addedBy?: string; readOnly?: boolean;
}) {
  const [auths, setAuths]       = useState<Auth[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    if (!enquiryId) return;
    setLoading(true);
    fetch(`/api/pickup?enquiryId=${enquiryId}`)
      .then(r => r.json())
      .then(d => setAuths(Array.isArray(d) ? d : []))
      .catch(() => setAuths([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [enquiryId]);

  const submit = async () => {
    if (!form.authorizedName.trim() || !form.phone.trim()) {
      setError("Name and phone are required."); return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enquiryId, childName: childName || "",
        authorizedName: form.authorizedName.trim(),
        relation:  form.relation,
        phone:     form.phone.trim(),
        idType:    form.idType,
        idNumber:  form.idNumber.trim(),
        notes:     form.notes.trim(),
        addedBy,
      }),
    });
    const data = await res.json();
    if (data.success) { setForm(BLANK_FORM); setShowForm(false); load(); }
    else setError(data.error || "Failed to save.");
    setSaving(false);
  };

  const toggleActive = async (a: Auth) => {
    setToggling(a.id);
    await fetch("/api/pickup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: a.id, isActive: !a.is_active }),
    });
    setAuths(prev => prev.map(p => p.id === a.id ? { ...p, is_active: !p.is_active } : p));
    setToggling(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this authorized person?")) return;
    await fetch(`/api/pickup?id=${id}`, { method: "DELETE" });
    setAuths(prev => prev.filter(a => a.id !== id));
  };

  const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>
      <div style={{ width: "32px", height: "32px", border: "3px solid #EDE8DF", borderTopColor: "#178F78", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
      Loading…
    </div>
  );

  const active   = auths.filter(a => a.is_active);
  const inactive = auths.filter(a => !a.is_active);

  return (
    <div>
      {/* Info banner */}
      <div style={{ background: "rgba(23,143,120,0.07)", border: "1px solid rgba(23,143,120,0.2)", borderRadius: "14px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px", color: "#178F78", lineHeight: 1.5 }}>
        🔒 Only people listed here are authorized to pick up {childName || "your child"}. School staff will verify their identity before releasing the child.
      </div>

      {/* Active authorizations */}
      {active.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "32px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🚗</div>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>No authorized pickups yet</div>
          <div style={{ fontSize: "11px" }}>Add people who are allowed to collect {childName || "your child"}.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
        {active.map(a => (
          <div key={a.id} style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "14px", padding: "14px 16px", background: "rgba(23,143,120,0.03)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(23,143,120,0.15),rgba(99,102,241,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👤</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{a.authorized_name}</div>
                <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                  {a.relation}
                  {a.phone && <> · <a href={`tel:${a.phone}`} style={{ color: "#178F78", fontWeight: 600, textDecoration: "none" }}>{a.phone}</a></>}
                </div>
                {a.id_number && (
                  <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "3px", fontFamily: "monospace" }}>
                    {ID_TYPES.find(t => t.value === a.id_type)?.label || a.id_type}: {a.id_number}
                  </div>
                )}
                {a.notes && <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "4px", fontStyle: "italic" }}>{a.notes}</div>}
              </div>
              {!readOnly && (
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => toggleActive(a)} disabled={toggling === a.id}
                    style={{ background: "rgba(245,184,41,0.1)", border: "1px solid rgba(245,184,41,0.3)", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, color: "#B08000", cursor: "pointer" }}>
                    Pause
                  </button>
                  <button onClick={() => remove(a.id)}
                    style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {!readOnly && !showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", justifyContent: "center", background: "rgba(23,143,120,0.07)", border: "1px dashed rgba(23,143,120,0.35)", borderRadius: "14px", padding: "12px", fontSize: "13px", fontWeight: 700, color: "#178F78", cursor: "pointer", marginBottom: "16px" }}>
          + Add Authorized Person
        </button>
      )}

      {!readOnly && showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "16px", marginBottom: "16px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#178F78", marginBottom: "14px" }}>➕ Add Authorized Person</div>

          {error && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>Full Name *</label>
              <input value={form.authorizedName} onChange={e => setForm(f => ({ ...f, authorizedName: e.target.value }))} placeholder="e.g. Ramesh Kumar" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>Relation *</label>
              <select value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} style={selectStyle}>
                {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>Phone Number *</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>ID Type</label>
              <select value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))} style={selectStyle}>
                {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>ID Number</label>
              <input value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} placeholder="Last 4 digits OK" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" }}>Notes (optional)</label>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Only on Fridays, wears glasses" style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={submit} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "✅ Save Authorization"}
            </button>
            <button onClick={() => { setShowForm(false); setError(""); setForm(BLANK_FORM); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Paused / inactive */}
      {inactive.length > 0 && (
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Paused</div>
          {inactive.map(a => (
            <div key={a.id} style={{ border: "1px solid #EDE8DF", borderRadius: "12px", padding: "12px 14px", marginBottom: "6px", opacity: 0.6, display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#6B7A99" }}>{a.authorized_name} <span style={{ fontWeight: 400 }}>({a.relation})</span></div>
                <div style={{ fontSize: "11px", color: "#9CA3AF" }}>{a.phone}</div>
              </div>
              {!readOnly && (
                <button onClick={() => toggleActive(a)} disabled={toggling === a.id}
                  style={{ background: "rgba(23,143,120,0.08)", border: "1px solid rgba(23,143,120,0.2)", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>
                  Re-enable
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
