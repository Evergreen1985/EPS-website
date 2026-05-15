"use client";
/**
 * COMPLETE FEES TAB — replace the entire {tab === "fees"} block
 * in src/app/admin/page.tsx with this component.
 *
 * Usage in admin/page.tsx:
 *   1. Import at top: import FeesTab from "@/components/FeesTab";
 *   2. Replace the {tab === "fees" && (...)} block with:
 *      {tab === "fees" && <FeesTab enquiries={enquiries} />}
 *
 * CHANGES IN THIS VERSION:
 *   - School logo + proper header in receipt (matches PDF sample)
 *   - Parent name (Paid by) field in payment modal
 *   - Amount in words on receipt
 *   - Receipt Generator sub-tab (standalone, no DB record needed)
 *   - GST Invoice option for daycare
 */

import { useState, useEffect, useCallback } from "react";

// ─── Utility: number to Indian words ────────────────────────────────────────
function numberToWords(num: number): string {
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function h(n: number): string {
    if (!n) return "";
    let r = "";
    if (n >= 100) { r += ones[Math.floor(n / 100)] + " Hundred "; n %= 100; }
    if (n >= 20)  { r += tens[Math.floor(n / 10)] + " "; n %= 10; }
    if (n > 0)    r += ones[n] + " ";
    return r;
  }
  if (!num) return "Zero Only";
  let r = "";
  if (num >= 100000) { r += h(Math.floor(num / 100000)) + "Lakh "; num %= 100000; }
  if (num >= 1000)   { r += h(Math.floor(num / 1000))   + "Thousand "; num %= 1000; }
  r += h(num);
  return r.trim() + " Only";
}

// ─── Receipt HTML (matches the PDF sample exactly) ───────────────────────────
function buildReceiptHTML(fee: any, settings: any = {}): string {
  const amt    = Number(fee.paid_amount || fee.amount || 0);
  const words  = numberToWords(Math.round(amt));
  const paidBy = fee.paid_by_name
    ? `${fee.paid_by_name.toUpperCase()} (${fee.paid_by_relation || "Parent"})`
    : fee.received_by || "—";
  const dateStr = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const schoolName = settings.school_name || "Evergreen Preschool & Daycare";
  const trustName  = settings.trust_name  || "Jerrys Educational Trust";
  const address    = settings.address     || "1427, 13th Cross, Ananthnagar Phase-2, Bangalore - 560100";
  const phone      = settings.phone       || "+91 7411574504";
  const email      = settings.email       || "jerryseducationaltrust@gmail.com";
  const logoUrl    = settings.logo_url    || "/logo.png";
  const pan        = settings.pan_number  || "";   // empty = don't show
  const panLine    = pan
    ? `<div class="school-sub">(${trustName}) &nbsp;&nbsp; PAN : ${pan}</div>`
    : `<div class="school-sub">(${trustName})</div>`;

  return `<!DOCTYPE html><html><head><title>Fee Receipt</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 32px; max-width: 640px; margin: auto; }
  .hdr { display: flex; align-items: flex-start; gap: 18px; padding-bottom: 14px; border-bottom: 1px solid #ccc; }
  .hdr img { width: 88px; height: 88px; object-fit: contain; }
  .school-name { font-size: 22px; font-weight: bold; color: #178F78; line-height: 1.2; }
  .school-sub { font-size: 12px; color: #555; margin-top: 3px; line-height: 1.5; }
  .title-row { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 10px; }
  .title-row h2 { font-size: 15px; font-weight: bold; letter-spacing: 1px; }
  .date-txt { font-size: 12px; color: #444; }
  .info-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
  .info-table td { padding: 4px 6px; font-size: 13px; vertical-align: top; }
  .info-table td:first-child { color: #666; width: 160px; white-space: nowrap; }
  .info-table td:last-child { font-weight: 600; color: #111; }
  .sec-hdr { background: #f0f0f0; font-weight: bold; font-size: 12px; padding: 5px 8px; margin: 10px 0 6px; letter-spacing: 0.5px; }
  .for-school { text-align: right; margin-top: 36px; font-size: 12px; color: #444; }
  .note { text-align: center; margin-top: 40px; padding-top: 12px; border-top: 1px solid #eee; font-size: 11px; color: #888; }
  @media print { body { padding: 18px; } button { display: none !important; } }
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="${schoolName}" onerror="this.style.display='none'" />
  <div>
    <div class="school-name">${schoolName}</div>
    ${panLine}
    <div class="school-sub">${address}</div>
    <div class="school-sub">${email} &nbsp;&nbsp; ${phone}</div>
  </div>
</div>
<div class="title-row">
  <h2>Fee Receipt</h2>
  <div class="date-txt">Date: ${dateStr(fee.payment_date)}</div>
</div>
<table class="info-table">
  <tr><td>Child Name</td><td>${(fee.child_name || "").toUpperCase()}</td></tr>
  <tr><td>Program</td><td>${fee.programme || fee.program_label || "—"}</td></tr>
  <tr><td>Bill ID</td><td>${fee.receipt_number || fee.id || "—"}</td></tr>
  <tr><td>Payment Status</td><td>Paid</td></tr>
</table>
<div class="sec-hdr">Fee Details</div>
<table class="info-table">
  <tr><td>${fee.period_label || fee.description || "Fee"} (INR)</td><td>${amt.toLocaleString("en-IN")}</td></tr>
  <tr><td>Due Date</td><td>${dateStr(fee.due_date)}</td></tr>
  ${fee.discount_amount && Number(fee.discount_amount) > 0
    ? `<tr><td>Discount</td><td>₹${Number(fee.discount_amount).toLocaleString("en-IN")}${fee.discount_reason ? " — " + fee.discount_reason : ""}</td></tr>`
    : ""}
</table>
<div class="sec-hdr">Payment Details</div>
<table class="info-table">
  <tr><td>Payment Date</td><td>${dateStr(fee.payment_date)}</td></tr>
  <tr><td>Amount Paid</td><td>${amt.toLocaleString("en-IN")} (Rupees ${words})</td></tr>
  <tr><td>Payment Mode</td><td>${(fee.payment_mode || "Online").toUpperCase()}</td></tr>
  <tr><td>Paid by</td><td>${paidBy}</td></tr>
  <tr><td>Receipt No</td><td>${fee.receipt_number || "—"}</td></tr>
  ${fee.reference_number ? `<tr><td>Reference No</td><td>${fee.reference_number}</td></tr>` : ""}
</table>
<div class="for-school">For Evergreen Preschool and Daycare</div>
<div class="note">Note: It is a system generated receipt, signature is not required</div>
<div style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="background:#178F78;color:white;border:none;border-radius:8px;padding:10px 28px;font-size:14px;cursor:pointer;font-family:Arial,sans-serif">🖨️ Print</button>
</div>
</body></html>`;
}

