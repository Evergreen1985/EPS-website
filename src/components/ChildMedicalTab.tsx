"use client";
import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────
interface Allergy          { type: string; name: string; severity: string; }
interface Vaccination      { name: string; date: string; next_due: string; completed: boolean; }
interface EmergencyContact { name: string; relation: string; phone: string; }

interface MedicalRecord {
  blood_group:         string;
  allergies:           Allergy[];
  vaccinations:        Vaccination[];
  emergency_contacts:  EmergencyContact[];
  medical_conditions:  string;
  special_needs:       string;
  doctor_name:         string;
  doctor_phone:        string;
  insurance_provider:  string;
}

const BLANK: MedicalRecord = {
  blood_group: "", allergies: [], vaccinations: [], emergency_contacts: [],
  medical_conditions: "", special_needs: "", doctor_name: "", doctor_phone: "", insurance_provider: "",
};

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];
const ALLERGY_TYPES = ["food", "medicine", "environmental", "other"];
const SEVERITIES    = ["mild", "moderate", "severe"];
const SEV_COLOR: Record<string, string> = { mild:"#F5B829", moderate:"#E8694A", severe:"#DC2626" };

const COMMON_VACCINES = [
  "BCG", "OPV (Polio)", "Hepatitis B", "DPT", "Hib", "Rotavirus",
  "PCV (Pneumococcal)", "IPV", "MMR", "Varicella (Chickenpox)",
  "Hepatitis A", "Typhoid", "Influenza (Flu)",
];

