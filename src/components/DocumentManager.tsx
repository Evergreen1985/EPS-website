"use client";
/**
 * DOCUMENT MANAGER COMPONENT
 * src/components/DocumentManager.tsx
 *
 * Shared between admin (ChildEditModal) and parent dashboard.
 *
 * Props:
 *   enquiryId    — child's enquiry ID
 *   childName    — child's name
 *   mode         — "admin" | "parent"
 *   uploadedBy   — name of uploader (admin name or parent name)
 *   supabase     — Supabase client instance (passed in to avoid re-init)
 *   onOcrApply?  — admin only: called with OCR data to apply to profile form
 */

import { useState, useEffect, useRef, useCallback } from "react";

const DOC_TYPES = [
  { key: "birth_certificate", label: "Birth Certificate",    icon: "📄", required: true  },
  { key: "aadhaar",           label: "Parent Aadhaar",       icon: "🪪", required: true  },
  { key: "child_aadhaar",     label: "Child Aadhaar",        icon: "🪪", required: false },
  { key: "passport",          label: "Passport",             icon: "📘", required: false },
  { key: "immunization",      label: "Immunization Record",  icon: "💉", required: false },
  { key: "photo",             label: "Child Photo",          icon: "📷", required: false },
  { key: "other",             label: "Other Document",       icon: "📎", required: false },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "rgba(245,184,41,0.12)",  color: "#B08000", label: "⏳ Pending review" },
  verified: { bg: "rgba(23,143,120,0.1)",   color: "#178F78", label: "✅ Verified"        },
  rejected: { bg: "rgba(220,38,38,0.08)",   color: "#DC2626", label: "❌ Rejected"        },
};

interface Doc {
  id: string;
  enquiry_id: string;
  document_type: string;
  document_label: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  uploaded_by: string;
  uploaded_by_name: string;
  status: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  ocr_data?: any;
  ocr_applied?: boolean;
  created_at: string;
}

interface Props {
  enquiryId:   string;
  childName:   string;
  mode:        "admin" | "parent";
  uploadedBy:  string;
  supabase:    any;
  onOcrApply?: (data: any) => void;
}