// ─── GST Invoice HTML ────────────────────────────────────────────────────────
function buildGSTInvoiceHTML(fee: any, settings: any = {}): string {
  const taxable = Number(fee.paid_amount || fee.amount || 0);
  const cgst    = parseFloat((taxable * 0.09).toFixed(2));
  const sgst    = parseFloat((taxable * 0.09).toFixed(2));
  const total   = taxable + cgst + sgst - Number(fee.discount_amount || 0);
  const words   = numberToWords(Math.round(total));
  const paidBy  = fee.paid_by_name
    ? `${fee.paid_by_name.toUpperCase()} (${fee.paid_by_relation || "Parent"})`
    : "—";
  const dateStr = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const schoolName = settings.school_name || "Evergreen Preschool & Daycare";
  const trustName  = settings.trust_name  || "Jerrys Educational Trust";
  const address    = settings.address     || "1427, 13th Cross, Ananthnagar Phase-2, Bangalore - 560100";
  const phone      = settings.phone       || "+91 7411574504";
  const email      = settings.email       || "jerryseducationaltrust@gmail.com";
  const logoUrl    = settings.logo_url    || "/logo.png";
  const pan        = settings.pan_number  || "";
  const gst        = settings.gst_number  || "";

  // Build tax ID line — show only what exists
  const taxLine = [
    gst ? `GSTIN: <strong>${gst}</strong>` : "",
    pan ? `PAN: ${pan}` : "",
  ].filter(Boolean).join(" &nbsp;|&nbsp; ");

  return `<!DOCTYPE html><html><head><title>GST Invoice</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; padding: 32px; max-width: 660px; margin: auto; }
  .hdr { display: flex; align-items: flex-start; gap: 18px; padding-bottom: 14px; border-bottom: 2px solid #178F78; }
  .hdr img { width: 88px; height: 88px; object-fit: contain; }
  .school-name { font-size: 21px; font-weight: bold; color: #178F78; }
  .school-sub { font-size: 12px; color: #555; margin-top: 3px; line-height: 1.5; }
  .inv-title { display: flex; justify-content: space-between; align-items: center; margin: 16px 0 12px; }
  .inv-title h2 { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
  .two-col { display: flex; gap: 24px; margin-bottom: 14px; }
  .two-col > div { flex: 1; }
  .lbl { font-size: 11px; color: #666; margin-bottom: 2px; }
  table.items { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  table.items th { background: #178F78; color: white; padding: 7px 8px; text-align: left; }
  table.items td { padding: 7px 8px; border-bottom: 1px solid #eee; }
  .grand td { font-weight: bold; font-size: 14px; background: #e8f5f1; color: #178F78; }
  .words { font-size: 12px; color: #444; margin: 6px 0 14px; }
  .for-school { text-align: right; margin-top: 32px; font-size: 12px; }
  .note { text-align: center; padding-top: 12px; border-top: 1px solid #eee; margin-top: 40px; font-size: 11px; color: #888; }
  @media print { body { padding: 18px; } button { display: none !important; } }
</style></head><body>
<div class="hdr">
  <img src="${logoUrl}" alt="${schoolName}" onerror="this.style.display='none'" />
  <div>
    <div class="school-name">${schoolName}</div>
    <div class="school-sub">(${trustName})</div>
    ${taxLine ? `<div class="school-sub">${taxLine}</div>` : ""}
    <div class="school-sub">${address}</div>
    <div class="school-sub">${email} &nbsp; ${phone}</div>
  </div>
</div>
<div class="inv-title">
  <h2>TAX INVOICE</h2>
  <div style="text-align:right;font-size:12px">
    <div><strong>Invoice No:</strong> ${fee.receipt_number || "—"}</div>
    <div><strong>Date:</strong> ${dateStr(fee.payment_date)}</div>
  </div>
</div>
<div class="two-col">
  <div>
    <div class="lbl">Bill To</div>
    <div style="font-weight:700">${(fee.child_name || "").toUpperCase()}</div>
    <div>${paidBy}</div>
    <div class="lbl" style="margin-top:4px">Program: ${fee.programme || "Day Care"}</div>
  </div>
  <div>
    <div class="lbl">Payment Mode</div>
    <div style="font-weight:600">${(fee.payment_mode || "Online").toUpperCase()}</div>
    ${fee.reference_number ? `<div class="lbl">Ref: ${fee.reference_number}</div>` : ""}
  </div>
</div>
<table class="items">
  <thead><tr>
    <th>#</th><th>Description</th><th>SAC</th>
    <th style="text-align:right">Taxable (₹)</th>
    <th style="text-align:right">CGST 9%</th>
    <th style="text-align:right">SGST 9%</th>
    <th style="text-align:right">Total (₹)</th>
  </tr></thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>${fee.period_label || "Day Care Services"}</td>
      <td>999299</td>
      <td style="text-align:right">${taxable.toLocaleString("en-IN")}</td>
      <td style="text-align:right">${cgst.toLocaleString("en-IN")}</td>
      <td style="text-align:right">${sgst.toLocaleString("en-IN")}</td>
      <td style="text-align:right">${(taxable + cgst + sgst).toLocaleString("en-IN")}</td>
    </tr>
    ${fee.discount_amount && Number(fee.discount_amount) > 0
      ? `<tr><td colspan="6" style="text-align:right;color:#E8694A">Discount${fee.discount_reason ? " — " + fee.discount_reason : ""}</td><td style="text-align:right;color:#E8694A">- ${Number(fee.discount_amount).toLocaleString("en-IN")}</td></tr>`
      : ""}
    <tr class="grand">
      <td colspan="6" style="text-align:right">Grand Total</td>
      <td style="text-align:right">₹${total.toLocaleString("en-IN")}</td>
    </tr>
  </tbody>
</table>
<div class="words">Amount in words: <strong>Rupees ${words}</strong></div>
<div style="font-size:12px;color:#555"><strong>Note:</strong> GST applicable on Day Care services per GST Act 2017. SAC Code 999299.</div>
<div class="for-school">For Evergreen Preschool and Daycare</div>
<div class="note">This is a computer generated invoice, signature is not required.</div>
<div style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="background:#178F78;color:white;border:none;border-radius:8px;padding:10px 28px;font-size:14px;cursor:pointer;font-family:Arial,sans-serif">🖨️ Print</button>
</div>
</body></html>`;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PAYMENT_MODES = [
  { value: "cash",          label: "Cash",         icon: "💵" },
  { value: "upi",           label: "UPI",           icon: "📱" },
  { value: "cheque",        label: "Cheque",        icon: "🏦" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏛️" },
];

const MODE_COLORS: Record<string, string> = {
  cash:          "#178F78",
  upi:           "#6366F1",
  cheque:        "#E8694A",
  bank_transfer: "#F5B829",
  online:        "#178F78",
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  paid:    { bg: "rgba(23,143,120,0.1)",  color: "#178F78", label: "Paid"    },
  partial: { bg: "rgba(99,102,241,0.1)",  color: "#6366F1", label: "Partial" },
  pending: { bg: "rgba(245,184,41,0.12)", color: "#B08000", label: "Pending" },
  waived:  { bg: "rgba(107,114,128,0.1)", color: "#6B7280", label: "Waived"  },
  overdue: { bg: "rgba(220,38,38,0.1)",   color: "#DC2626", label: "Overdue" },
};

function fmt(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

interface Props { enquiries: any[]; }

const blankPayForm = () => ({
  paidAmount: "", paymentMode: "cash",
  paymentDate: new Date().toISOString().split("T")[0],
  receivedBy: "", referenceNumber: "", notes: "",
  applyDiscount: false, discountAmount: "", discountReason: "",
  paidByName: "", paidByRelation: "Father",
});

const blankGenForm = (settings: any = {}) => ({
  enquiryId: "", childName: "", programme: "", description: "",
  amount: "", dueDate: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentMode: "cash", referenceNumber: "", receivedBy: "",
  paidByName: "", paidByRelation: "Father",
  discountAmount: "", discountReason: "",
  receiptNumber: `EPS-RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
  panNumber: settings.pan_number || "",   // pre-filled from settings, editable
  gstNumber: settings.gst_number || "",   // pre-filled from settings, editable
});

// ─── Shared input style (outside component so it's stable across renders) ────
const inp = {
  border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px",
  fontSize: "13px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box" as const,
};

// ─── PaidByFields outside component — prevents remount on every keystroke ────
function PaidByFields({ form, setForm }: { form: any; setForm: (f: any) => void }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>
        PAID BY (PARENT NAME) <span style={{ fontWeight: 400, color: "#9CA3AF" }}>— optional</span>
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px" }}>
        <input value={form.paidByName} onChange={e => setForm({ ...form, paidByName: e.target.value })} style={inp} placeholder="Parent full name" />
        <select value={form.paidByRelation} onChange={e => setForm({ ...form, paidByRelation: e.target.value })} style={{ ...inp, width: "auto" }}>
          <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
        </select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FeesTab({ enquiries }: Props) {
  const [subTab, setSubTab]         = useState<"records"|"reports"|"structures"|"generator">("records");
  const [fees, setFees]             = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [reports, setReports]       = useState<any>(null);
  const [loading, setLoading]       = useState(false);

  const [payModal, setPayModal]   = useState<any>(null);
  const [paying, setPaying]       = useState(false);
  const [payForm, setPayForm]     = useState(blankPayForm());
  const [payResult, setPayResult] = useState<any>(null);

  const [showFeeForm, setShowFeeForm]   = useState(false);
  const [feeForm, setFeeForm]           = useState({ feeStructureId: "", feeType: "monthly", amount: "", dueDate: "", periodLabel: "", notes: "" });
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [feeSaving, setFeeSaving]       = useState(false);

  const [showStructForm, setShowStructForm] = useState(false);
  const [structForm, setStructForm]         = useState({ name: "", programme_id: "", fee_type: "monthly", amount: "" });

  const [genForm, setGenForm]       = useState(blankGenForm());
  const [settings, setSettings]     = useState<any>({});

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      const s = d || {};
      setSettings(s);
      // Pre-fill PAN/GST in generator form from settings
      setGenForm(p => ({
        ...p,
        panNumber: p.panNumber || s.pan_number || "",
        gstNumber: p.gstNumber || s.gst_number || "",
      }));
    }).catch(() => {});
  }, []);

  const loadFees = useCallback(async () => {
    setLoading(true);
    const [f, s] = await Promise.all([
      fetch("/api/fees/assignments").then(r => r.json()),
      fetch("/api/fees/structures").then(r => r.json()),
    ]);
    setFees(Array.isArray(f) ? f : []);
    setStructures(Array.isArray(s) ? s : []);
    setLoading(false);
  }, []);

  const loadReports = useCallback(async () => {
    const r = await fetch("/api/fees/reports").then(r => r.json());
    setReports(r);
  }, []);

  useEffect(() => { loadFees(); }, [loadFees]);
  useEffect(() => { if (subTab === "reports") loadReports(); }, [subTab, loadReports]);

  const openPayModal = (fee: any) => {
    setPayResult(null);
    setPayForm({ ...blankPayForm(), paidAmount: String(fee.amount - (fee.paid_amount || 0) - (fee.discount_amount || 0)) });
    setPayModal(fee);
  };

  const submitPayment = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      const res  = await fetch("/api/fees/record-payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feeId: payModal.id, paidAmount: parseFloat(payForm.paidAmount),
          paymentMode: payForm.paymentMode, paymentDate: payForm.paymentDate,
          receivedBy: payForm.receivedBy, referenceNumber: payForm.referenceNumber,
          notes: payForm.notes, applyDiscount: payForm.applyDiscount,
          discountAmount: payForm.applyDiscount ? parseFloat(payForm.discountAmount || "0") : 0,
          discountReason: payForm.discountReason,
          paidByName: payForm.paidByName, paidByRelation: payForm.paidByRelation,
        }),
      });
      const data = await res.json();
      if (data.success) { setPayResult(data); loadFees(); if (subTab === "reports") loadReports(); }
    } catch {}
    setPaying(false);
  };

  const printReceipt    = (fee: any) => { const w = window.open("","_blank"); if (w) { w.document.write(buildReceiptHTML(fee, settings)); w.document.close(); } };
  const printGSTInvoice = (fee: any) => { const w = window.open("","_blank"); if (w) { w.document.write(buildGSTInvoiceHTML(fee, settings)); w.document.close(); } };

  const isOverdue          = (fee: any) => (fee.status === "pending" || fee.status === "partial") && new Date(fee.due_date) < new Date();
  const getEffectiveStatus = (fee: any) => isOverdue(fee) ? "overdue" : fee.status;
  const balance            = (fee: any) => Math.max(0, fee.amount - (fee.paid_amount || 0) - (fee.discount_amount || 0));

  // Helper to build fee data object for printing from genForm
  const genFeeData = () => ({
    child_name: genForm.childName, programme: genForm.programme,
    period_label: genForm.description, description: genForm.description,
    amount: parseFloat(genForm.amount || "0"), paid_amount: parseFloat(genForm.amount || "0"),
    due_date: genForm.dueDate, payment_date: genForm.paymentDate,
    payment_mode: genForm.paymentMode, reference_number: genForm.referenceNumber,
    received_by: genForm.receivedBy, paid_by_name: genForm.paidByName,
    paid_by_relation: genForm.paidByRelation, discount_amount: parseFloat(genForm.discountAmount || "0"),
    discount_reason: genForm.discountReason, receipt_number: genForm.receiptNumber,
  });

  // Settings merged with generator overrides for printing
  const genSettings = () => ({
    ...settings,
    pan_number: genForm.panNumber,  // use generator override (may differ from settings)
    gst_number: genForm.gstNumber,
  });

  const canPrint = !!genForm.childName && !!genForm.amount && !!genForm.description;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "white", borderRadius: "14px", padding: "4px", border: "1px solid #EDE8DF" }}>
        {([
          { key: "records",    label: "📋 Fee Records"       },
          { key: "reports",    label: "📊 Reports"            },
          { key: "structures", label: "⚙️ Structures"         },
          { key: "generator",  label: "🧾 Receipt Generator"  },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: "10px", border: "none", cursor: "pointer",
              fontSize: "11px", fontWeight: 700, fontFamily: "'Quicksand', sans-serif",
              background: subTab === t.key ? "#178F78" : "transparent",
              color:      subTab === t.key ? "white"   : "#6B7A99" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ FEE RECORDS ══════════════════════════════════════════════════════ */}
      {subTab === "records" && (
        <div>
          {/* Assign fee form */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "16px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showFeeForm ? "12px" : "0" }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A2F4A" }}>Assign New Fee</div>
              <button onClick={() => setShowFeeForm(!showFeeForm)}
                style={{ background: "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                {showFeeForm ? "Cancel" : "+ Assign Fee"}
              </button>
            </div>
            {showFeeForm && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>SELECT CHILD *</label>
                    <select onChange={e => {
                      const child = enquiries.find(enq => enq.id === e.target.value);
                      setSelectedChild(child || null);
                      if (child) { const struct = structures.find(s => s.programme_id === child.program_id); if (struct) setFeeForm(p => ({ ...p, feeStructureId: struct.id, feeType: struct.fee_type, amount: struct.amount.toString() })); }
                    }} style={inp}>
                      <option value="">— Select child —</option>
                      {enquiries.filter(e => e.status === "enrolled" || e.status === "visited").map(e => (
                        <option key={e.id} value={e.id}>{e.child_name} — {e.program_label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>AMOUNT (₹) *</label>
                    <input value={feeForm.amount} onChange={e => setFeeForm(p => ({ ...p, amount: e.target.value }))} style={inp} type="number" placeholder="5000" />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>DUE DATE *</label>
                    <input type="date" value={feeForm.dueDate} onChange={e => setFeeForm(p => ({ ...p, dueDate: e.target.value }))} style={inp} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>FEE TYPE</label>
                    <select value={feeForm.feeType} onChange={e => setFeeForm(p => ({ ...p, feeType: e.target.value }))} style={inp}>
                      <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option><option value="one-time">One-time</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>PERIOD LABEL</label>
                    <input value={feeForm.periodLabel} onChange={e => setFeeForm(p => ({ ...p, periodLabel: e.target.value }))} style={inp} placeholder="e.g. June 2026" />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>NOTES</label>
                    <input value={feeForm.notes} onChange={e => setFeeForm(p => ({ ...p, notes: e.target.value }))} style={inp} placeholder="Optional" />
                  </div>
                </div>
                <button disabled={!selectedChild || !feeForm.amount || !feeForm.dueDate || feeSaving}
                  onClick={async () => {
                    if (!selectedChild) return;
                    setFeeSaving(true);
                    await fetch("/api/fees/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enquiryId: selectedChild.id, childName: selectedChild.child_name, feeType: feeForm.feeType, amount: parseFloat(feeForm.amount), dueDate: feeForm.dueDate, periodLabel: feeForm.periodLabel, notes: feeForm.notes }) });
                    setFeeForm({ feeStructureId: "", feeType: "monthly", amount: "", dueDate: "", periodLabel: "", notes: "" });
                    setSelectedChild(null); setShowFeeForm(false); setFeeSaving(false); loadFees();
                  }}
                  style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "9px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif", opacity: !selectedChild || !feeForm.amount || !feeForm.dueDate ? 0.5 : 1 }}>
                  {feeSaving ? "Saving…" : "+ Assign Fee"}
                </button>
              </>
            )}
          </div>

          {/* Records list */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#6B7A99" }}>Loading…</div>
          ) : fees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", background: "white", borderRadius: "16px", border: "1px solid #EDE8DF" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💳</div>No fee records yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {fees.map((fee: any) => {
                const statusKey = getEffectiveStatus(fee);
                const sc  = STATUS_COLORS[statusKey] || STATUS_COLORS.pending;
                const bal = balance(fee);
                const phone = enquiries.find(e => e.id === fee.enquiry_id)?.phone;
                return (
                  <div key={fee.id} style={{ background: "white", borderRadius: "14px", border: `1px solid ${statusKey === "overdue" ? "rgba(220,38,38,0.25)" : "#EDE8DF"}`, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{fee.child_name}</div>
                        <div style={{ fontSize: "11px", color: "#6B7A99" }}>
                          {fee.period_label && <span>{fee.period_label} · </span>}
                          <span style={{ textTransform: "capitalize" }}>{fee.fee_type}</span>
                          {fee.due_date && <span> · Due: {new Date(fee.due_date).toLocaleDateString("en-IN")}</span>}
                        </div>
                        {fee.paid_by_name && (
                          <div style={{ fontSize: "10px", color: "#6366F1", marginTop: "2px" }}>👤 {fee.paid_by_name} ({fee.paid_by_relation || "Parent"})</div>
                        )}
                        {fee.discount_amount > 0 && <div style={{ fontSize: "10px", color: "#6366F1" }}>Discount: {fmt(fee.discount_amount)} ({fee.discount_reason || "—"})</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: "#1A2F4A" }}>{fmt(fee.amount)}</div>
                        {fee.status === "partial" && (
                          <div style={{ fontSize: "11px" }}>
                            <span style={{ color: "#178F78" }}>Paid: {fmt(fee.paid_amount)}</span>
                            <span style={{ color: "#E8694A", marginLeft: "6px" }}>Bal: {fmt(bal)}</span>
                          </div>
                        )}
                      </div>
                      <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`, borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700 }}>{sc.label}</span>
                      {(fee.status === "paid" || fee.status === "partial") && fee.payment_mode && (
                        <span style={{ background: `${MODE_COLORS[fee.payment_mode] || "#178F78"}15`, color: MODE_COLORS[fee.payment_mode] || "#178F78", borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700, textTransform: "capitalize" }}>
                          {fee.payment_mode === "bank_transfer" ? "Bank" : fee.payment_mode}
                        </span>
                      )}
                      {fee.receipt_number && <span style={{ fontSize: "10px", color: "#6B7A99", fontFamily: "monospace" }}>{fee.receipt_number}</span>}
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {(fee.status === "pending" || fee.status === "partial") && (
                          <button onClick={() => openPayModal(fee)}
                            style={{ background: "#178F78", color: "white", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            💵 Record Payment
                          </button>
                        )}
                        {(fee.status === "paid" || fee.status === "partial") && (
                          <>
                            <button onClick={() => printReceipt(fee)}
                              style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                              🖨️ Receipt
                            </button>
                            <button onClick={() => printGSTInvoice(fee)} title="GST Invoice (Daycare)"
                              style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                              🧾 GST
                            </button>
                          </>
                        )}
                        {(fee.status === "pending" || fee.status === "partial") && phone && (
                          <button onClick={async () => {
                            const res  = await fetch("/api/fees/reminder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feeId: fee.id, phone, childName: fee.child_name, amount: bal || fee.amount, dueDate: fee.due_date, periodLabel: fee.period_label }) });
                            const data = await res.json();
                            window.open(data.waLink, "_blank");
                          }} style={{ background: "rgba(37,211,102,0.1)", color: "#128C7E", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            💬
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ REPORTS ══════════════════════════════════════════════════════════ */}
      {subTab === "reports" && reports && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "10px", marginBottom: "16px" }}>
            {[
              { label: "Total Collected",  value: fmt(reports.summary.totalCollected),  color: "#178F78" },
              { label: "Outstanding",      value: fmt(reports.summary.totalOutstanding), color: "#B08000" },
              { label: "Overdue",          value: fmt(reports.summary.totalOverdue),     color: "#DC2626" },
              { label: "Cash Collected",   value: fmt(reports.summary.cashCollected),    color: "#6366F1" },
              { label: "Online Collected", value: fmt(reports.summary.onlineCollected),  color: "#178F78" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", borderRadius: "14px", border: "1px solid #EDE8DF", padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: "10px", color: "#6B7A99", marginTop: "3px" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "16px", marginBottom: "14px" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A2F4A", marginBottom: "12px" }}>Payment Mode Breakdown</div>
            {Object.entries(reports.summary.modeBreakdown as Record<string, number>).map(([mode, amount]) => {
              const total = reports.summary.totalCollected || 1;
              const pct   = Math.round((amount / total) * 100);
              return (
                <div key={mode} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "capitalize", color: "#1A2F4A" }}>{mode === "bank_transfer" ? "Bank Transfer" : mode}</span>
                    <span style={{ fontSize: "12px", color: "#6B7A99" }}>{fmt(amount)} ({pct}%)</span>
                  </div>
                  <div style={{ background: "#FAF0E8", borderRadius: "20px", height: "6px", overflow: "hidden" }}>
                    <div style={{ background: MODE_COLORS[mode] || "#178F78", height: "100%", width: `${pct}%`, borderRadius: "20px", transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
          {reports.overdueList.length > 0 && (
            <div style={{ background: "white", borderRadius: "16px", border: "1px solid rgba(220,38,38,0.2)", padding: "16px", marginBottom: "14px" }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "15px", fontWeight: 700, color: "#DC2626", marginBottom: "12px" }}>🔴 Overdue ({reports.overdueList.length})</div>
              {reports.overdueList.map((f: any) => {
                const phone = enquiries.find(e => e.id === f.enquiry_id)?.phone;
                return (
                  <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #EDE8DF" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A2F4A" }}>{f.child_name}</div>
                      <div style={{ fontSize: "11px", color: "#6B7A99" }}>Due: {new Date(f.due_date).toLocaleDateString("en-IN")} · {f.period_label}</div>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#DC2626" }}>{fmt(f.balance)}</div>
                    {phone && (
                      <button onClick={async () => {
                        const res  = await fetch("/api/fees/reminder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ feeId: f.id, phone, childName: f.child_name, amount: f.balance, dueDate: f.due_date, periodLabel: f.period_label }) });
                        const data = await res.json();
                        window.open(data.waLink, "_blank");
                      }} style={{ background: "rgba(37,211,102,0.1)", color: "#128C7E", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        💬 Remind
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "16px" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A2F4A", marginBottom: "12px" }}>Recent Payments</div>
            {reports.recentPayments.map((p: any) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid #EDE8DF" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A2F4A" }}>{p.child_name}</div>
                  <div style={{ fontSize: "11px", color: "#6B7A99" }}>{p.period_label} · {new Date(p.paid_at).toLocaleDateString("en-IN")}{p.receipt_number && <span style={{ marginLeft: "6px", fontFamily: "monospace", fontSize: "10px" }}>{p.receipt_number}</span>}</div>
                </div>
                <span style={{ background: `${MODE_COLORS[p.payment_mode] || "#178F78"}15`, color: MODE_COLORS[p.payment_mode] || "#178F78", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, textTransform: "capitalize" }}>
                  {p.payment_mode === "bank_transfer" ? "Bank" : p.payment_mode}
                </span>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#178F78" }}>{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ STRUCTURES ═══════════════════════════════════════════════════════ */}
      {subTab === "structures" && (
        <div>
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "16px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showStructForm ? "12px" : "0" }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "15px", fontWeight: 700, color: "#1A2F4A" }}>Fee Structures</div>
              <button onClick={() => setShowStructForm(!showStructForm)}
                style={{ background: "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                {showStructForm ? "Cancel" : "+ Add Structure"}
              </button>
            </div>
            {showStructForm && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <input value={structForm.name} onChange={e => setStructForm(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="e.g. Nursery Monthly 2026-27" />
                  <select value={structForm.programme_id} onChange={e => setStructForm(p => ({ ...p, programme_id: e.target.value }))} style={inp}>
                    <option value="">All Programmes</option>
                    <option value="infant">Infant Care</option><option value="playgroup">Playgroup</option>
                    <option value="nursery">Nursery</option><option value="jrkg">Junior KG</option>
                    <option value="srkg">Senior KG</option><option value="daycare">Daycare</option>
                  </select>
                  <select value={structForm.fee_type} onChange={e => setStructForm(p => ({ ...p, fee_type: e.target.value }))} style={inp}>
                    <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option><option value="one-time">One-time</option>
                  </select>
                  <input value={structForm.amount} onChange={e => setStructForm(p => ({ ...p, amount: e.target.value }))} style={inp} placeholder="Amount ₹" type="number" />
                </div>
                <button onClick={async () => {
                  if (!structForm.name || !structForm.amount) return;
                  await fetch("/api/fees/structures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...structForm, amount: parseFloat(structForm.amount) }) });
                  setStructForm({ name: "", programme_id: "", fee_type: "monthly", amount: "" });
                  setShowStructForm(false); loadFees();
                }} style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "9px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                  + Add Structure
                </button>
              </>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "10px" }}>
            {structures.map((s: any) => (
              <div key={s.id} style={{ background: "white", borderRadius: "14px", border: "1px solid #EDE8DF", padding: "14px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A", marginBottom: "4px" }}>{s.name}</div>
                <div style={{ fontSize: "11px", color: "#6B7A99", marginBottom: "8px", textTransform: "capitalize" }}>{s.programme_id || "All programmes"} · {s.fee_type}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#178F78" }}>{fmt(s.amount)}</div>
                <button onClick={async () => {
                  if (!confirm(`Delete "${s.name}"?`)) return;
                  await fetch("/api/fees/structures", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id }) });
                  loadFees();
                }} style={{ marginTop: "8px", background: "rgba(220,38,38,0.08)", border: "none", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>
                  🗑 Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RECEIPT GENERATOR ════════════════════════════════════════════════ */}
      {subTab === "generator" && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "20px" }}>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "17px", fontWeight: 700, color: "#178F78", marginBottom: "4px" }}>🧾 Receipt Generator</div>
          <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "20px" }}>
            Generate receipts for walk-in payments, historical records, or reprints — no DB entry needed.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

            {/* Child name — pick from list or type */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>CHILD NAME *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <select onChange={e => {
                  const child = enquiries.find(c => c.id === e.target.value);
                  if (child) setGenForm(p => ({ ...p, enquiryId: child.id, childName: child.child_name, programme: child.program_label || "" }));
                }} style={inp} value={genForm.enquiryId}>
                  <option value="">— Pick enrolled child —</option>
                  {enquiries.map(e => <option key={e.id} value={e.id}>{e.child_name} — {e.program_label}</option>)}
                </select>
                <input value={genForm.childName} onChange={e => setGenForm(p => ({ ...p, childName: e.target.value }))} style={inp} placeholder="Or type child name manually" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>PROGRAMME / CLASS</label>
              <input value={genForm.programme} onChange={e => setGenForm(p => ({ ...p, programme: e.target.value }))} style={inp} placeholder="e.g. Day Care, Nursery" />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>FEE DESCRIPTION *</label>
              <input value={genForm.description} onChange={e => setGenForm(p => ({ ...p, description: e.target.value }))} style={inp} placeholder="e.g. Apr,2026 daycare fee" />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>AMOUNT (₹) *</label>
              <input type="number" value={genForm.amount} onChange={e => setGenForm(p => ({ ...p, amount: e.target.value }))} style={inp} placeholder="7500" />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>DUE DATE</label>
              <input type="date" value={genForm.dueDate} onChange={e => setGenForm(p => ({ ...p, dueDate: e.target.value }))} style={inp} />
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>PAYMENT DATE *</label>
              <input type="date" value={genForm.paymentDate} onChange={e => setGenForm(p => ({ ...p, paymentDate: e.target.value }))} style={inp} />
            </div>

            {/* Payment mode */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "8px" }}>PAYMENT MODE *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                {PAYMENT_MODES.map(m => (
                  <button key={m.value} type="button" onClick={() => setGenForm(p => ({ ...p, paymentMode: m.value }))}
                    style={{ padding: "8px 4px", borderRadius: "10px", border: `2px solid ${genForm.paymentMode === m.value ? MODE_COLORS[m.value] : "#EDE8DF"}`, background: genForm.paymentMode === m.value ? `${MODE_COLORS[m.value]}15` : "white", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: "16px" }}>{m.icon}</div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: genForm.paymentMode === m.value ? MODE_COLORS[m.value] : "#6B7A99" }}>{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>RECEIVED BY</label>
              <input value={genForm.receivedBy} onChange={e => setGenForm(p => ({ ...p, receivedBy: e.target.value }))} style={inp} placeholder="Staff name" />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>
                {genForm.paymentMode === "upi" ? "UPI REF NO." : genForm.paymentMode === "cheque" ? "CHEQUE NO." : genForm.paymentMode === "bank_transfer" ? "UTR NUMBER" : "REFERENCE NO."}
              </label>
              <input value={genForm.referenceNumber} onChange={e => setGenForm(p => ({ ...p, referenceNumber: e.target.value }))} style={inp} placeholder="Optional" />
            </div>

            {/* Paid By */}
            <div style={{ gridColumn: "1 / -1" }}>
              <PaidByFields form={genForm} setForm={setGenForm} />
            </div>

            {/* Discount */}
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>DISCOUNT (₹) — optional</label>
              <input type="number" value={genForm.discountAmount} onChange={e => setGenForm(p => ({ ...p, discountAmount: e.target.value }))} style={inp} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>DISCOUNT REASON</label>
              <input value={genForm.discountReason} onChange={e => setGenForm(p => ({ ...p, discountReason: e.target.value }))} style={inp} placeholder="e.g. Sibling concession" />
            </div>

            {/* Receipt number */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "6px" }}>RECEIPT NUMBER</label>
              <input value={genForm.receiptNumber} onChange={e => setGenForm(p => ({ ...p, receiptNumber: e.target.value }))} style={inp} placeholder="EPS-RCP-2026-0001" />
            </div>

            {/* PAN and GST overrides */}
            <div style={{ gridColumn: "1 / -1", background: "#FAF0E8", borderRadius: "12px", padding: "14px 16px", border: "1px solid #EDE8DF" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#178F78", marginBottom: "10px" }}>
                🧾 PAN & GST — pre-filled from Settings, edit here for this receipt only
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "5px" }}>
                    PAN NUMBER <span style={{ fontWeight: 400, color: "#9CA3AF" }}>— blank to hide</span>
                  </label>
                  <input value={genForm.panNumber} onChange={e => setGenForm(p => ({ ...p, panNumber: e.target.value }))}
                    style={{ ...inp, background: "white" }} placeholder="e.g. AADTJ3659H" maxLength={10} />
                  {genForm.panNumber
                    ? <div style={{ fontSize: "10px", color: "#178F78", marginTop: "3px" }}>✓ Will appear on receipt</div>
                    : <div style={{ fontSize: "10px", color: "#E8694A", marginTop: "3px" }}>✗ Hidden from receipt</div>}
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "5px" }}>
                    GST NUMBER <span style={{ fontWeight: 400, color: "#9CA3AF" }}>— blank to hide</span>
                  </label>
                  <input value={genForm.gstNumber} onChange={e => setGenForm(p => ({ ...p, gstNumber: e.target.value }))}
                    style={{ ...inp, background: "white" }} placeholder="e.g. 29AADTJ3659H1ZR" maxLength={15} />
                  {genForm.gstNumber
                    ? <div style={{ fontSize: "10px", color: "#178F78", marginTop: "3px" }}>✓ Will appear on GST invoice</div>
                    : <div style={{ fontSize: "10px", color: "#E8694A", marginTop: "3px" }}>✗ Hidden from GST invoice</div>}
                </div>
              </div>
              <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "8px" }}>
                Changes here only affect this receipt. To update permanently, go to Settings tab.
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <button disabled={!canPrint} onClick={() => { const w = window.open("","_blank"); if (w) { w.document.write(buildReceiptHTML(genFeeData(), genSettings())); w.document.close(); } }}
              style={{ background: canPrint ? "#178F78" : "#ccc", color: "white", border: "none", borderRadius: "12px", padding: "11px 22px", fontSize: "13px", fontWeight: 700, cursor: canPrint ? "pointer" : "not-allowed", fontFamily: "'Quicksand', sans-serif", boxShadow: canPrint ? "0 4px 14px rgba(23,143,120,0.3)" : "none" }}>
              🖨️ Print Receipt
            </button>
            <button disabled={!canPrint} onClick={() => { const w = window.open("","_blank"); if (w) { w.document.write(buildGSTInvoiceHTML(genFeeData(), genSettings())); w.document.close(); } }}
              style={{ background: canPrint ? "#6366F1" : "#ccc", color: "white", border: "none", borderRadius: "12px", padding: "11px 22px", fontSize: "13px", fontWeight: 700, cursor: canPrint ? "pointer" : "not-allowed", fontFamily: "'Quicksand', sans-serif" }}>
              🧾 Print GST Invoice
            </button>
            <button onClick={() => setGenForm(blankGenForm(settings))}
              style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
              ↺ Reset
            </button>
          </div>
        </div>
      )}

      {/* ══ PAYMENT MODAL ════════════════════════════════════════════════════ */}
      {payModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }}>

            {payResult ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78", marginBottom: "6px" }}>Payment Recorded!</div>
                <div style={{ background: "#FAF0E8", borderRadius: "12px", padding: "14px", marginBottom: "16px", textAlign: "left" }}>
                  <div style={{ fontSize: "11px", color: "#6B7A99", marginBottom: "4px" }}>RECEIPT NUMBER</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#178F78", fontFamily: "monospace" }}>{payResult.receiptNumber}</div>
                  {payResult.balance > 0 && <div style={{ marginTop: "8px", fontSize: "12px", color: "#E8694A", fontWeight: 600 }}>Balance remaining: {fmt(payResult.balance)}</div>}
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => printReceipt({
                    ...payModal,
                    receipt_number:   payResult.receiptNumber,
                    payment_mode:     payForm.paymentMode,
                    paid_amount:      parseFloat(payForm.paidAmount),
                    payment_date:     payForm.paymentDate,
                    received_by:      payForm.receivedBy,
                    reference_number: payForm.referenceNumber,
                    paid_by_name:     payForm.paidByName,
                    paid_by_relation: payForm.paidByRelation,
                    discount_amount:  payForm.applyDiscount ? parseFloat(payForm.discountAmount || "0") : 0,
                    discount_reason:  payForm.discountReason,
                  })} style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                    🖨️ Print Receipt
                  </button>
                  <button onClick={() => { setPayModal(null); setPayResult(null); }}
                    style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "12px", padding: "10px 16px", fontSize: "13px", cursor: "pointer" }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "18px", fontWeight: 700, color: "#178F78" }}>Record Payment</div>
                  <button onClick={() => setPayModal(null)} style={{ background: "#EDE8DF", border: "none", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "13px", color: "#6B7A99" }}>✕</button>
                </div>

                <div style={{ background: "#FAF0E8", borderRadius: "12px", padding: "12px", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{payModal.child_name}</div>
                  <div style={{ fontSize: "12px", color: "#6B7A99" }}>{payModal.period_label} · Due: {new Date(payModal.due_date).toLocaleDateString("en-IN")}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#1A2F4A", marginTop: "4px" }}>
                    Total: {fmt(payModal.amount)}
                    {payModal.paid_amount > 0 && <span style={{ fontSize: "13px", color: "#178F78", marginLeft: "8px" }}>Already paid: {fmt(payModal.paid_amount)}</span>}
                  </div>
                </div>

                {/* Payment mode */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "8px" }}>PAYMENT MODE *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                    {PAYMENT_MODES.map(m => (
                      <button key={m.value} type="button" onClick={() => setPayForm(p => ({ ...p, paymentMode: m.value }))}
                        style={{ padding: "8px 4px", borderRadius: "10px", border: `2px solid ${payForm.paymentMode === m.value ? MODE_COLORS[m.value] : "#EDE8DF"}`, background: payForm.paymentMode === m.value ? `${MODE_COLORS[m.value]}15` : "white", cursor: "pointer", textAlign: "center" }}>
                        <div style={{ fontSize: "16px" }}>{m.icon}</div>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: payForm.paymentMode === m.value ? MODE_COLORS[m.value] : "#6B7A99" }}>{m.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>AMOUNT RECEIVED (₹) *</label>
                    <input value={payForm.paidAmount} onChange={e => setPayForm(p => ({ ...p, paidAmount: e.target.value }))} style={inp} type="number" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>DATE RECEIVED *</label>
                    <input type="date" value={payForm.paymentDate} onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))} style={inp} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>RECEIVED BY</label>
                    <input value={payForm.receivedBy} onChange={e => setPayForm(p => ({ ...p, receivedBy: e.target.value }))} style={inp} placeholder="Staff name" />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>
                      {payForm.paymentMode === "cheque" ? "CHEQUE NO." : payForm.paymentMode === "upi" ? "UPI REF NO." : payForm.paymentMode === "bank_transfer" ? "UTR NUMBER" : "REFERENCE"}
                    </label>
                    <input value={payForm.referenceNumber} onChange={e => setPayForm(p => ({ ...p, referenceNumber: e.target.value }))} style={inp} placeholder="Optional" />
                  </div>
                </div>

                {/* Paid By — NEW */}
                <PaidByFields form={payForm} setForm={f => setPayForm(f)} />

                {/* Discount */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 700, color: "#6366F1" }}>
                    <input type="checkbox" checked={payForm.applyDiscount} onChange={e => setPayForm(p => ({ ...p, applyDiscount: e.target.checked }))} />
                    Apply Discount / Concession
                  </label>
                  {payForm.applyDiscount && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
                      <input value={payForm.discountAmount} onChange={e => setPayForm(p => ({ ...p, discountAmount: e.target.value }))} style={inp} placeholder="Discount ₹" type="number" />
                      <input value={payForm.discountReason} onChange={e => setPayForm(p => ({ ...p, discountReason: e.target.value }))} style={inp} placeholder="Reason (e.g. sibling)" />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "4px" }}>NOTES</label>
                  <input value={payForm.notes} onChange={e => setPayForm(p => ({ ...p, notes: e.target.value }))} style={inp} placeholder="Optional notes" />
                </div>

                <button onClick={submitPayment} disabled={paying || !payForm.paidAmount}
                  style={{ width: "100%", background: paying || !payForm.paidAmount ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "14px", padding: "13px", fontSize: "14px", fontWeight: 700, cursor: paying || !payForm.paidAmount ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(23,143,120,0.3)", fontFamily: "'Quicksand', sans-serif" }}>
                  {paying ? "Saving…" : `✅ Confirm Payment of ${fmt(parseFloat(payForm.paidAmount || "0"))}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
