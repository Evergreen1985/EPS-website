"use client";
/**
 * STAFF TAB
 * Place in src/components/StaffTab.tsx
 *
 * Add to admin/page.tsx:
 *   import StaffTab from "@/components/StaffTab";
 *   {tab === "staff" && <StaffTab />}
 */

import { useState, useEffect, useCallback } from "react";

const inp: React.CSSProperties = {
  border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px",
  fontSize: "13px", outline: "none", background: "#FAF0E8",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  fontSize: "10px", fontWeight: 700, color: "#6B7A99",
  display: "block", marginBottom: "4px", letterSpacing: "0.4px",
};

const ROLES = ["Teacher", "Class Teacher", "Admin", "Helper", "Driver", "Cook", "Security"];

const ROLE_COLORS: Record<string, string> = {
  "Teacher":       "#178F78",
  "Class Teacher": "#178F78",
  "Admin":         "#E8694A",
  "Helper":        "#6366F1",
  "Driver":        "#F5B829",
  "Cook":          "#EC4899",
  "Security":      "#6B7280",
};

const blankForm = () => ({
  name: "", role: "Teacher", phone: "", email: "",
  address: "", join_date: "", dob: "", notes: "",
  last_working_day: "",
});

export default function StaffTab() {
  const [staff, setStaff]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [loadError, setLoadError]   = useState("");
  const [modal, setModal]           = useState<any>(null);
  const [form, setForm]             = useState(blankForm());
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [roles, setRoles]           = useState<string[]>(ROLES);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch("/api/staff");
      const data = await res.json();
      if (!res.ok) setLoadError(data.error || `API error ${res.status}`);
      else setStaff(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLoadError("Cannot reach /api/staff — " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load custom roles from owner
  useEffect(() => {
    fetch("/api/owner/roles").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.roles?.length) setRoles(d.roles.map((r: any) => r.name));
    }).catch(() => {});
  }, []);

  const openNew = () => {
    setForm(blankForm());
    setModal({});
  };

  const openEdit = (s: any) => {
    setForm({
      name:      s.name      || "",
      role:      s.role      || "Teacher",
      phone:     s.phone     || "",
      email:     s.email     || "",
      address:   s.address   || "",
      join_date: s.join_date || "",
      dob:       s.dob       || "",
      notes:     s.notes     || "",
      last_working_day: s.last_working_day || "",
    });
    setModal(s);
  };

  const save = async () => {
    if (!form.name.trim()) { setSaveError("Name is required"); return; }
    setSaving(true);
    setSaveError("");
    const payload = modal?.id ? { id: modal.id, ...form } : form;
    try {
      const res  = await fetch("/api/staff", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) { setModal(null); load(); }
      else setSaveError(data.error || "Failed to save — please try again");
    } catch (e: any) {
      setSaveError("Network error: " + e.message);
    }
    setSaving(false);
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from staff?`)) return;
    await fetch("/api/staff", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const displayed = filterRole === "All" ? staff : staff.filter(s => s.role === filterRole);
  const active    = displayed.filter(s => s.is_active !== false);
  const inactive  = displayed.filter(s => s.is_active === false);

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["All", ...roles].map(r => (
            <button key={r} onClick={() => setFilterRole(r)}
              style={{ padding: "5px 12px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700,
                background: filterRole === r ? (ROLE_COLORS[r] || "#178F78") : "#EDE8DF",
                color:      filterRole === r ? "white" : "#6B7A99",
                fontFamily: "'Quicksand', sans-serif" }}>
              {r}
            </button>
          ))}
        </div>
        <button onClick={openNew}
          style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "8px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
          + Add Staff
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : loadError ? (
        <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "14px", padding: "24px", textAlign: "center", color: "#DC2626" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>Failed to load staff data</div>
          <div style={{ fontSize: "12px", marginBottom: "12px" }}>{loadError}</div>
          <button onClick={load} style={{ background: "#DC2626", color: "white", border: "none", borderRadius: "8px", padding: "7px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>↺ Retry</button>
        </div>
      ) : staff.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#6B7A99", background: "white", borderRadius: "16px", border: "1px solid #EDE8DF" }}>
          <div style={{ fontSize: "40px", marginBottom: "8px" }}>👩‍🏫</div>
          No staff added yet. Click "+ Add Staff" to begin.
        </div>
      ) : (
        <>
          {/* Active staff */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px", marginBottom: "16px" }}>
            {active.map(s => (
              <StaffCard key={s.id} staff={s} onEdit={() => openEdit(s)} onRemove={() => remove(s.id, s.name)} />
            ))}
          </div>

          {/* Inactive */}
          {inactive.length > 0 && (
            <>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", marginBottom: "8px", letterSpacing: "1px" }}>INACTIVE / PAST STAFF</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "10px", opacity: 0.6 }}>
                {inactive.map(s => (
                  <StaffCard key={s.id} staff={s} onEdit={() => openEdit(s)} onRemove={() => remove(s.id, s.name)} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      {modal !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "white", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "19px", fontWeight: 700, color: "#178F78" }}>
                {modal?.id ? "✏️ Edit Staff Profile" : "👩‍🏫 Add New Staff"}
              </div>
              <button onClick={() => setModal(null)} style={{ background: "#EDE8DF", border: "none", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "13px", color: "#6B7A99" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>FULL NAME *</label>
                <input style={inp} value={form.name} onChange={set("name")} placeholder="Staff full name" />
              </div>
              <div>
                <label style={lbl}>ROLE *</label>
                <select style={inp} value={form.role} onChange={set("role")}>
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>PHONE</label>
                <input style={inp} value={form.phone} onChange={set("phone")} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>EMAIL</label>
                <input style={inp} value={form.email} onChange={set("email")} placeholder="staff@email.com" />
              </div>
              <div>
                <label style={lbl}>DATE OF BIRTH</label>
                <input type="date" style={inp} value={form.dob} onChange={set("dob")} />
              </div>
              <div>
                <label style={lbl}>JOINING DATE</label>
                <input type="date" style={inp} value={form.join_date} onChange={set("join_date")} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>
                  LAST WORKING DAY
                  <span style={{ fontWeight: 400, color: "#9CA3AF", marginLeft: "6px" }}>— fill only if teacher has left</span>
                </label>
                <input type="date" style={{ ...inp, borderColor: form.last_working_day ? "#E8694A" : "#EDE8DF" }}
                  value={form.last_working_day} onChange={set("last_working_day")} />
                {form.last_working_day && (
                  <div style={{ fontSize: "11px", color: "#E8694A", marginTop: "4px", fontWeight: 600 }}>
                    ⚠️ This teacher will be marked as inactive and removed from section dropdowns after this date.
                  </div>
                )}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>ADDRESS</label>
                <textarea style={{ ...inp, minHeight: "56px", resize: "vertical" }} value={form.address} onChange={set("address")} placeholder="Home address" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>NOTES</label>
                <textarea style={{ ...inp, minHeight: "56px", resize: "vertical" }} value={form.notes} onChange={set("notes")} placeholder="e.g. handles LKG class, knows Kannada and English" />
              </div>

              {/* Active toggle for existing staff */}
              {modal?.id && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: modal.is_active !== false ? "#178F78" : "#DC2626" }}>
                    <input type="checkbox" checked={modal.is_active !== false}
                      onChange={async e => {
                        await fetch("/api/staff", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: modal.id, is_active: e.target.checked }) });
                        load();
                        setModal({ ...modal, is_active: e.target.checked });
                      }} />
                    {modal.is_active !== false ? "Active — currently employed" : "Inactive — past staff"}
                  </label>
                </div>
              )}
            </div>

            {saveError && (
              <div style={{ background: "rgba(232,105,74,0.1)", border: "1px solid rgba(232,105,74,0.3)", borderRadius: "10px", padding: "10px 14px", color: "#E8694A", fontSize: "13px", marginTop: "14px" }}>
                {saveError}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button onClick={save} disabled={saving || !form.name}
                style={{ flex: 1, background: saving || !form.name ? "#ccc" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: saving || !form.name ? "not-allowed" : "pointer", fontFamily: "'Quicksand', sans-serif", boxShadow: "0 4px 14px rgba(23,143,120,0.3)" }}>
                {saving ? "Saving…" : modal?.id ? "💾 Update Profile" : "➕ Add Staff"}
              </button>
              <button onClick={() => setModal(null)}
                style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "'Quicksand', sans-serif" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff Card ────────────────────────────────────────────────────────────────
function StaffCard({ staff: s, onEdit, onRemove }: { staff: any; onEdit: () => void; onRemove: () => void }) {
  const color    = ROLE_COLORS[s.role] || "#178F78";
  const initials = s.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const hasLeft  = s.last_working_day && new Date(s.last_working_day) < new Date();
  const leftDate = s.last_working_day
    ? new Date(s.last_working_day).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  return (
    <div style={{ background: "white", borderRadius: "16px", border: `1px solid ${hasLeft ? "rgba(220,38,38,0.2)" : "#EDE8DF"}`, padding: "16px", opacity: hasLeft ? 0.85 : 1 }}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: hasLeft ? "#f3f4f6" : `${color}20`, color: hasLeft ? "#9CA3AF" : color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "15px", flexShrink: 0, fontFamily: "'Fredoka', sans-serif" }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: hasLeft ? "#9CA3AF" : "#1A2F4A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
            <span style={{ background: hasLeft ? "#f3f4f6" : `${color}15`, color: hasLeft ? "#9CA3AF" : color, borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{s.role}</span>
            {hasLeft && (
              <span style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", borderRadius: "20px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>
                LEFT
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {s.phone && <div style={{ fontSize: "12px", color: "#6B7A99" }}>📞 {s.phone}</div>}
        {s.email && <div style={{ fontSize: "12px", color: "#6B7A99", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✉️ {s.email}</div>}
        {s.join_date && <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Joined: {new Date(s.join_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
        {hasLeft && leftDate && (
          <div style={{ fontSize: "11px", color: "#DC2626", fontWeight: 600 }}>Left on: {leftDate}</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
        <button onClick={onEdit}
          style={{ flex: 1, background: hasLeft ? "#f3f4f6" : `${color}15`, color: hasLeft ? "#6B7A99" : color, border: "none", borderRadius: "8px", padding: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
          ✏️ Edit
        </button>
        <button onClick={onRemove}
          style={{ background: "rgba(220,38,38,0.08)", color: "#DC2626", border: "none", borderRadius: "8px", padding: "6px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
          🗑
        </button>
      </div>
    </div>
  );
}
