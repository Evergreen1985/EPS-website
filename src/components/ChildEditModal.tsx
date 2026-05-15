"use client";
/**
 * CHILD EDIT MODAL
 * src/components/ChildEditModal.tsx
 */

import { useState } from "react";
import DocumentOCR from "@/components/DocumentOCR";

const inp: React.CSSProperties = {
  border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px",
  fontSize: "13px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#6B7A99",
  display: "block", marginBottom: "4px", letterSpacing: "0.4px",
};

const section: React.CSSProperties = {
  fontFamily: "'Fredoka', sans-serif", fontSize: "14px",
  fontWeight: 700, color: "#178F78", margin: "16px 0 10px",
  paddingBottom: "6px", borderBottom: "1px solid #EDE8DF",
};

interface Props {
  enquiry:  any;
  onClose:  () => void;
  onSaved:  () => void;
}

export default function ChildEditModal({ enquiry, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    child_name:        enquiry.child_name        || "",
    child_dob:         enquiry.child_dob         || "",   // ← correct column name
    blood_group:       enquiry.blood_group        || "",
    allergies:         enquiry.allergies          || "",
    program_label:     enquiry.program_label      || "",
    status:            enquiry.status             || "new",
    father_name:       enquiry.father_name        || "",
    father_phone:      enquiry.father_phone       || "",  // ← new
    mother_name:       enquiry.mother_name        || "",
    mother_phone:      enquiry.mother_phone       || "",  // ← new
    guardian_phone:    enquiry.guardian_phone     || "",  // ← new (optional)
    email:             enquiry.email              || "",
    address:           enquiry.address            || "",
    emergency_contact: enquiry.emergency_contact  || "",
    notes:             enquiry.notes              || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    // Basic validation
    if (!form.father_phone && !form.mother_phone) {
      setError("At least Father's or Mother's phone is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res  = await fetch("/api/enquiries/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: enquiry.id, ...form }),
      });
      const data = await res.json();
      if (data.success) onSaved();
      else setError(data.error || "Failed to save");
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div style={{ background: "white", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>
            ✏️ Edit Child Profile
          </div>
          <button onClick={onClose} style={{ background: "#EDE8DF", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", color: "#6B7A99" }}>✕ Close</button>
        </div>
        <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "4px" }}>ID: {enquiry.id}</div>

        {/* ── OCR Auto-fill ── */}
        <DocumentOCR onExtracted={fields => setForm(p => ({ ...p, ...fields }))} />

        {/* ── Child Details ── */}
        <div style={section}>👶 Child Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>CHILD FULL NAME *</label>
            <input style={inp} value={form.child_name} onChange={set("child_name")} />
          </div>
          <div>
            <label style={lbl}>DATE OF BIRTH</label>
            <input type="date" style={inp} value={form.child_dob} onChange={set("child_dob")} />
          </div>
          <div>
            <label style={lbl}>BLOOD GROUP</label>
            <select style={inp} value={form.blood_group} onChange={set("blood_group")}>
              <option value="">— Unknown —</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>PROGRAMME / CLASS</label>
            <input style={inp} value={form.program_label} onChange={set("program_label")} placeholder="e.g. Nursery, Day Care" />
          </div>
          <div>
            <label style={lbl}>ENROLMENT STATUS</label>
            <select style={inp} value={form.status} onChange={set("status")}>
              <option value="new">New Enquiry</option>
              <option value="called">Called</option>
              <option value="visited">Visited</option>
              <option value="enrolled">Enrolled</option>
              <option value="not-interested">Not Interested</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>ALLERGIES / MEDICAL NOTES</label>
            <input style={inp} value={form.allergies} onChange={set("allergies")} placeholder="e.g. Peanut allergy, asthma inhaler" />
          </div>
        </div>

        {/* ── Parent Details ── */}
        <div style={section}>👨‍👩‍👧 Parent / Guardian Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

          {/* Father */}
          <div>
            <label style={lbl}>FATHER'S NAME</label>
            <input style={inp} value={form.father_name} onChange={set("father_name")} placeholder="Full name" />
          </div>
          <div>
            <label style={lbl}>
              FATHER'S PHONE <span style={{ color: "#E8694A" }}>*</span>
            </label>
            <input style={inp} value={form.father_phone} onChange={set("father_phone")} placeholder="+91 XXXXXXXXXX" type="tel" />
          </div>

          {/* Mother */}
          <div>
            <label style={lbl}>MOTHER'S NAME</label>
            <input style={inp} value={form.mother_name} onChange={set("mother_name")} placeholder="Full name" />
          </div>
          <div>
            <label style={lbl}>
              MOTHER'S PHONE <span style={{ color: "#E8694A" }}>*</span>
            </label>
            <input style={inp} value={form.mother_phone} onChange={set("mother_phone")} placeholder="+91 XXXXXXXXXX" type="tel" />
          </div>

          {/* Guardian */}
          <div>
            <label style={lbl}>GUARDIAN PHONE <span style={{ color: "#9CA3AF", fontWeight: 400 }}>— optional</span></label>
            <input style={inp} value={form.guardian_phone} onChange={set("guardian_phone")} placeholder="+91 XXXXXXXXXX" type="tel" />
          </div>

          {/* Email */}
          <div>
            <label style={lbl}>EMAIL</label>
            <input style={inp} value={form.email} onChange={set("email")} placeholder="parent@email.com" type="email" />
          </div>

          {/* Address */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>HOME ADDRESS</label>
            <textarea style={{ ...inp, minHeight: "56px", resize: "vertical" }}
              value={form.address} onChange={set("address")} placeholder="Full address" />
          </div>

          {/* Emergency */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lbl}>EMERGENCY CONTACT <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(if different from above)</span></label>
            <input style={inp} value={form.emergency_contact} onChange={set("emergency_contact")} placeholder="e.g. Grandma Lakshmi — 98XXXXXXXX" />
          </div>
        </div>

        {/* ── Notes ── */}
        <div style={section}>📝 Admin Notes</div>
        <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }}
          value={form.notes} onChange={set("notes")} placeholder="Internal notes (not visible to parents)" />

        {error && (
          <div style={{ color: "#DC2626", fontSize: "12px", marginTop: "10px", background: "rgba(220,38,38,0.08)", borderRadius: "8px", padding: "8px 12px", fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={save} disabled={saving || !form.child_name}
            style={{ flex: 1, background: saving || !form.child_name ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: saving || !form.child_name ? "not-allowed" : "pointer", fontFamily: "'Quicksand', sans-serif", boxShadow: "0 4px 14px rgba(23,143,120,0.3)" }}>
            {saving ? "Saving…" : "💾 Save Profile"}
          </button>
          <button onClick={onClose}
            style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "12px", padding: "12px 18px", fontSize: "13px", cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
