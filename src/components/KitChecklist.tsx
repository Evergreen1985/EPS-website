"use client";
/**
 * KIT CHECKLIST COMPONENT
 * src/components/KitChecklist.tsx
 *
 * Used in:
 *   - ChildEditModal (admin view) — full control
 *   - Teacher dashboard — can mark issued
 *   - Parent dashboard — read only + comments
 *
 * Props:
 *   enquiryId    — child's enquiry id
 *   childName    — child name
 *   programmeId  — e.g. "nursery", "jrkg"
 *   mode         — "admin" | "teacher" | "parent"
 *   issuedBy     — name of current user (admin/teacher name or parent name)
 */

import { useState, useEffect, useCallback } from "react";

const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  book:       { label: "Books",       icon: "📚", color: "#6366F1" },
  uniform:    { label: "Uniform",     icon: "👕", color: "#178F78" },
  bag:        { label: "School Bag",  icon: "🎒", color: "#E8694A" },
  stationery: { label: "Stationery", icon: "✏️", color: "#F5B829" },
  other:      { label: "Other",       icon: "📦", color: "#6B7A99" },
};

const CATEGORIES = ["book", "uniform", "bag", "stationery", "other"];

interface KitItem {
  id: string;
  item_name: string;
  item_category: string;
  quantity: number;
  size?: string;
  issued: boolean;
  issued_date?: string;
  issued_by?: string;
  issued_by_role?: string;
  school_notes?: string;
  parent_comment?: string;
  parent_acknowledged?: boolean;
}

interface Props {
  enquiryId:   string;
  childName:   string;
  programmeId: string;
  mode:        "admin" | "teacher" | "parent";
  issuedBy:    string;
  academicYearId?: string;
}

const inp: React.CSSProperties = {
  border: "1px solid #EDE8DF", borderRadius: "8px", padding: "6px 10px",
  fontSize: "12px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand',sans-serif", width: "100%", boxSizing: "border-box",
};