// ── Small UI helpers ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:"20px" }}>
      <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"10px", paddingBottom:"6px", borderBottom:"1px solid #EDE8DF" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ marginBottom:"10px" }}>
      <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:"100%", border:"1px solid #EDE8DF", borderRadius:"10px", padding:"8px 12px", fontSize:"13px", color:"#1A2F4A", background:"white", outline:"none", boxSizing:"border-box" as const }}
      />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function ChildMedicalTab({
  enquiryId, childName, updatedBy = "parent", readOnly = false,
}: {
  enquiryId: string; childName?: string; updatedBy?: string; readOnly?: boolean;
}) {
  const [record, setRecord]   = useState<MedicalRecord>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!enquiryId) return;
    setLoading(true);
    fetch(`/api/medical?enquiryId=${enquiryId}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.enquiry_id) {
          setRecord({
            blood_group:        d.blood_group        || "",
            allergies:          d.allergies          || [],
            vaccinations:       d.vaccinations       || [],
            emergency_contacts: d.emergency_contacts || [],
            medical_conditions: d.medical_conditions || "",
            special_needs:      d.special_needs      || "",
            doctor_name:        d.doctor_name        || "",
            doctor_phone:       d.doctor_phone       || "",
            insurance_provider: d.insurance_provider || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [enquiryId]);

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/medical", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enquiryId,
        childName:          childName || "",
        bloodGroup:         record.blood_group,
        allergies:          record.allergies,
        vaccinations:       record.vaccinations,
        emergencyContacts:  record.emergency_contacts,
        medicalConditions:  record.medical_conditions,
        specialNeeds:       record.special_needs,
        doctorName:         record.doctor_name,
        doctorPhone:        record.doctor_phone,
        insuranceProvider:  record.insurance_provider,
        updatedBy,
      }),
    });
    const data = await res.json();
    if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError(data.error || "Failed to save.");
    setSaving(false);
  };

  // ── Allergy helpers ──
  const addAllergy = () => setRecord(r => ({ ...r, allergies: [...r.allergies, { type:"food", name:"", severity:"mild" }] }));
  const updateAllergy = (i: number, k: keyof Allergy, v: string) =>
    setRecord(r => { const a = [...r.allergies]; a[i] = { ...a[i], [k]: v }; return { ...r, allergies: a }; });
  const removeAllergy = (i: number) => setRecord(r => ({ ...r, allergies: r.allergies.filter((_, x) => x !== i) }));

  // ── Vaccination helpers ──
  const addVaccine = () => setRecord(r => ({ ...r, vaccinations: [...r.vaccinations, { name:"", date:"", next_due:"", completed:false }] }));
  const updateVaccine = (i: number, k: keyof Vaccination, v: string | boolean) =>
    setRecord(r => { const a = [...r.vaccinations]; a[i] = { ...a[i], [k]: v }; return { ...r, vaccinations: a }; });
  const removeVaccine = (i: number) => setRecord(r => ({ ...r, vaccinations: r.vaccinations.filter((_, x) => x !== i) }));

  // ── Emergency contact helpers ──
  const addContact = () => setRecord(r => ({ ...r, emergency_contacts: [...r.emergency_contacts, { name:"", relation:"", phone:"" }] }));
  const updateContact = (i: number, k: keyof EmergencyContact, v: string) =>
    setRecord(r => { const a = [...r.emergency_contacts]; a[i] = { ...a[i], [k]: v }; return { ...r, emergency_contacts: a }; });
  const removeContact = (i: number) => setRecord(r => ({ ...r, emergency_contacts: r.emergency_contacts.filter((_, x) => x !== i) }));

  if (loading) return (
    <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99" }}>
      <div style={{ width:"32px", height:"32px", border:"3px solid #EDE8DF", borderTopColor:"#178F78", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
      Loading medical records…
    </div>
  );

  const inputStyle = { width:"100%", border:"1px solid #EDE8DF", borderRadius:"10px", padding:"8px 12px", fontSize:"13px", color:"#1A2F4A", background: readOnly ? "#FAF0E8" : "white", outline:"none", boxSizing:"border-box" as const };
  const selectStyle = { ...inputStyle, cursor: readOnly ? "default" : "pointer" };

  return (
    <div>
      {/* ── Blood Group ── */}
      <Section title="Basic Health Info">
        <div style={{ marginBottom:"10px" }}>
          <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Blood Group</label>
          {readOnly ? (
            <div style={{ ...inputStyle }}>
              {record.blood_group ? <span style={{ fontWeight:700, fontSize:"15px", color:"#DC2626" }}>{record.blood_group}</span> : <span style={{ color:"#9CA3AF" }}>Not recorded</span>}
            </div>
          ) : (
            <select value={record.blood_group} onChange={e => setRecord(r => ({ ...r, blood_group: e.target.value }))} style={selectStyle}>
              {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g || "— Select —"}</option>)}
            </select>
          )}
        </div>

        <div style={{ marginBottom:"10px" }}>
          <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Medical Conditions / Chronic Illness</label>
          <textarea value={record.medical_conditions} readOnly={readOnly}
            onChange={e => setRecord(r => ({ ...r, medical_conditions: e.target.value }))}
            placeholder="E.g. Asthma, epilepsy, diabetes… or leave blank if none"
            rows={2}
            style={{ ...inputStyle, resize:"vertical" as const }}
          />
        </div>

        <div>
          <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Special Needs / Dietary Requirements</label>
          <textarea value={record.special_needs} readOnly={readOnly}
            onChange={e => setRecord(r => ({ ...r, special_needs: e.target.value }))}
            placeholder="E.g. Vegetarian, gluten-free, wheelchair user… or leave blank if none"
            rows={2}
            style={{ ...inputStyle, resize:"vertical" as const }}
          />
        </div>
      </Section>

      {/* ── Allergies ── */}
      <Section title={`Allergies${record.allergies.length > 0 ? ` (${record.allergies.length})` : ""}`}>
        {record.allergies.length === 0 && (
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginBottom:readOnly ? 0 : "10px" }}>
            {readOnly ? "No allergies recorded." : "No allergies added yet."}
          </div>
        )}
        {record.allergies.map((a, i) => (
          <div key={i} style={{ border:"1px solid #EDE8DF", borderRadius:"12px", padding:"12px", marginBottom:"8px", background:"rgba(220,38,38,0.02)", position:"relative" }}>
            {!readOnly && (
              <button onClick={() => removeAllergy(i)} style={{ position:"absolute", top:"8px", right:"10px", background:"none", border:"none", fontSize:"16px", cursor:"pointer", color:"#9CA3AF", lineHeight:1 }}>×</button>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr 1fr", gap:"8px", paddingRight: readOnly ? 0 : "24px" }}>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Type</label>
                {readOnly ? (
                  <span style={{ fontSize:"12px", fontWeight:600, color:"#1A2F4A", textTransform:"capitalize" }}>{a.type}</span>
                ) : (
                  <select value={a.type} onChange={e => updateAllergy(i, "type", e.target.value)} style={{ ...selectStyle, fontSize:"12px", padding:"6px 8px" }}>
                    {ALLERGY_TYPES.map(t => <option key={t} value={t} style={{ textTransform:"capitalize" }}>{t}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Name / Description</label>
                {readOnly ? (
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{a.name || "—"}</span>
                ) : (
                  <input value={a.name} onChange={e => updateAllergy(i, "name", e.target.value)} placeholder="e.g. Peanuts, Penicillin…" style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />
                )}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Severity</label>
                {readOnly ? (
                  <span style={{ fontSize:"11px", fontWeight:700, color:SEV_COLOR[a.severity] || "#6B7A99", background:`${SEV_COLOR[a.severity] || "#6B7A99"}18`, borderRadius:"20px", padding:"2px 8px", textTransform:"capitalize" }}>{a.severity}</span>
                ) : (
                  <select value={a.severity} onChange={e => updateAllergy(i, "severity", e.target.value)} style={{ ...selectStyle, fontSize:"12px", padding:"6px 8px" }}>
                    {SEVERITIES.map(s => <option key={s} value={s} style={{ textTransform:"capitalize" }}>{s}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
        {!readOnly && (
          <button onClick={addAllergy} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(220,38,38,0.07)", border:"1px dashed rgba(220,38,38,0.35)", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:600, color:"#DC2626", cursor:"pointer" }}>
            + Add Allergy
          </button>
        )}
      </Section>

      {/* ── Vaccinations ── */}
      <Section title={`Vaccination Records${record.vaccinations.length > 0 ? ` (${record.vaccinations.length})` : ""}`}>
        {record.vaccinations.length === 0 && (
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginBottom:readOnly ? 0 : "10px" }}>
            {readOnly ? "No vaccinations recorded." : "No vaccinations added yet."}
          </div>
        )}
        {record.vaccinations.map((v, i) => (
          <div key={i} style={{ border:"1px solid #EDE8DF", borderRadius:"12px", padding:"12px", marginBottom:"8px", background: v.completed ? "rgba(23,143,120,0.03)" : "rgba(245,184,41,0.04)", position:"relative" }}>
            {!readOnly && (
              <button onClick={() => removeVaccine(i)} style={{ position:"absolute", top:"8px", right:"10px", background:"none", border:"none", fontSize:"16px", cursor:"pointer", color:"#9CA3AF", lineHeight:1 }}>×</button>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"8px", paddingRight: readOnly ? 0 : "24px", marginBottom:"8px" }}>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Vaccine Name</label>
                {readOnly ? (
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{v.name || "—"}</span>
                ) : (
                  <input list={`vaccines-${i}`} value={v.name} onChange={e => updateVaccine(i, "name", e.target.value)} placeholder="Select or type…" style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />
                )}
                {!readOnly && (
                  <datalist id={`vaccines-${i}`}>
                    {COMMON_VACCINES.map(n => <option key={n} value={n} />)}
                  </datalist>
                )}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Date Given</label>
                {readOnly ? (
                  <span style={{ fontSize:"12px", color:"#1A2F4A" }}>{v.date ? new Date(v.date).toLocaleDateString("en-IN") : "—"}</span>
                ) : (
                  <input type="date" value={v.date} onChange={e => updateVaccine(i, "date", e.target.value)} style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />
                )}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Next Due</label>
                {readOnly ? (
                  <span style={{ fontSize:"12px", color: v.next_due && new Date(v.next_due) < new Date() ? "#DC2626" : "#1A2F4A" }}>{v.next_due ? new Date(v.next_due).toLocaleDateString("en-IN") : "—"}</span>
                ) : (
                  <input type="date" value={v.next_due} onChange={e => updateVaccine(i, "next_due", e.target.value)} style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />
                )}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              {readOnly ? (
                <span style={{ fontSize:"11px", fontWeight:700, background: v.completed ? "rgba(23,143,120,0.12)" : "rgba(245,184,41,0.15)", color: v.completed ? "#178F78" : "#B08000", borderRadius:"20px", padding:"2px 10px" }}>
                  {v.completed ? "✅ Completed" : "⏳ Pending"}
                </span>
              ) : (
                <label style={{ display:"flex", alignItems:"center", gap:"6px", cursor:"pointer", fontSize:"12px", color:"#1A2F4A", fontWeight:600 }}>
                  <input type="checkbox" checked={v.completed} onChange={e => updateVaccine(i, "completed", e.target.checked)}
                    style={{ width:"15px", height:"15px", accentColor:"#178F78" }} />
                  Completed
                </label>
              )}
            </div>
          </div>
        ))}
        {!readOnly && (
          <button onClick={addVaccine} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(23,143,120,0.07)", border:"1px dashed rgba(23,143,120,0.35)", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:600, color:"#178F78", cursor:"pointer" }}>
            + Add Vaccination
          </button>
        )}
      </Section>

      {/* ── Emergency Contacts ── */}
      <Section title={`Emergency Contacts${record.emergency_contacts.length > 0 ? ` (${record.emergency_contacts.length})` : ""}`}>
        {record.emergency_contacts.length === 0 && (
          <div style={{ fontSize:"12px", color:"#9CA3AF", marginBottom:readOnly ? 0 : "10px" }}>
            {readOnly ? "No emergency contacts recorded." : "Add contacts beyond the primary parent (e.g. grandparent, relative)."}
          </div>
        )}
        {record.emergency_contacts.map((c, i) => (
          <div key={i} style={{ border:"1px solid #EDE8DF", borderRadius:"12px", padding:"12px", marginBottom:"8px", position:"relative" }}>
            {!readOnly && (
              <button onClick={() => removeContact(i)} style={{ position:"absolute", top:"8px", right:"10px", background:"none", border:"none", fontSize:"16px", cursor:"pointer", color:"#9CA3AF", lineHeight:1 }}>×</button>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr", gap:"8px", paddingRight: readOnly ? 0 : "24px" }}>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Full Name</label>
                {readOnly ? <span style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{c.name || "—"}</span>
                  : <input value={c.name} onChange={e => updateContact(i, "name", e.target.value)} placeholder="Contact name" style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Relation</label>
                {readOnly ? <span style={{ fontSize:"12px", color:"#1A2F4A", textTransform:"capitalize" }}>{c.relation || "—"}</span>
                  : <input value={c.relation} onChange={e => updateContact(i, "relation", e.target.value)} placeholder="e.g. Grandparent" style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />}
              </div>
              <div>
                <label style={{ fontSize:"10px", color:"#6B7A99", display:"block", marginBottom:"3px" }}>Phone</label>
                {readOnly ? (
                  <a href={`tel:${c.phone}`} style={{ fontSize:"12px", fontWeight:700, color:"#178F78", textDecoration:"none" }}>{c.phone || "—"}</a>
                ) : (
                  <input type="tel" value={c.phone} onChange={e => updateContact(i, "phone", e.target.value)} placeholder="+91 XXXXX XXXXX" style={{ ...inputStyle, fontSize:"12px", padding:"6px 8px" }} />
                )}
              </div>
            </div>
          </div>
        ))}
        {!readOnly && (
          <button onClick={addContact} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(99,102,241,0.07)", border:"1px dashed rgba(99,102,241,0.35)", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:600, color:"#6366F1", cursor:"pointer" }}>
            + Add Emergency Contact
          </button>
        )}
      </Section>

      {/* ── Doctor & Insurance ── */}
      <Section title="Doctor & Insurance">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
          <div>
            <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Doctor / Paediatrician</label>
            {readOnly ? <div style={{ fontSize:"13px", color:"#1A2F4A", fontWeight:600 }}>{record.doctor_name || "—"}</div>
              : <input value={record.doctor_name} onChange={e => setRecord(r => ({ ...r, doctor_name: e.target.value }))} placeholder="Dr. Name" style={inputStyle} />}
          </div>
          <div>
            <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Doctor Phone</label>
            {readOnly ? (
              record.doctor_phone ? <a href={`tel:${record.doctor_phone}`} style={{ fontSize:"13px", color:"#178F78", fontWeight:600, textDecoration:"none" }}>{record.doctor_phone}</a> : <span style={{ color:"#9CA3AF", fontSize:"13px" }}>—</span>
            ) : (
              <input type="tel" value={record.doctor_phone} onChange={e => setRecord(r => ({ ...r, doctor_phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" style={inputStyle} />
            )}
          </div>
        </div>
        <div>
          <label style={{ fontSize:"11px", fontWeight:600, color:"#6B7A99", display:"block", marginBottom:"4px" }}>Health Insurance Provider (optional)</label>
          {readOnly ? <div style={{ fontSize:"13px", color:"#1A2F4A" }}>{record.insurance_provider || "—"}</div>
            : <input value={record.insurance_provider} onChange={e => setRecord(r => ({ ...r, insurance_provider: e.target.value }))} placeholder="e.g. Star Health, ICICI Lombard…" style={inputStyle} />}
        </div>
      </Section>

      {/* ── Save Button ── */}
      {!readOnly && (
        <div style={{ marginTop:"4px" }}>
          {error && (
            <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"10px", padding:"9px 12px", fontSize:"12px", color:"#DC2626", marginBottom:"10px" }}>
              ⚠️ {error}
            </div>
          )}
          {saved && (
            <div style={{ background:"rgba(23,143,120,0.08)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"10px", padding:"9px 12px", fontSize:"12px", color:"#178F78", marginBottom:"10px" }}>
              ✅ Medical record saved successfully!
            </div>
          )}
          <button
            onClick={save}
            disabled={saving}
            style={{ width:"100%", background: saving ? "#b2dfdb" : "#178F78", color:"white", border:"none", borderRadius:"14px", padding:"13px", fontSize:"14px", fontWeight:700, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 14px rgba(23,143,120,0.35)", transition:"all 0.2s" }}>
            {saving ? "Saving…" : "💾 Save Medical Record"}
          </button>
          <div style={{ fontSize:"10px", color:"#9CA3AF", textAlign:"center", marginTop:"8px" }}>
            🔒 This information is confidential and visible only to school staff.
          </div>
        </div>
      )}
    </div>
  );
}
