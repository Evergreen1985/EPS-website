"use client";
/**
 * EXCEL IMPORT COMPONENT
 * src/components/ExcelImport.tsx
 *
 * Add to admin/page.tsx:
 *   import ExcelImport from "@/components/ExcelImport";
 *   { key:"import", label:"📥 Import", count:0 }
 *   {tab === "import" && <ExcelImport onImported={() => { loadEnquiries(); }} />}
 */

import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ── Column definitions ────────────────────────────────────────────────────────
const STUDENT_COLS = [
  { key: "child_name",    label: "Child Name",     required: true,  type: "text",   example: "Arjun Kumar"       },
  { key: "child_dob",     label: "Date of Birth",  required: false, type: "date",   example: "15/08/2020"        },
  { key: "program_label", label: "Programme",      required: false, type: "select", example: "Nursery",
    options: ["Infant Care","Playgroup","Nursery","Junior KG","Senior KG","Full-Day Daycare","After-School"] },
  { key: "status",        label: "Status",         required: false, type: "select", example: "enrolled",
    options: ["new","called","visited","enrolled","not-interested"] },
  { key: "father_name",   label: "Father Name",    required: false, type: "text",   example: "Ramesh Kumar"      },
  { key: "father_phone",  label: "Father Phone",   required: false, type: "text",   example: "9876543210"        },
  { key: "mother_name",   label: "Mother Name",    required: false, type: "text",   example: "Sunita Kumar"      },
  { key: "mother_phone",  label: "Mother Phone",   required: false, type: "text",   example: "9876543211"        },
  { key: "phone",         label: "Primary Phone",  required: false, type: "text",   example: "9876543210"        },
  { key: "blood_group",   label: "Blood Group",    required: false, type: "select", example: "O+",
    options: ["","A+","A-","B+","B-","AB+","AB-","O+","O-"] },
  { key: "address",       label: "Address",        required: false, type: "text",   example: "123 Main St"       },
  { key: "allergies",     label: "Allergies",      required: false, type: "text",   example: "Peanut allergy"    },
  { key: "notes",         label: "Notes",          required: false, type: "text",   example: ""                  },
];

const STAFF_COLS = [
  { key: "name",             label: "Full Name",        required: true,  type: "text",   example: "Ms. Priya Sharma"  },
  { key: "role",             label: "Role",             required: false, type: "select", example: "Teacher",
    options: ["Teacher","Class Teacher","Admin","Helper","Driver","Cook","Security"] },
  { key: "phone",            label: "Phone",            required: false, type: "text",   example: "9876543210"        },
  { key: "email",            label: "Email",            required: false, type: "text",   example: "priya@school.com"  },
  { key: "dob",              label: "Date of Birth",    required: false, type: "date",   example: "15/03/1990"        },
  { key: "join_date",        label: "Joining Date",     required: false, type: "date",   example: "01/06/2022"        },
  { key: "last_working_day", label: "Last Working Day", required: false, type: "date",   example: ""                  },
  { key: "address",          label: "Address",          required: false, type: "text",   example: "456 Park Ave"      },
  { key: "notes",            label: "Notes",            required: false, type: "text",   example: ""                  },
];

type ImportType = "students" | "staff";
type EditableRow = { [key: string]: string; _id: string; _errors: string[]; _saved?: boolean; _saving?: boolean; _saveError?: string; };

// ── Utility ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function parseDate(v: any): string {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d+$/.test(s) && Number(s) > 1000) {
    const d = new Date((Number(s) - 25569) * 86400 * 1000);
    return d.toISOString().split("T")[0];
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [day, month, year] = s.split("/");
    return `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [day, month, year] = s.split("-");
    return `${year}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function validateRow(row: EditableRow, cols: typeof STUDENT_COLS): string[] {
  const errors: string[] = [];
  for (const col of cols) {
    if (col.required && !row[col.key]?.trim()) {
      errors.push(`${col.label} is required`);
    }
  }
  return errors;
}

function colLetter(idx: number): string {
  let s = "";
  idx++;
  while (idx > 0) { s = String.fromCharCode(65 + ((idx - 1) % 26)) + s; idx = Math.floor((idx - 1) / 26); }
  return s;
}