export default function KitChecklist({ enquiryId, childName, programmeId, mode, issuedBy, academicYearId }: Props) {
  const [items, setItems]         = useState<KitItem[]>([]);
  const [loading, setLoading]     = useState(false);
  const [initializing, setInit]   = useState(false);
  const [error, setError]         = useState("");
  const [saving, setSaving]       = useState<string | null>(null);
  const [comment, setComment]     = useState<Record<string, string>>({});
  const [editNotes, setEditNotes] = useState<string | null>(null);
  const [notesVal, setNotesVal]   = useState("");
  const [sizeVal, setSizeVal]     = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ item_name: "", item_category: "book", quantity: "1", size: "" });
  const [parentAckAll, setParentAckAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/kit?enquiryId=${enquiryId}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      // Init comment state
      const c: Record<string, string> = {};
      list.forEach((i: KitItem) => { c[i.id] = i.parent_comment || ""; });
      setComment(c);
      setParentAckAll(list.length > 0 && list.filter(i => i.issued).every(i => i.parent_acknowledged));
    } catch {}
    setLoading(false);
  }, [enquiryId]);

  useEffect(() => { if (enquiryId) load(); }, [load, enquiryId]);

  const initKit = async () => {
    setInit(true);
    setError("");
    try {
      const res  = await fetch("/api/kit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", enquiry_id: enquiryId, child_name: childName, programme_id: programmeId, academic_year_id: academicYearId }),
      });
      const data = await res.json();
      if (data.count === 0) {
        setError(`No template items found for "${programmeId}" programme. Use "+ Add Item" to add items manually.`);
        // Still reload so the empty state shows the add button
        setItems([]); // trigger show of add-manually UI
      }
      await load();
    } catch (err: any) {
      setError("Failed to set up: " + err.message);
    }
    setInit(false);
  };

  const toggleIssue = async (item: KitItem) => {
    setSaving(item.id);
    await fetch("/api/kit", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        action: item.issued ? "unissue" : "issue",
        issued_by: issuedBy,
        issued_by_role: mode,
        issued_date: new Date().toISOString().split("T")[0],
      }),
    });
    await load();
    setSaving(null);
  };

  const saveComment = async (id: string) => {
    setSaving(id);
    await fetch("/api/kit", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "parent_comment", parent_comment: comment[id] }),
    });
    await load();
    setSaving(null);
  };

  const acknowledgeAll = async () => {
    const issuedItems = items.filter(i => i.issued && !i.parent_acknowledged);
    for (const item of issuedItems) {
      await fetch("/api/kit", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "acknowledge" }),
      });
    }
    await load();
  };

  const saveNotes = async (id: string) => {
    setSaving(id);
    await fetch("/api/kit", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_notes", school_notes: notesVal, size: sizeVal }),
    });
    setEditNotes(null);
    await load();
    setSaving(null);
  };

  const addItem = async () => {
    if (!addForm.item_name) return;
    await fetch("/api/kit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", enquiry_id: enquiryId, child_name: childName, programme_id: programmeId, ...addForm, quantity: parseInt(addForm.quantity) || 1 }),
    });
    setAddForm({ item_name: "", item_category: "book", quantity: "1", size: "" });
    setShowAdd(false);
    await load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Remove this item from the list?")) return;
    await fetch("/api/kit", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  };

  // Stats
  const issuedCount  = items.filter(i => i.issued).length;
  const pendingCount = items.filter(i => !i.issued).length;
  const commentCount = items.filter(i => i.parent_comment?.trim()).length;

  if (loading) return <div style={{ padding: "20px", textAlign: "center", color: "#6B7A99" }}>Loading kit…</div>;

  // Empty state — not initialized
  if (items.length === 0) {
    return (
      <div style={{ background: "rgba(245,184,41,0.08)", border: "1px solid rgba(245,184,41,0.25)", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎒</div>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#B08000", marginBottom: "6px" }}>Kit not set up yet</div>
        <div style={{ fontSize: "12px", color: "#6B7A99", marginBottom: "14px" }}>
          {mode === "parent" ? "The school hasn't set up the kit checklist yet. Please check back later." : `Click below to auto-create the ${programmeId} checklist from the programme template.`}
        </div>
        {(mode === "admin" || mode === "teacher") && (
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={initKit} disabled={initializing}
              style={{ background: "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "9px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {initializing ? "Setting up…" : "🎒 Set Up from Template"}
            </button>
            {mode === "admin" && (
              <button onClick={() => setShowAdd(true)}
                style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", border: "1px solid rgba(23,143,120,0.3)", borderRadius: "10px", padding: "9px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                + Add Items Manually
              </button>
            )}
          </div>
        )}
        {error && <div style={{ marginTop: "10px", fontSize: "12px", color: "#DC2626", fontWeight: 600 }}>⚠️ {error}</div>}
      </div>
    );
  }

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
          ✅ {issuedCount} issued
        </div>
        <div style={{ background: "rgba(245,184,41,0.12)", color: "#B08000", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
          ⏳ {pendingCount} pending
        </div>
        {commentCount > 0 && (
          <div style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: 700 }}>
            💬 {commentCount} parent comment{commentCount > 1 ? "s" : ""}
          </div>
        )}
        {/* Parent: acknowledge all */}
        {mode === "parent" && issuedCount > 0 && !parentAckAll && (
          <button onClick={acknowledgeAll}
            style={{ marginLeft: "auto", background: "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "6px 14px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            ✓ Acknowledge All Received
          </button>
        )}
        {/* Admin: add custom item */}
        {mode === "admin" && (
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ marginLeft: "auto", background: "rgba(23,143,120,0.1)", color: "#178F78", border: "none", borderRadius: "10px", padding: "6px 14px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
            + Add Item
          </button>
        )}
      </div>

      {/* Add custom item form */}
      {showAdd && mode === "admin" && (
        <div style={{ background: "#FAF0E8", borderRadius: "12px", padding: "12px 14px", marginBottom: "12px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "8px", alignItems: "end" }}>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "3px" }}>ITEM NAME</label>
            <input style={inp} value={addForm.item_name} onChange={e => setAddForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Science Book" />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "3px" }}>CATEGORY</label>
            <select style={inp} value={addForm.item_category} onChange={e => setAddForm(p => ({ ...p, item_category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "3px" }}>QTY</label>
            <input style={inp} type="number" min="1" value={addForm.quantity} onChange={e => setAddForm(p => ({ ...p, quantity: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, color: "#6B7A99", display: "block", marginBottom: "3px" }}>SIZE</label>
            <input style={inp} value={addForm.size} onChange={e => setAddForm(p => ({ ...p, size: e.target.value }))} placeholder="optional" />
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={addItem} style={{ background: "#178F78", color: "white", border: "none", borderRadius: "8px", padding: "7px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Add</button>
            <button onClick={() => setShowAdd(false)} style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}

      {error && <div style={{ color: "#DC2626", fontSize: "12px", marginBottom: "8px" }}>⚠️ {error}</div>}

      {/* Items grouped by category */}
      {CATEGORIES.map(cat => {
        const catItems = items.filter(i => i.item_category === cat);
        if (!catItems.length) return null;
        const meta = CATEGORY_META[cat];

        return (
          <div key={cat} style={{ marginBottom: "14px" }}>
            {/* Category header */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", paddingBottom: "5px", borderBottom: `2px solid ${meta.color}25` }}>
              <span style={{ fontSize: "16px" }}>{meta.icon}</span>
              <span style={{ fontWeight: 700, fontSize: "12px", color: meta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{meta.label}</span>
              <span style={{ fontSize: "10px", color: "#9CA3AF" }}>({catItems.filter(i => i.issued).length}/{catItems.length} issued)</span>
            </div>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {catItems.map(item => {
                const isEditing = editNotes === item.id;
                return (
                  <div key={item.id} style={{ background: item.issued ? "rgba(23,143,120,0.04)" : "white", borderRadius: "10px", border: `1px solid ${item.issued ? "rgba(23,143,120,0.2)" : item.parent_comment ? "rgba(220,38,38,0.2)" : "#EDE8DF"}`, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>

                      {/* Checkbox — admin and teacher can toggle */}
                      {(mode === "admin" || mode === "teacher") ? (
                        <button onClick={() => toggleIssue(item)} disabled={saving === item.id}
                          style={{ width: "22px", height: "22px", borderRadius: "6px", border: `2px solid ${item.issued ? "#178F78" : "#EDE8DF"}`, background: item.issued ? "#178F78" : "white", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginTop: "1px" }}>
                          {saving === item.id ? "…" : item.issued ? "✓" : ""}
                        </button>
                      ) : (
                        <div style={{ width: "22px", height: "22px", borderRadius: "6px", border: `2px solid ${item.issued ? "#178F78" : "#EDE8DF"}`, background: item.issued ? "#178F78" : "white", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "white", marginTop: "1px" }}>
                          {item.issued ? "✓" : ""}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A" }}>{item.item_name}</span>
                          {item.quantity > 1 && <span style={{ fontSize: "10px", color: "#6B7A99", background: "#FAF0E8", borderRadius: "20px", padding: "1px 7px" }}>×{item.quantity}</span>}
                          {item.size && <span style={{ fontSize: "10px", color: "#6366F1", background: "rgba(99,102,241,0.08)", borderRadius: "20px", padding: "1px 7px" }}>Size: {item.size}</span>}
                          {item.parent_acknowledged && <span style={{ fontSize: "10px", color: "#178F78" }}>✓ Parent confirmed</span>}
                        </div>

                        {/* Issued info */}
                        {item.issued && item.issued_by && (
                          <div style={{ fontSize: "10px", color: "#178F78", marginTop: "2px" }}>
                            Issued by {item.issued_by} ({item.issued_by_role}) on {item.issued_date ? new Date(item.issued_date).toLocaleDateString("en-IN") : "—"}
                          </div>
                        )}

                        {/* School notes */}
                        {item.school_notes && !isEditing && (
                          <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "3px", fontStyle: "italic" }}>📝 {item.school_notes}</div>
                        )}

                        {/* Edit notes (admin only) */}
                        {isEditing && mode === "admin" && (
                          <div style={{ marginTop: "6px", display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "6px" }}>
                            <input style={inp} placeholder="School notes…" value={notesVal} onChange={e => setNotesVal(e.target.value)} />
                            <input style={inp} placeholder="Size (S/M/L)" value={sizeVal} onChange={e => setSizeVal(e.target.value)} />
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button onClick={() => saveNotes(item.id)} style={{ background: "#178F78", color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>Save</button>
                              <button onClick={() => setEditNotes(null)} style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "6px", padding: "5px 8px", fontSize: "11px", cursor: "pointer" }}>✕</button>
                            </div>
                          </div>
                        )}

                        {/* Parent comment */}
                        {item.parent_comment && (
                          <div style={{ marginTop: "4px", background: "rgba(220,38,38,0.06)", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", color: "#DC2626" }}>
                            💬 Parent: {item.parent_comment}
                          </div>
                        )}

                        {/* Parent: add comment if item issued */}
                        {mode === "parent" && item.issued && (
                          <div style={{ marginTop: "6px", display: "flex", gap: "6px" }}>
                            <input style={{ ...inp, fontSize: "11px" }}
                              placeholder="Comment if anything is missing or wrong…"
                              value={comment[item.id] || ""}
                              onChange={e => setComment(p => ({ ...p, [item.id]: e.target.value }))} />
                            <button onClick={() => saveComment(item.id)} disabled={saving === item.id}
                              style={{ background: "#178F78", color: "white", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                              {saving === item.id ? "…" : "Send"}
                            </button>
                          </div>
                        )}

                        {/* Parent: pending item */}
                        {mode === "parent" && !item.issued && (
                          <div style={{ fontSize: "10px", color: "#B08000", marginTop: "2px" }}>⏳ Not yet issued by school</div>
                        )}
                      </div>

                      {/* Admin actions */}
                      {mode === "admin" && (
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button onClick={() => { setEditNotes(item.id); setNotesVal(item.school_notes || ""); setSizeVal(item.size || ""); }}
                            style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>
                            ✏️
                          </button>
                          <button onClick={() => deleteItem(item.id)}
                            style={{ background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "none", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", cursor: "pointer" }}>
                            🗑
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Parent: overall acknowledge */}
      {mode === "parent" && issuedCount > 0 && (
        <div style={{ marginTop: "14px", background: parentAckAll ? "rgba(23,143,120,0.08)" : "#FAF0E8", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: parentAckAll ? "#178F78" : "#6B7A99", fontWeight: parentAckAll ? 700 : 400 }}>
            {parentAckAll ? "✅ You have confirmed receipt of all issued items." : `${issuedCount} item${issuedCount > 1 ? "s" : ""} issued — please confirm you received them.`}
          </div>
          {!parentAckAll && (
            <button onClick={acknowledgeAll}
              style={{ background: "#178F78", color: "white", border: "none", borderRadius: "10px", padding: "7px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              ✓ Confirm Receipt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
