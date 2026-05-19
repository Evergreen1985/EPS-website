"use client";
import { useState, useEffect } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STATUS_COLOR: Record<string,string> = { draft:"#6B7A99", approved:"#F5B829", paid:"#178F78" };
const PAYMENT_MODES = ["bank_transfer","cash","cheque","upi"];

interface Payroll {
  id: string;
  staff_id: string;
  staff_name: string;
  month: number;
  year: number;
  basic_pay: number;
  hra: number;
  transport_allowance: number;
  other_allowances: number;
  pf_deduction: number;
  other_deductions: number;
  net_pay: number;
  status: string;
  payment_date: string | null;
  payment_mode: string;
  notes: string;
}

interface Staff { id: string; name: string; role: string; salary?: number; }

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };

export default function PayrollTab() {
  const now = new Date();
  const [month, setMonth]       = useState(now.getMonth() + 1);
  const [year,  setYear]        = useState(now.getFullYear());
  const [staff, setStaff]       = useState<Staff[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState<Record<string,string>>({});
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");

  useEffect(() => {
    fetch("/api/staff").then(r => r.json()).then(d => setStaff(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    fetch(`/api/payroll?month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => setPayrolls(Array.isArray(d) ? d : []))
      .catch(() => setPayrolls([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month, year]);

  const openEdit = (s: Staff) => {
    const existing = payrolls.find(p => p.staff_id === s.id);
    setForm(existing ? {
      id:                  existing.id,
      staffId:             s.id,
      staffName:           s.name,
      basicPay:            String(existing.basic_pay),
      hra:                 String(existing.hra),
      transportAllowance:  String(existing.transport_allowance),
      otherAllowances:     String(existing.other_allowances),
      pfDeduction:         String(existing.pf_deduction),
      otherDeductions:     String(existing.other_deductions),
      notes:               existing.notes,
      status:              existing.status,
      paymentMode:         existing.payment_mode,
      paymentDate:         existing.payment_date || "",
    } : {
      staffId:   s.id,
      staffName: s.name,
      basicPay:  String(s.salary || ""),
      hra: "0", transportAllowance: "0", otherAllowances: "0",
      pfDeduction: "0", otherDeductions: "0",
      notes: "", status: "draft", paymentMode: "bank_transfer", paymentDate: "",
    });
    setEditing(s.id);
    setMsg("");
  };

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/payroll", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month, year }),
    });
    const d = await res.json();
    if (d.success) { setEditing(null); setMsg(""); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const markPaid = async (p: Payroll) => {
    await fetch("/api/payroll", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, status: "paid", paymentDate: new Date().toISOString().split("T")[0], paymentMode: p.payment_mode }),
    });
    load();
  };

  const net = () => {
    const b = parseFloat(form.basicPay || "0") + parseFloat(form.hra || "0") + parseFloat(form.transportAllowance || "0") + parseFloat(form.otherAllowances || "0");
    const d = parseFloat(form.pfDeduction || "0") + parseFloat(form.otherDeductions || "0");
    return (b - d).toFixed(2);
  };

  const staffWithPayroll = staff.map(s => ({ ...s, payroll: payrolls.find(p => p.staff_id === s.id) }));

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>💰 Staff Payroll</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{staff.length} staff members</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ ...inp, width: "140px" }}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...inp, width: "90px" }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      {payrolls.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px", marginBottom: "20px" }}>
          {[
            { label: "Total Net Pay", val: `₹${payrolls.reduce((s,p) => s + p.net_pay, 0).toLocaleString()}`, color: "#178F78" },
            { label: "Paid",          val: payrolls.filter(p => p.status === "paid").length,    color: "#178F78" },
            { label: "Approved",      val: payrolls.filter(p => p.status === "approved").length, color: "#F5B829" },
            { label: "Draft",         val: payrolls.filter(p => p.status === "draft").length,    color: "#6B7A99" },
          ].map(c => (
            <div key={c.label} style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ fontSize: "11px", color: "#6B7A99", fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: c.color }}>{c.val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Staff rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {staffWithPayroll.map(s => {
          const p = s.payroll;
          const isEditing = editing === s.id;
          return (
            <div key={s.id} style={{ border: "1px solid #EDE8DF", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(23,143,120,0.15),rgba(99,102,241,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>👤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{s.name}</div>
                  <div style={{ fontSize: "11px", color: "#6B7A99" }}>{s.role}</div>
                </div>
                {p ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "#1A2F4A" }}>₹{p.net_pay.toLocaleString()}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ background: STATUS_COLOR[p.status] + "22", color: STATUS_COLOR[p.status], borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{p.status.toUpperCase()}</span>
                      </div>
                    </div>
                    {p.status !== "paid" && (
                      <button onClick={() => markPaid(p)}
                        style={{ background: "rgba(23,143,120,0.1)", border: "1px solid rgba(23,143,120,0.3)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>
                        Mark Paid
                      </button>
                    )}
                    <button onClick={() => openEdit(s)}
                      style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", color: "#6B7A99", cursor: "pointer" }}>
                      Edit
                    </button>
                  </div>
                ) : (
                  <button onClick={() => openEdit(s)}
                    style={{ background: "rgba(23,143,120,0.07)", border: "1px dashed rgba(23,143,120,0.35)", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>
                    + Add Payroll
                  </button>
                )}
              </div>

              {isEditing && (
                <div style={{ borderTop: "1px solid #EDE8DF", padding: "16px", background: "#FEFCF8" }}>
                  {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "12px" }}>
                    {[
                      { key: "basicPay", label: "Basic Pay (₹)" },
                      { key: "hra", label: "HRA (₹)" },
                      { key: "transportAllowance", label: "Transport Allow. (₹)" },
                      { key: "otherAllowances", label: "Other Allow. (₹)" },
                      { key: "pfDeduction", label: "PF Deduction (₹)" },
                      { key: "otherDeductions", label: "Other Deductions (₹)" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={lbl}>{f.label}</label>
                        <input type="number" value={form[f.key] || "0"} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))} style={inp} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={lbl}>Status</label>
                      <select value={form.status} onChange={e => setForm(x => ({ ...x, status: e.target.value }))} style={inp}>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Payment Mode</label>
                      <select value={form.paymentMode} onChange={e => setForm(x => ({ ...x, paymentMode: e.target.value }))} style={inp}>
                        {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace("_"," ")}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Payment Date</label>
                      <input type="date" value={form.paymentDate || ""} onChange={e => setForm(x => ({ ...x, paymentDate: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ background: "rgba(23,143,120,0.07)", border: "1px solid rgba(23,143,120,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#178F78" }}>Net Pay</span>
                    <span style={{ fontWeight: 700, fontSize: "20px", color: "#178F78" }}>₹{parseFloat(net()).toLocaleString()}</span>
                  </div>
                  <div>
                    <label style={lbl}>Notes</label>
                    <input value={form.notes || ""} onChange={e => setForm(x => ({ ...x, notes: e.target.value }))} placeholder="Optional notes…" style={{ ...inp, marginBottom: "12px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={save} disabled={saving}
                      style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? "Saving…" : "✅ Save Payroll"}
                    </button>
                    <button onClick={() => { setEditing(null); setMsg(""); }}
                      style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!loading && staffWithPayroll.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
            No staff found. Add staff in the Staff tab first.
          </div>
        )}
      </div>
    </div>
  );
}
