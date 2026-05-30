"use client";
import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KBDocument {
  id: string;
  title: string;
  target: "parent" | "staff" | "both";
  doc_type: string;
  is_active: boolean;
  chunk_count: number;
  created_at: string;
}

// ─── Style tokens ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  border: "1px solid #D5E8E4",
  borderRadius: "10px",
  padding: "9px 13px",
  fontSize: "13px",
  outline: "none",
  background: "white",
  fontFamily: "'Quicksand', sans-serif",
  width: "100%",
  boxSizing: "border-box",
  color: "#1A2F4A",
};

const lbl: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B7A99",
  display: "block",
  marginBottom: "5px",
  letterSpacing: "0.4px",
  textTransform: "uppercase",
};

const ta: React.CSSProperties = {
  ...inp,
  resize: "vertical",
  minHeight: "140px",
  lineHeight: "1.6",
};

const DOC_TYPES = [
  "handbook", "policy", "curriculum", "sop", "guidelines", "faq", "ncf", "other",
];

const TARGET_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  parent: { label: "Parents",    bg: "rgba(23,143,120,0.12)",  color: "#178F78" },
  staff:  { label: "Staff",      bg: "rgba(74,144,217,0.12)",  color: "#4A90D9" },
  both:   { label: "Both",       bg: "rgba(137,87,229,0.12)",  color: "#8957E5" },
};