function downloadTemplate(type: ImportType) {
  const cols    = type === "students" ? STUDENT_COLS : STAFF_COLS;
  const sheetNm = type === "students" ? "Students" : "Staff";
  const wb      = XLSX.utils.book_new();

  // Main data sheet
  const ws = XLSX.utils.aoa_to_sheet([
    cols.map(c => c.label),
    cols.map(c => c.required ? "★ REQUIRED" : "optional"),
    cols.map(c => c.example),
  ]);
  ws["!cols"] = cols.map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(wb, ws, sheetNm);

  // Valid Values reference sheet
  const refRows: any[][] = [["Column", "Valid Values / Format", "Required?"]];
  cols.forEach(col => {
    if (col.type === "select" && (col as any).options?.length) {
      refRows.push([
        col.label,
        (col as any).options.filter((o: string) => o !== "").join(" | "),
        col.required ? "★ Yes" : "No",
      ]);
    } else if (col.type === "date") {
      refRows.push([col.label, "DD/MM/YYYY  e.g. 15/08/2020", col.required ? "★ Yes" : "No"]);
    }
  });
  const wsRef = XLSX.utils.aoa_to_sheet(refRows);
  wsRef["!cols"] = [{ wch: 22 }, { wch: 55 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsRef, "Valid Values");

  // Instructions sheet
  const wsI = XLSX.utils.aoa_to_sheet([
    ["EVERGREEN PRESCHOOL — DATA IMPORT TEMPLATE"],
    [""],
    ["HOW TO USE:"],
    ["1. Go to the '" + sheetNm + "' sheet — enter your data here"],
    ["2. Delete row 2 (★ REQUIRED labels) and row 3 (example) before uploading"],
    ["3. Keep column headers in row 1 exactly as they are"],
    ["4. See the 'Valid Values' sheet for allowed values per column"],
    ["5. Date columns — DD/MM/YYYY format (e.g. 15/08/2020)"],
    ["6. Save as .xlsx before uploading to the admin panel"],
    [""],
    ["★ = Required — must be filled for every row"],
  ]);
  wsI["!cols"] = [{ wch: 65 }];
  XLSX.utils.book_append_sheet(wb, wsI, "Instructions");

  XLSX.writeFile(wb, `evergreen_${type}_template.xlsx`);
}


function parseExcelFile(file: File, type: ImportType): Promise<EditableRow[]> {
  const cols = type === "students" ? STUDENT_COLS : STAFF_COLS;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array", cellDates: false });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const raw  = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

        // Build label→key map
        const labelToKey: Record<string, string> = {};
        cols.forEach(c => {
          labelToKey[c.label.toLowerCase()] = c.key;
          labelToKey[c.key.toLowerCase()]   = c.key;
        });

        const rows: EditableRow[] = [];
        for (const raw_row of raw) {
          const row: EditableRow = { _id: uid(), _errors: [] };
          let isEmpty = true;

          for (const [k, v] of Object.entries(raw_row)) {
            const lower  = k.toLowerCase().trim().replace(/★\s*/,"");
            const mapped = labelToKey[lower] || lower.replace(/\s+/g,"_");
            const col    = cols.find(c => c.key === mapped);
            let val      = String(v ?? "").trim();

            // Skip template meta rows
            if (val === "★ REQUIRED" || val === "optional" || val === "REQUIRED") {
              isEmpty = false; // prevent skipping but we'll detect it
              row._isMetaRow = true as any;
              break;
            }
            if (col?.type === "date") val = parseDate(val);
            row[mapped] = val;
            if (val) isEmpty = false;
          }

          if (isEmpty || (row as any)._isMetaRow) continue;

          // Fill missing cols
          cols.forEach(c => { if (row[c.key] === undefined) row[c.key] = ""; });
          row._errors = validateRow(row, cols);
          rows.push(row);
        }
        resolve(rows);
      } catch (err: any) {
        reject(new Error("Could not parse file: " + err.message));
      }
    };
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { onImported: () => void; }

