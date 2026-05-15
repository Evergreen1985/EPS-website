"use client";
/**
 * SCHOOL SETTINGS TAB
 * Place in src/components/SchoolSettingsTab.tsx
 *
 * Add to admin/page.tsx:
 *   import SchoolSettingsTab from "@/components/SchoolSettingsTab";
 *   {tab === "settings" && <SchoolSettingsTab />}
 *
 * Add "Settings" to the admin tab bar.
 */

import { useState, useEffect } from "react";

const inp: React.CSSProperties = {
  border: "1px solid #EDE8DF", borderRadius: "10px", padding: "9px 13px",
  fontSize: "13px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box",
};

const label: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#6B7A99",
  display: "block", marginBottom: "5px", letterSpacing: "0.4px",
};

const card: React.CSSProperties = {
  background: "white", borderRadius: "16px",
  border: "1px solid #EDE8DF", padding: "20px", marginBottom: "16px",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Fredoka', sans-serif", fontSize: "16px",
  fontWeight: 700, color: "#1A2F4A", marginBottom: "16px",
};

type Settings = {
  school_name: string;
  trust_name:  string;
  address:     string;
  phone:       string;
  email:       string;
  pan_number:  string;
  gst_number:  string;
  logo_url:    string;
};

const BLANK: Settings = {
  school_name: "", trust_name: "", address: "",
  phone: "", email: "", pan_number: "", gst_number: "", logo_url: "/logo.png",
};

export default function SchoolSettingsTab() {
  const [form, setForm]       = useState<Settings>(BLANK);
  const [original, setOriginal] = useState<Settings>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const s: Settings = {
          school_name: d.school_name || "",
          trust_name:  d.trust_name  || "",
          address:     d.address     || "",
          phone:       d.phone       || "",
          email:       d.email       || "",
          pan_number:  d.pan_number  || "",
          gst_number:  d.gst_number  || "",
          logo_url:    d.logo_url    || "/logo.png",
        };
        setForm(s);
        setOriginal(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const res  = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setOriginal(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#6B7A99" }}>Loading settings…</div>;

  return (
    <div style={{ maxWidth: "720px" }}>

      {/* ── School Info ── */}
      <div style={card}>
        <div style={sectionTitle}>🏫 School Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>SCHOOL NAME</label>
            <input style={inp} value={form.school_name} onChange={set("school_name")} placeholder="Evergreen Preschool & Daycare" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>TRUST / ORGANISATION NAME</label>
            <input style={inp} value={form.trust_name} onChange={set("trust_name")} placeholder="Jerrys Educational Trust" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>ADDRESS</label>
            <textarea style={{ ...inp, minHeight: "64px", resize: "vertical" }}
              value={form.address} onChange={set("address")}
              placeholder="1427, 13th Cross, Ananthnagar Phase-2, Bangalore - 560100" />
          </div>
          <div>
            <label style={label}>PHONE</label>
            <input style={inp} value={form.phone} onChange={set("phone")} placeholder="+91 7411574504" />
          </div>
          <div>
            <label style={label}>EMAIL</label>
            <input style={inp} value={form.email} onChange={set("email")} placeholder="info@evergreenprepschools.com" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={label}>LOGO PATH</label>
            <input style={inp} value={form.logo_url} onChange={set("logo_url")} placeholder="/logo.png" />
            <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
              Relative path from /public folder or full URL. Logo appears on all receipts.
            </div>
          </div>
        </div>
      </div>

      {/* ── Tax / Legal ── */}
      <div style={card}>
        <div style={sectionTitle}>🧾 Tax & Legal Details</div>
        <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "16px", background: "#FAF0E8", borderRadius: "10px", padding: "10px 14px" }}>
          Leave a field blank to <strong>hide it from receipts</strong>. For example, if GST is not applicable, clear the GST number and it won't appear on any invoice.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <label style={label}>PAN NUMBER <span style={{ color: "#9CA3AF", fontWeight: 400 }}>— blank to hide</span></label>
            <input style={inp} value={form.pan_number} onChange={set("pan_number")}
              placeholder="e.g. AADTJ3659H"
              maxLength={10} />
            {form.pan_number && (
              <div style={{ fontSize: "11px", color: "#178F78", marginTop: "4px" }}>✓ Will appear on receipts</div>
            )}
            {!form.pan_number && (
              <div style={{ fontSize: "11px", color: "#E8694A", marginTop: "4px" }}>✗ Hidden from receipts</div>
            )}
          </div>
          <div>
            <label style={label}>GST NUMBER <span style={{ color: "#9CA3AF", fontWeight: 400 }}>— blank to hide</span></label>
            <input style={inp} value={form.gst_number} onChange={set("gst_number")}
              placeholder="e.g. 29AADTJ3659H1ZR"
              maxLength={15} />
            {form.gst_number && (
              <div style={{ fontSize: "11px", color: "#178F78", marginTop: "4px" }}>✓ Will appear on GST invoices</div>
            )}
            {!form.gst_number && (
              <div style={{ fontSize: "11px", color: "#E8694A", marginTop: "4px" }}>✗ GST invoices will show without GSTIN</div>
            )}
          </div>
        </div>

        {/* Receipt preview strip */}
        <div style={{ marginTop: "16px", background: "#F0FAF7", borderRadius: "10px", padding: "12px 16px", fontSize: "12px", borderLeft: "3px solid #178F78" }}>
          <div style={{ fontWeight: 700, color: "#178F78", marginBottom: "6px" }}>Receipt header preview:</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>{form.school_name || "School Name"}</div>
          {(form.trust_name || form.pan_number) && (
            <div style={{ color: "#555" }}>
              {form.trust_name && `(${form.trust_name})`}
              {form.trust_name && form.pan_number && "  "}
              {form.pan_number && `PAN : ${form.pan_number}`}
            </div>
          )}
          {form.gst_number && <div style={{ color: "#555" }}>GSTIN: {form.gst_number}</div>}
          {form.address && <div style={{ color: "#777", fontSize: "11px" }}>{form.address}</div>}
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={save} disabled={!isDirty || saving}
          style={{ background: !isDirty || saving ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px 28px", fontSize: "13px", fontWeight: 700, cursor: !isDirty || saving ? "not-allowed" : "pointer", fontFamily: "'Quicksand', sans-serif", boxShadow: isDirty ? "0 4px 14px rgba(23,143,120,0.3)" : "none" }}>
          {saving ? "Saving…" : "💾 Save Settings"}
        </button>
        {saved && <span style={{ color: "#178F78", fontWeight: 700, fontSize: "13px" }}>✓ Saved successfully!</span>}
        {isDirty && !saving && <span style={{ color: "#E8694A", fontSize: "12px" }}>Unsaved changes</span>}
      </div>
    </div>
  );
}