const BLANK_FORM = { title: "", target: "parent", doc_type: "handbook", content: "" };

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      title={active ? "Active — click to deactivate" : "Inactive — click to activate"}
      style={{
        width: "38px", height: "22px",
        borderRadius: "11px",
        background: active ? "#178F78" : "#CBD5E1",
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute",
        top: "3px",
        left: active ? "19px" : "3px",
        width: "16px", height: "16px",
        borderRadius: "50%",
        background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.2s",
        display: "block",
      }} />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function KnowledgeBaseAdmin() {
  const [docs, setDocs]           = useState<KBDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState<Record<string, string>>(BLANK_FORM);
  const [processing, setProc]     = useState(false);
  const [procMsg, setProcMsg]     = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [deletingId, setDeleting] = useState<string | null>(null);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // ── fetch docs ──
  const load = () => {
    setLoading(true);
    fetch("/api/kb/documents")
      .then(r => r.json())
      .then(d => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── submit upload ──
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.content.trim()) { setError("Document content is required."); return; }
    setProc(true);
    setProcMsg("Ingesting document…");
    try {
      const res = await fetch("/api/kb/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:    form.title.trim(),
          content:  form.content.trim(),
          target:   form.target,
          doc_type: form.doc_type,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setSuccess(`Document ingested successfully — ${data.chunks ?? 0} chunks created.`);
        setForm(BLANK_FORM);
        if (textareaRef.current) textareaRef.current.value = "";
        load();
      } else {
        setError(data.error || "Ingest failed. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setProc(false);
      setProcMsg("");
    }
  };

  // ── toggle active ──
  const toggleActive = async (doc: KBDocument) => {
    const optimistic = docs.map(d =>
      d.id === doc.id ? { ...d, is_active: !d.is_active } : d
    );
    setDocs(optimistic);
    try {
      await fetch("/api/kb/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, is_active: !doc.is_active }),
      });
    } catch {
      setDocs(docs); // revert
    }
  };

  // ── delete doc ──
  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document and all its chunks? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch("/api/kb/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load();
    } catch {
      setError("Failed to delete document.");
    } finally {
      setDeleting(null);
    }
  };

  const setField = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "20px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: "22px",
          fontWeight: 700, color: "#178F78", display: "flex", alignItems: "center", gap: "8px",
        }}>
          📚 Knowledge Base
        </div>
        <div style={{ fontSize: "13px", color: "#6B7A99", marginTop: "2px" }}>
          Upload school documents for AI-powered Q&amp;A
        </div>
      </div>

      {/* ── Two-panel layout ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "20px",
        alignItems: "start",
      }}>

        {/* ════ LEFT: Document List ════ */}
        <div>
          {/* Stats bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: "14px",
          }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A2F4A" }}>
              Documents
            </div>
            <div style={{ fontSize: "12px", color: "#6B7A99" }}>
              {docs.filter(d => d.is_active).length} active · {docs.length} total
            </div>
          </div>

          {loading ? (
            <div style={{
              textAlign: "center", padding: "60px 20px", color: "#6B7A99",
              border: "1px dashed #D5E8E4", borderRadius: "16px",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>⏳</div>
              <div style={{ fontSize: "13px" }}>Loading documents…</div>
            </div>
          ) : docs.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "60px 20px", color: "#6B7A99",
              border: "1px dashed #D5E8E4", borderRadius: "16px", background: "#F8FFFE",
            }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📂</div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>No documents yet</div>
              <div style={{ fontSize: "12px" }}>Upload your first document using the form →</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {docs.map(doc => {
                const tgt = TARGET_LABELS[doc.target] ?? TARGET_LABELS.both;
                const isDel = deletingId === doc.id;
                return (
                  <div key={doc.id} style={{
                    border: `1px solid ${doc.is_active ? "#D5E8E4" : "#E8EAED"}`,
                    borderRadius: "14px",
                    padding: "14px 16px",
                    background: doc.is_active ? "white" : "#F8F9FA",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    opacity: isDel ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "10px",
                      background: doc.is_active ? "rgba(23,143,120,0.1)" : "rgba(107,122,153,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px", flexShrink: 0,
                    }}>
                      📄
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: "14px", color: "#1A2F4A",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {doc.title}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
                        {/* Target badge */}
                        <span style={{
                          background: tgt.bg, color: tgt.color,
                          borderRadius: "6px", padding: "2px 8px",
                          fontSize: "10px", fontWeight: 700,
                        }}>
                          {tgt.label}
                        </span>
                        {/* Doc type badge */}
                        <span style={{
                          background: "rgba(137,87,229,0.1)", color: "#8957E5",
                          borderRadius: "6px", padding: "2px 8px",
                          fontSize: "10px", fontWeight: 700,
                          textTransform: "capitalize",
                        }}>
                          {doc.doc_type}
                        </span>
                        {/* Chunks */}
                        <span style={{
                          background: "rgba(245,184,41,0.12)", color: "#92700A",
                          borderRadius: "6px", padding: "2px 8px",
                          fontSize: "10px", fontWeight: 700,
                        }}>
                          {doc.chunk_count} chunks
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                        Added {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                        <Toggle active={doc.is_active} onChange={() => toggleActive(doc)} />
                        <span style={{ fontSize: "9px", color: doc.is_active ? "#178F78" : "#9CA3AF", fontWeight: 600 }}>
                          {doc.is_active ? "Active" : "Off"}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteDoc(doc.id)}
                        disabled={isDel}
                        title="Delete document"
                        style={{
                          background: "rgba(220,38,38,0.07)",
                          border: "1px solid rgba(220,38,38,0.2)",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#DC2626",
                          cursor: isDel ? "not-allowed" : "pointer",
                        }}
                      >
                        {isDel ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ════ RIGHT: Upload Form ════ */}
        <div style={{
          background: "white",
          border: "1px solid #D5E8E4",
          borderRadius: "18px",
          padding: "20px",
          position: "sticky",
          top: "20px",
        }}>
          <div style={{
            fontFamily: "'Fredoka', sans-serif", fontSize: "16px",
            fontWeight: 700, color: "#1A2F4A", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            ➕ Upload Document
          </div>

          {/* Feedback messages */}
          {error && (
            <div style={{
              background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: "10px", padding: "9px 12px", fontSize: "12px", color: "#DC2626",
              marginBottom: "12px", display: "flex", gap: "6px", alignItems: "flex-start",
            }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{
              background: "rgba(23,143,120,0.08)", border: "1px solid rgba(23,143,120,0.25)",
              borderRadius: "10px", padding: "9px 12px", fontSize: "12px", color: "#178F78",
              marginBottom: "12px", display: "flex", gap: "6px", alignItems: "flex-start",
            }}>
              <span>✅</span><span>{success}</span>
            </div>
          )}

          <form onSubmit={handleUpload}>
            {/* Title */}
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Title *</label>
              <input
                value={form.title}
                onChange={setField("title")}
                placeholder="e.g. Parent Handbook 2024-25"
                style={inp}
                disabled={processing}
              />
            </div>

            {/* Target + Type row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={lbl}>Target</label>
                <select value={form.target} onChange={setField("target")} style={inp} disabled={processing}>
                  <option value="parent">Parents</option>
                  <option value="staff">Staff</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Type</label>
                <select value={form.doc_type} onChange={setField("doc_type")} style={inp} disabled={processing}>
                  {DOC_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content textarea */}
            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Content *</label>
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={setField("content")}
                placeholder="Paste document content here…"
                style={{ ...ta, minHeight: "180px" }}
                disabled={processing}
              />
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>
                Paste the full text of your document. The AI will chunk and index it automatically.
              </div>
            </div>

            {/* File upload hint */}
            <div style={{
              border: "1.5px dashed #D5E8E4", borderRadius: "10px",
              padding: "12px", textAlign: "center", marginBottom: "14px",
              background: "#F8FFFE",
            }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>📎</div>
              <div style={{ fontSize: "11px", color: "#6B7A99", fontWeight: 600 }}>
                File upload coming soon
              </div>
              <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "2px" }}>
                For now, copy &amp; paste content in the field above
              </div>
            </div>

            {/* Processing state */}
            {processing && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "rgba(23,143,120,0.07)", border: "1px solid rgba(23,143,120,0.2)",
                borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", fontSize: "12px", color: "#178F78",
              }}>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⚙️</span>
                <span>{procMsg || "Processing…"}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={processing}
              style={{
                width: "100%",
                background: processing
                  ? "rgba(23,143,120,0.4)"
                  : "linear-gradient(135deg, #178F78 0%, #0F6B5A 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: processing ? "not-allowed" : "pointer",
                fontFamily: "'Quicksand', sans-serif",
                transition: "opacity 0.2s",
              }}
            >
              {processing ? "Processing…" : "Upload & Process"}
            </button>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