export default function DocumentManager({ enquiryId, childName, mode, uploadedBy, supabase, onOcrApply }: Props) {
  const [docs, setDocs]             = useState<Doc[]>([]);
  const [loading, setLoading]       = useState(false);
  const [uploading, setUploading]   = useState<string | null>(null);
  const [error, setError]           = useState("");
  const [rejectModal, setRejectModal] = useState<Doc | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [ocrModal, setOcrModal]     = useState<{ doc: Doc; data: any } | null>(null);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const inp: React.CSSProperties = {
    border: "1px solid #EDE8DF", borderRadius: "8px", padding: "7px 11px",
    fontSize: "13px", outline: "none", background: "#FAF0E8",
    fontFamily: "'Quicksand',sans-serif", width: "100%", boxSizing: "border-box",
  };

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/documents?enquiryId=${enquiryId}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }, [enquiryId]);

  useEffect(() => { if (enquiryId) loadDocs(); }, [loadDocs, enquiryId]);

  // Upload a file to Supabase storage and save record
  const handleUpload = async (docType: string, docLabel: string, file: File) => {
    setUploading(docType);
    setError("");
    try {
      const ext      = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path     = `documents/${enquiryId}/${docType}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("school-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data: urlData } = supabase.storage.from("school-photos").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      const res  = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiry_id:       enquiryId,
          child_name:       childName,
          document_type:    docType,
          document_label:   docLabel,
          file_url:         fileUrl,
          file_name:        file.name,
          file_size:        file.size,
          mime_type:        file.type,
          uploaded_by:      mode,
          uploaded_by_name: uploadedBy,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      loadDocs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  };

  // Admin: verify a document
  const verify = async (doc: Doc) => {
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, action: "verify", verified_by: uploadedBy }),
    });
    loadDocs();
  };

  // Admin: reject a document
  const reject = async () => {
    if (!rejectModal) return;
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rejectModal.id, action: "reject", rejection_reason: rejectReason, verified_by: uploadedBy }),
    });
    setRejectModal(null); setRejectReason(""); loadDocs();
  };

  // Admin: run OCR on a document
  const runOcr = async (doc: Doc) => {
    setOcrLoading(doc.id);
    try {
      // Fetch the file and convert to base64
      const response = await fetch(doc.file_url);
      const blob     = await response.blob();
      const base64   = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload  = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });

      const ocrRes  = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType: doc.mime_type || "image/jpeg" }),
      });
      const ocrData = await ocrRes.json();
      if (ocrData.success) {
        // Save OCR data to document record
        await fetch("/api/documents", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: doc.id, action: "save_ocr", ocr_data: ocrData.data }),
        });
        setOcrModal({ doc, data: ocrData.data });
        loadDocs();
      } else {
        setError("OCR failed: " + (ocrData.error || "Unknown error"));
      }
    } catch (err: any) {
      setError("OCR error: " + err.message);
    } finally {
      setOcrLoading(null);
    }
  };

  // Admin: apply OCR data to profile
  const applyOcr = async () => {
    if (!ocrModal || !onOcrApply) return;
    const clean: any = {};
    for (const [k, v] of Object.entries(ocrModal.data)) {
      if (v && k !== "document_type") clean[k] = v;
    }
    onOcrApply(clean);
    // Mark as applied
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ocrModal.doc.id, action: "save_ocr", ocr_data: ocrModal.data, ocr_applied: true }),
    });
    setOcrModal(null);
    loadDocs();
  };

  // Group docs by type — latest first per type
  const docsByType: Record<string, Doc[]> = {};
  docs.forEach(d => {
    if (!docsByType[d.document_type]) docsByType[d.document_type] = [];
    docsByType[d.document_type].push(d);
  });

  const pendingCount = docs.filter(d => d.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "15px", fontWeight: 700, color: "#178F78" }}>
          📁 Documents
        </div>
        {mode === "admin" && pendingCount > 0 && (
          <span style={{ background: "rgba(245,184,41,0.15)", color: "#B08000", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>
            {pendingCount} pending review
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: "rgba(220,38,38,0.08)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "10px" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {DOC_TYPES.map(dt => {
          const typeDocs  = docsByType[dt.key] || [];
          const latest    = typeDocs[0]; // most recent
          const hasHistory = typeDocs.length > 1;
          const isExpanded = expandedHistory === dt.key;

          return (
            <div key={dt.key} style={{ background: "#FAF0E8", borderRadius: "12px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
              {/* Main row */}
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "20px" }}>{dt.icon}</span>
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A" }}>
                      {dt.label}
                      {dt.required && <span style={{ color: "#E8694A", marginLeft: "4px", fontSize: "10px" }}>★ Required</span>}
                    </div>
                    {latest ? (
                      <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                        {latest.uploaded_by === "parent" ? "👤" : "🔑"} {latest.uploaded_by_name || latest.uploaded_by}
                        {" · "}{new Date(latest.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {latest.file_name && <span> · {latest.file_name}</span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Not uploaded yet</div>
                    )}
                  </div>

                  {/* Status badge */}
                  {latest && (
                    <span style={{ background: STATUS_STYLE[latest.status]?.bg, color: STATUS_STYLE[latest.status]?.color, borderRadius: "20px", padding: "3px 10px", fontSize: "10px", fontWeight: 700 }}>
                      {STATUS_STYLE[latest.status]?.label}
                    </span>
                  )}

                  {/* Rejection reason */}
                  {latest?.status === "rejected" && latest.rejection_reason && (
                    <div style={{ width: "100%", fontSize: "11px", color: "#DC2626", background: "rgba(220,38,38,0.06)", borderRadius: "6px", padding: "4px 8px", marginTop: "4px" }}>
                      Reason: {latest.rejection_reason}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {/* View */}
                    {latest && (
                      <a href={latest.file_url} target="_blank" rel="noreferrer"
                        style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", textDecoration: "none" }}>
                        👁 View
                      </a>
                    )}

                    {/* Admin: OCR */}
                    {mode === "admin" && latest && onOcrApply && (
                      <button onClick={() => runOcr(latest)} disabled={ocrLoading === latest.id}
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                        title="Extract data with AI OCR">
                        {ocrLoading === latest.id ? "Reading…" : "🤖 Extract"}
                      </button>
                    )}

                    {/* Admin: Verify */}
                    {mode === "admin" && latest?.status === "pending" && (
                      <>
                        <button onClick={() => verify(latest)}
                          style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          ✓ Verify
                        </button>
                        <button onClick={() => { setRejectModal(latest); setRejectReason(""); }}
                          style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          ✗ Reject
                        </button>
                      </>
                    )}

                    {/* Re-verify if rejected (admin can still verify after rejection) */}
                    {mode === "admin" && latest?.status === "rejected" && (
                      <button onClick={() => verify(latest)}
                        style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                        ✓ Verify Anyway
                      </button>
                    )}

                    {/* Upload button */}
                    {(mode === "parent" || mode === "admin") && (
                      <>
                        <button onClick={() => fileRefs.current[dt.key]?.click()}
                          disabled={uploading === dt.key}
                          style={{ background: uploading === dt.key ? "#ccc" : "#1A2F4A", color: "white", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: uploading === dt.key ? "not-allowed" : "pointer" }}>
                          {uploading === dt.key ? "Uploading…" : latest ? "📤 Re-upload" : "📤 Upload"}
                        </button>
                        <input ref={el => { fileRefs.current[dt.key] = el; }} type="file"
                          accept="image/*,application/pdf" style={{ display: "none" }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(dt.key, dt.label, f); e.target.value = ""; }} />
                      </>
                    )}

                    {/* History toggle */}
                    {hasHistory && (
                      <button onClick={() => setExpandedHistory(isExpanded ? null : dt.key)}
                        style={{ background: "transparent", color: "#6B7A99", border: "1px solid #EDE8DF", borderRadius: "7px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                        🕐 {typeDocs.length} versions
                      </button>
                    )}
                  </div>
                </div>

                {/* OCR previously applied badge */}
                {latest?.ocr_applied && (
                  <div style={{ marginTop: "6px", fontSize: "10px", color: "#6366F1", fontWeight: 600 }}>
                    ✓ Data extracted and applied to profile
                  </div>
                )}
              </div>

              {/* History expansion */}
              {isExpanded && (
                <div style={{ borderTop: "1px solid #EDE8DF", background: "white", padding: "10px 14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#9CA3AF", marginBottom: "8px", letterSpacing: "0.5px" }}>
                    UPLOAD HISTORY ({typeDocs.length} versions)
                  </div>
                  {typeDocs.map((d, i) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", borderBottom: i < typeDocs.length - 1 ? "1px solid #EDE8DF" : "none" }}>
                      <span style={{ fontSize: "10px", background: STATUS_STYLE[d.status]?.bg, color: STATUS_STYLE[d.status]?.color, borderRadius: "20px", padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" }}>
                        {d.status}
                      </span>
                      <div style={{ flex: 1, fontSize: "11px", color: "#6B7A99" }}>
                        {d.uploaded_by === "parent" ? "👤" : "🔑"} {d.uploaded_by_name}
                        {" · "}{new Date(d.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {d.rejection_reason && <span style={{ color: "#DC2626" }}> · {d.rejection_reason}</span>}
                      </div>
                      <a href={d.file_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: "10px", color: "#178F78", fontWeight: 700, textDecoration: "none" }}>View</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "400px" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "16px", fontWeight: 700, color: "#DC2626", marginBottom: "12px" }}>
              ✗ Reject Document
            </div>
            <div style={{ fontSize: "13px", color: "#6B7A99", marginBottom: "12px" }}>
              Reason will be shown to the parent so they know what to re-upload.
            </div>
            <textarea style={{ ...inp, minHeight: "80px", resize: "vertical", marginBottom: "14px" }}
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Document is blurry, please re-upload a clearer photo" />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={reject} disabled={!rejectReason.trim()}
                style={{ flex: 1, background: !rejectReason.trim() ? "#ccc" : "#DC2626", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 700, cursor: !rejectReason.trim() ? "not-allowed" : "pointer" }}>
                Confirm Reject
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OCR Result Modal ── */}
      {ocrModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "460px", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "16px", fontWeight: 700, color: "#6366F1", marginBottom: "6px" }}>
              🤖 AI Extracted Data
            </div>
            <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "16px" }}>
              From: {ocrModal.doc.document_label} · Review and click Apply to update the child profile.
            </div>

            <div style={{ background: "#FAF0E8", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
              {Object.entries(ocrModal.data)
                .filter(([k, v]) => v && k !== "document_type")
                .map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: "10px", padding: "4px 0", fontSize: "13px", borderBottom: "1px solid #EDE8DF" }}>
                    <span style={{ color: "#6B7A99", minWidth: "130px", textTransform: "capitalize", fontSize: "11px", fontWeight: 700 }}>
                      {k.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontWeight: 600, color: "#1A2F4A" }}>{String(v)}</span>
                  </div>
                ))}
            </div>

            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "14px" }}>
              Applying will update: child name, date of birth, father name, mother name, address, blood group.
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              {onOcrApply && (
                <button onClick={applyOcr}
                  style={{ flex: 1, background: "#6366F1", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                  ✓ Apply to Profile
                </button>
              )}
              <button onClick={() => setOcrModal(null)}
                style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