export default function ExcelImport({ onImported }: Props) {
  const [importType, setImportType]     = useState<ImportType>("students");
  const [rows, setRows]                 = useState<EditableRow[]>([]);
  const [fileName, setFileName]         = useState("");
  const [parseError, setParseError]     = useState("");
  const [dragOver, setDragOver]         = useState(false);
  const [savingAll, setSavingAll]       = useState(false);
  const [saveResult, setSaveResult]     = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [editingCell, setEditingCell]   = useState<{ rowId: string; col: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cols = importType === "students" ? STUDENT_COLS : STAFF_COLS;
  const validRows   = rows.filter(r => r._errors.length === 0 && !r._saved);
  const savedRows   = rows.filter(r => r._saved);
  const invalidRows = rows.filter(r => r._errors.length > 0);

  // ── File handling ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError("Please upload an .xlsx, .xls or .csv file.");
      return;
    }
    setParseError(""); setSaveResult(null); setFileName(file.name);
    try {
      const parsed = await parseExcelFile(file, importType);
      setRows(parsed);
    } catch (err: any) {
      setParseError(err.message); setRows([]);
    }
  }, [importType]);

  const reset = () => {
    setRows([]); setFileName(""); setParseError(""); setSaveResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Inline cell edit ─────────────────────────────────────────────────────────
  const updateCell = (rowId: string, colKey: string, value: string) => {
    setRows(prev => prev.map(r => {
      if (r._id !== rowId) return r;
      const updated = { ...r, [colKey]: value };
      updated._errors = validateRow(updated, cols);
      return updated;
    }));
  };

  const deleteRow = (rowId: string) => {
    setRows(prev => prev.filter(r => r._id !== rowId));
  };

  const addBlankRow = () => {
    const blank: EditableRow = { _id: uid(), _errors: [] };
    cols.forEach(c => { blank[c.key] = ""; });
    blank._errors = validateRow(blank, cols);
    setRows(prev => [...prev, blank]);
  };

  // ── Save single row ──────────────────────────────────────────────────────────
  const saveRow = async (rowId: string) => {
    const row = rows.find(r => r._id === rowId);
    if (!row || row._errors.length > 0) return;

    setRows(prev => prev.map(r => r._id === rowId ? { ...r, _saving: true, _saveError: "" } : r));
    try {
      const endpoint = importType === "students" ? "/api/import/students" : "/api/import/staff";
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [row] }),
      });
      const data = await res.json();
      if (data.success && data.results.success > 0) {
        setRows(prev => prev.map(r => r._id === rowId ? { ...r, _saving: false, _saved: true } : r));
        onImported();
      } else {
        const errMsg = data.results?.errors?.[0] || data.error || "Save failed";
        setRows(prev => prev.map(r => r._id === rowId ? { ...r, _saving: false, _saveError: errMsg } : r));
      }
    } catch (err: any) {
      setRows(prev => prev.map(r => r._id === rowId ? { ...r, _saving: false, _saveError: err.message } : r));
    }
  };

  // ── Save all valid rows ───────────────────────────────────────────────────────
  const saveAll = async () => {
    if (validRows.length === 0) return;
    setSavingAll(true); setSaveResult(null);
    try {
      const endpoint = importType === "students" ? "/api/import/students" : "/api/import/staff";
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult(data.results);
        // Mark saved rows
        const savedNames = new Set(validRows.map(r =>
          importType === "students" ? r.child_name : r.name
        ));
        setRows(prev => prev.map(r => {
          const name = importType === "students" ? r.child_name : r.name;
          return savedNames.has(name) && r._errors.length === 0 ? { ...r, _saved: true } : r;
        }));
        onImported();
      } else {
        setSaveResult({ success: 0, failed: validRows.length, errors: [data.error || "Import failed"] });
      }
    } catch (err: any) {
      setSaveResult({ success: 0, failed: validRows.length, errors: [err.message] });
    } finally {
      setSavingAll(false);
    }
  };

  const inp: React.CSSProperties = {
    border: "1px solid #EDE8DF", borderRadius: "6px", padding: "4px 8px",
    fontSize: "12px", outline: "none", background: "#FAF0E8",
    fontFamily: "'Quicksand',sans-serif", width: "100%", boxSizing: "border-box",
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Type selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {(["students","staff"] as ImportType[]).map(t => (
          <button key={t} onClick={() => { setImportType(t); reset(); }}
            style={{ padding: "9px 20px", borderRadius: "12px", border: `2px solid ${importType === t ? "#178F78" : "#EDE8DF"}`, cursor: "pointer",
              fontWeight: 700, fontSize: "13px", fontFamily: "'Quicksand',sans-serif",
              background: importType === t ? "#178F78" : "white",
              color:      importType === t ? "white"   : "#6B7A99" }}>
            {t === "students" ? "👶 Students / Children" : "👩‍🏫 Staff / Teachers"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        /* ── Upload screen ── */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {/* Download template */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "20px" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A2F4A", marginBottom: "6px" }}>
              📄 Step 1 — Download Template
            </div>
            <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "16px" }}>
              Download the Excel template with the correct columns. Fill your data and upload below.
            </div>
            <button onClick={() => downloadTemplate(importType)}
              style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand',sans-serif", width: "100%" }}>
              ⬇️ Download {importType === "students" ? "Student" : "Staff"} Template
            </button>
            <div style={{ marginTop: "14px", fontSize: "11px", color: "#6B7A99", lineHeight: "1.6" }}>
              <strong>Columns included:</strong><br />
              {cols.map(c => (
                <span key={c.key} style={{ marginRight: "6px", display: "inline-block" }}>
                  <span style={{ color: c.required ? "#E8694A" : "#6B7A99" }}>
                    {c.required ? "★" : "·"} {c.label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", padding: "20px" }}>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A2F4A", marginBottom: "6px" }}>
              📤 Step 2 — Upload Your File
            </div>
            <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "16px" }}>
              Upload the filled Excel file. You can review and edit everything before saving to DB.
            </div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => inputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#178F78" : "#EDE8DF"}`, borderRadius: "12px", padding: "28px 16px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(23,143,120,0.04)" : "#FAF0E8", transition: "all 0.2s" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
              <div style={{ fontWeight: 700, color: "#178F78", fontSize: "13px" }}>Click to browse or drag & drop</div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>.xlsx, .xls, .csv supported</div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            {parseError && (
              <div style={{ marginTop: "10px", background: "rgba(220,38,38,0.08)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", fontWeight: 600 }}>
                ⚠️ {parseError}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Preview & Edit screen ── */
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "17px", fontWeight: 700, color: "#1A2F4A" }}>
                📋 Review & Edit — {fileName}
              </div>
              <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>
                <span style={{ color: "#178F78", fontWeight: 700 }}>{validRows.length} ready</span>
                {invalidRows.length > 0 && <span style={{ color: "#DC2626", fontWeight: 700, marginLeft: "10px" }}>{invalidRows.length} with errors</span>}
                {savedRows.length > 0 && <span style={{ color: "#6B7A99", marginLeft: "10px" }}>{savedRows.length} saved</span>}
              </div>
            </div>
            <button onClick={addBlankRow}
              style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              + Add Row
            </button>
            <button onClick={saveAll} disabled={savingAll || validRows.length === 0}
              style={{ background: validRows.length === 0 ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: validRows.length === 0 ? "not-allowed" : "pointer", fontFamily: "'Quicksand',sans-serif" }}>
              {savingAll ? "Saving…" : `💾 Save All (${validRows.length})`}
            </button>
            <button onClick={reset}
              style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>
              ✕ Clear
            </button>
          </div>

          {/* Save result banner */}
          {saveResult && (
            <div style={{ background: saveResult.failed === 0 ? "rgba(23,143,120,0.1)" : "rgba(220,38,38,0.08)", border: `1px solid ${saveResult.failed === 0 ? "#178F78" : "#DC2626"}40`, borderRadius: "12px", padding: "12px 16px", marginBottom: "12px" }}>
              <div style={{ fontWeight: 700, fontSize: "13px", color: saveResult.failed === 0 ? "#178F78" : "#DC2626" }}>
                {saveResult.failed === 0
                  ? `✅ All ${saveResult.success} records saved successfully!`
                  : `⚠️ ${saveResult.success} saved, ${saveResult.failed} failed`}
              </div>
              {saveResult.errors.map((e, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#DC2626", marginTop: "3px" }}>• {e}</div>
              ))}
            </div>
          )}

          {/* Editable table */}
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid #EDE8DF", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#1A2F4A" }}>
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "10px", textAlign: "left", width: "32px" }}>#</th>
                    {cols.map(c => (
                      <th key={c.key} style={{ padding: "10px 8px", color: "white", fontWeight: 700, fontSize: "10px", textAlign: "left", whiteSpace: "nowrap" }}>
                        {c.label}{c.required && <span style={{ color: "#F5B829", marginLeft: "3px" }}>★</span>}
                      </th>
                    ))}
                    <th style={{ padding: "10px 8px", color: "rgba(255,255,255,0.5)", fontSize: "10px", width: "80px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const hasError  = row._errors.length > 0;
                    const isSaved   = row._saved;
                    const isSaving  = row._saving;
                    const rowBg     = isSaved ? "rgba(23,143,120,0.04)" : hasError ? "rgba(220,38,38,0.03)" : "white";
                    const rowBorder = isSaved ? "2px solid rgba(23,143,120,0.2)" : hasError ? "2px solid rgba(220,38,38,0.15)" : "1px solid #EDE8DF";

                    return (
                      <tr key={row._id} style={{ background: rowBg, borderBottom: rowBorder, opacity: isSaved ? 0.7 : 1 }}>
                        {/* Row number */}
                        <td style={{ padding: "6px 8px", color: "#9CA3AF", fontWeight: 600, fontSize: "11px", textAlign: "center" }}>
                          {isSaved ? "✅" : hasError ? "⚠️" : idx + 1}
                        </td>

                        {/* Editable cells */}
                        {cols.map(col => {
                          const isEditing = editingCell?.rowId === row._id && editingCell?.col === col.key;
                          const val       = row[col.key] || "";

                          return (
                            <td key={col.key} style={{ padding: "4px 6px", maxWidth: "180px" }}
                              onDoubleClick={() => !isSaved && setEditingCell({ rowId: row._id, col: col.key })}>
                              {isEditing ? (
                                col.type === "select" ? (
                                  <select
                                    autoFocus
                                    value={val}
                                    onChange={e => updateCell(row._id, col.key, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    style={{ ...inp, minWidth: "120px" }}>
                                    {(col as any).options?.map((o: string) => <option key={o} value={o}>{o || "—"}</option>)}
                                  </select>
                                ) : col.type === "date" ? (
                                  <input
                                    autoFocus
                                    type="date"
                                    value={val}
                                    onChange={e => updateCell(row._id, col.key, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    style={inp} />
                                ) : (
                                  <input
                                    autoFocus
                                    type="text"
                                    value={val}
                                    onChange={e => updateCell(row._id, col.key, e.target.value)}
                                    onBlur={() => setEditingCell(null)}
                                    onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingCell(null); }}
                                    style={{ ...inp, minWidth: "120px" }} />
                                )
                              ) : (
                                <div style={{ padding: "3px 4px", borderRadius: "4px", cursor: isSaved ? "default" : "pointer", minHeight: "22px", fontSize: "12px", color: val ? "#1A2F4A" : "#C4C4C4", background: !isSaved && !val && col.required ? "rgba(220,38,38,0.06)" : "transparent", border: !isSaved ? "1px solid transparent" : "none", transition: "all 0.1s" }}
                                  title={!isSaved ? "Double-click to edit" : ""}>
                                  {val || (col.required && !isSaved ? <em style={{ color: "#E8694A" }}>required</em> : <span style={{ color: "#D1D5DB" }}>—</span>)}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Row actions */}
                        <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                          {isSaved ? (
                            <span style={{ fontSize: "10px", color: "#178F78", fontWeight: 700 }}>Saved</span>
                          ) : (
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                disabled={hasError || isSaving}
                                onClick={() => saveRow(row._id)}
                                title={hasError ? row._errors.join(", ") : "Save this row"}
                                style={{ background: hasError ? "#EDE8DF" : "rgba(23,143,120,0.1)", color: hasError ? "#9CA3AF" : "#178F78", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", fontWeight: 700, cursor: hasError ? "not-allowed" : "pointer" }}>
                                {isSaving ? "…" : "💾"}
                              </button>
                              <button onClick={() => deleteRow(row._id)}
                                style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>
                                🗑
                              </button>
                            </div>
                          )}
                          {row._saveError && (
                            <div style={{ fontSize: "9px", color: "#DC2626", marginTop: "2px", maxWidth: "80px", whiteSpace: "normal" }}>{row._saveError}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Error summary */}
            {invalidRows.length > 0 && (
              <div style={{ background: "rgba(220,38,38,0.04)", borderTop: "1px solid rgba(220,38,38,0.15)", padding: "12px 16px" }}>
                <div style={{ fontWeight: 700, fontSize: "12px", color: "#DC2626", marginBottom: "6px" }}>
                  ⚠️ {invalidRows.length} rows have errors — fix them in the table above (double-click a cell to edit)
                </div>
                {invalidRows.slice(0, 5).map(r => (
                  <div key={r._id} style={{ fontSize: "11px", color: "#DC2626", marginTop: "2px" }}>
                    • {importType === "students" ? (r.child_name || "Unnamed") : (r.name || "Unnamed")}: {r._errors.join(", ")}
                  </div>
                ))}
                {invalidRows.length > 5 && <div style={{ fontSize: "11px", color: "#DC2626" }}>…and {invalidRows.length - 5} more</div>}
              </div>
            )}

            {/* Footer hint */}
            <div style={{ padding: "10px 16px", background: "#FAF0E8", fontSize: "11px", color: "#9CA3AF", borderTop: "1px solid #EDE8DF" }}>
              💡 Double-click any cell to edit • Save individual rows with 💾 or save all valid rows at once
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
