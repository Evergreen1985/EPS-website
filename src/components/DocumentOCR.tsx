"use client";
/**
 * DOCUMENT OCR COMPONENT
 * src/components/DocumentOCR.tsx
 *
 * Drop-in component for ChildEditModal — uploads a document image,
 * sends to Claude Vision API, returns extracted fields.
 *
 * Usage:
 *   <DocumentOCR onExtracted={(fields) => setForm(p => ({ ...p, ...fields }))} />
 */

import { useState, useRef } from "react";

interface ExtractedFields {
  child_name?:     string | null;
  child_dob?:      string | null;
  father_name?:    string | null;
  mother_name?:    string | null;
  address?:        string | null;
  gender?:         string | null;
  blood_group?:    string | null;
  document_type?:  string | null;
}

interface Props {
  onExtracted: (fields: ExtractedFields) => void;
}

export default function DocumentOCR({ onExtracted }: Props) {
  const [scanning, setScanning]   = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const [result, setResult]       = useState<ExtractedFields | null>(null);
  const [error, setError]         = useState("");
  const [expanded, setExpanded]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Please upload an image file (JPG, PNG) or PDF.");
      return;
    }

    setScanning(true);
    setError("");
    setResult(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const mediaType = file.type === "application/pdf" ? "image/jpeg" : file.type as any;

      const res  = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "OCR failed. Try a clearer image.");
        return;
      }

      // Filter out null values and document_type before showing
      const fields: ExtractedFields = data.data;
      setResult(fields);
    } catch (err: any) {
      setError("Failed to process document: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const applyFields = (fields: ExtractedFields) => {
    // Only pass non-null fields
    const cleaned: any = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v !== null && v !== undefined && k !== "document_type" && k !== "aadhaar_number") {
        cleaned[k] = v;
      }
    }
    onExtracted(cleaned);
    setExpanded(false);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError("");
    setScanning(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Toggle button */}
      <button type="button" onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "center", gap: "8px", background: expanded ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", border: "1.5px dashed #6366F1", borderRadius: "12px", padding: "10px 16px", cursor: "pointer", width: "100%", color: "#6366F1", fontWeight: 700, fontSize: "13px", fontFamily: "'Quicksand', sans-serif" }}>
        <span style={{ fontSize: "18px" }}>🤖</span>
        <span>Auto-fill from Document (Aadhaar / Birth Certificate)</span>
        <span style={{ marginLeft: "auto", fontSize: "11px", opacity: 0.7 }}>{expanded ? "▲ Hide" : "▼ Open"}</span>
      </button>

      {expanded && (
        <div style={{ background: "rgba(99,102,241,0.04)", border: "1.5px solid rgba(99,102,241,0.15)", borderRadius: "0 0 14px 14px", padding: "16px", marginTop: "-2px" }}>

          {/* Upload area */}
          {!preview && (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{ border: "2px dashed #6366F1", borderRadius: "12px", padding: "28px", textAlign: "center", cursor: "pointer", background: "white", transition: "all 0.2s" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📄</div>
              <div style={{ fontWeight: 700, color: "#6366F1", fontSize: "14px" }}>Upload Aadhaar or Birth Certificate</div>
              <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "4px" }}>Click to browse or drag & drop — JPG, PNG supported</div>
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {/* Scanning state */}
          {scanning && (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px", animation: "pulse 1s infinite" }}>🔍</div>
              <div style={{ fontWeight: 700, color: "#6366F1", fontSize: "14px" }}>Claude AI is reading the document…</div>
              <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "4px" }}>Extracting child name, DOB, parent details</div>
            </div>
          )}

          {/* Preview + result */}
          {preview && !scanning && (
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "16px", alignItems: "start" }}>
              <img src={preview} alt="Document" style={{ width: "120px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "1px solid #EDE8DF" }} />
              <div>
                {result && (
                  <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "8px" }}>
                    📋 Detected: <strong style={{ color: "#6366F1" }}>{result.document_type || "Document"}</strong>
                  </div>
                )}
                {result && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
                    {Object.entries(result)
                      .filter(([k, v]) => v && k !== "document_type" && k !== "aadhaar_number")
                      .map(([k, v]) => (
                        <div key={k} style={{ display: "flex", gap: "8px", fontSize: "12px" }}>
                          <span style={{ color: "#6B7A99", minWidth: "110px", textTransform: "capitalize" }}>
                            {k.replace(/_/g, " ")}:
                          </span>
                          <span style={{ fontWeight: 700, color: "#1A2F4A" }}>{v}</span>
                        </div>
                      ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  {result && (
                    <button type="button" onClick={() => applyFields(result)}
                      style={{ background: "#6366F1", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      ✓ Apply to Form
                    </button>
                  )}
                  <button type="button" onClick={reset}
                    style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", cursor: "pointer" }}>
                    ↺ Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "rgba(220,38,38,0.08)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", fontWeight: 600, marginTop: "8px" }}>
              ⚠️ {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
