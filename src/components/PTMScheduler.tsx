"use client";
import { useState, useEffect } from "react";

const STATUS_COLOR: Record<string,string> = {
  booked: "#4A90D9", confirmed: "#178F78", cancelled: "#E8694A", completed: "#6B7A99",
};

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  teacher_name: string;
  section_name: string;
  max_bookings: number;
  is_active: boolean;
  notes: string;
  ptm_bookings?: Booking[];
}

interface Booking {
  id: string;
  slot_id: string;
  enquiry_id: string;
  child_name: string;
  parent_name: string;
  phone: string;
  status: string;
  notes: string;
  ptm_slots?: Slot;
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };

const BLANK_SLOT = { slotDate: "", startTime: "", endTime: "", teacherName: "", sectionName: "", maxBookings: "1", notes: "" };

export default function PTMScheduler() {
  const [slots, setSlots]       = useState<Slot[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(BLANK_SLOT);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/ptm?type=all")
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createSlot = async () => {
    if (!form.slotDate || !form.startTime || !form.endTime || !form.teacherName.trim()) {
      setMsg("Date, start time, end time, and teacher name are required."); return;
    }
    setSaving(true); setMsg("");
    const res = await fetch("/api/ptm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotDate: form.slotDate, startTime: form.startTime, endTime: form.endTime, teacherName: form.teacherName, sectionName: form.sectionName, maxBookings: parseInt(form.maxBookings), notes: form.notes }),
    });
    const d = await res.json();
    if (d.success) { setForm(BLANK_SLOT); setShowForm(false); load(); }
    else setMsg(d.error || "Failed to create slot");
    setSaving(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await fetch("/api/ptm", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bookingId, type: "booking", status }),
    });
    load();
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Delete this slot and all its bookings?")) return;
    await fetch(`/api/ptm?id=${id}&type=slot`, { method: "DELETE" });
    load();
  };

  const grouped = slots.reduce((acc: Record<string, Slot[]>, s) => {
    const date = s.slot_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>📅 PTM Scheduler</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{slots.length} slots · {slots.reduce((t,s) => t + (s.ptm_bookings?.length || 0), 0)} bookings</div>
        </div>
        <button onClick={() => { setShowForm(true); setMsg(""); }}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          + New Slot
        </button>
      </div>

      {showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "16px", marginBottom: "20px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#178F78", marginBottom: "14px" }}>➕ Create PTM Slot</div>
          {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Date *</label><input type="date" value={form.slotDate} onChange={e => setForm(f => ({ ...f, slotDate: e.target.value }))} style={inp} /></div>
            <div><label style={lbl}>Start Time *</label><input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inp} /></div>
            <div><label style={lbl}>End Time *</label><input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inp} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Teacher Name *</label><input value={form.teacherName} onChange={e => setForm(f => ({ ...f, teacherName: e.target.value }))} placeholder="e.g. Mrs Priya" style={inp} /></div>
            <div><label style={lbl}>Section / Class</label><input value={form.sectionName} onChange={e => setForm(f => ({ ...f, sectionName: e.target.value }))} placeholder="e.g. Nursery A" style={inp} /></div>
            <div><label style={lbl}>Max Bookings</label><input type="number" value={form.maxBookings} onChange={e => setForm(f => ({ ...f, maxBookings: e.target.value }))} min="1" style={inp} /></div>
          </div>
          <div style={{ marginBottom: "14px" }}><label style={lbl}>Notes</label><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" style={inp} /></div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={createSlot} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Creating…" : "✅ Create Slot"}
            </button>
            <button onClick={() => { setShowForm(false); setMsg(""); setForm(BLANK_SLOT); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No PTM slots created yet</div>
          <div style={{ fontSize: "11px" }}>Click "+ New Slot" to schedule parent-teacher meetings.</div>
        </div>
      ) : sortedDates.map(date => (
        <div key={date} style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#6B7A99", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            📅 {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {grouped[date].map(slot => {
              const bookings = slot.ptm_bookings || [];
              const isOpen   = expanded === slot.id;
              return (
                <div key={slot.id} style={{ border: "1px solid #EDE8DF", borderRadius: "14px", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>
                        {slot.start_time.slice(0,5)} – {slot.end_time.slice(0,5)} · {slot.teacher_name}
                        {slot.section_name && <span style={{ color: "#6B7A99", fontWeight: 400 }}> ({slot.section_name})</span>}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>
                        {bookings.length}/{slot.max_bookings} booked
                        {slot.notes && <span> · {slot.notes}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => setExpanded(isOpen ? null : slot.id)}
                        style={{ background: "rgba(23,143,120,0.07)", border: "1px solid rgba(23,143,120,0.2)", borderRadius: "8px", padding: "5px 12px", fontSize: "11px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>
                        {isOpen ? "Hide" : `Bookings (${bookings.length})`}
                      </button>
                      <button onClick={() => deleteSlot(slot.id)}
                        style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #EDE8DF", padding: "12px 16px", background: "#FAFAF8" }}>
                      {bookings.length === 0 ? (
                        <div style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "center", padding: "12px" }}>No bookings yet</div>
                      ) : bookings.map(b => (
                        <div key={b.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #EDE8DF" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A" }}>{b.child_name}</div>
                            <div style={{ fontSize: "11px", color: "#6B7A99" }}>{b.parent_name} · <a href={`tel:${b.phone}`} style={{ color: "#178F78", textDecoration: "none" }}>{b.phone}</a></div>
                            {b.notes && <div style={{ fontSize: "11px", color: "#9CA3AF", fontStyle: "italic" }}>{b.notes}</div>}
                          </div>
                          <span style={{ background: STATUS_COLOR[b.status] + "22", color: STATUS_COLOR[b.status], borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{b.status}</span>
                          {b.status === "booked" && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button onClick={() => updateBookingStatus(b.id, "confirmed")}
                                style={{ background: "rgba(23,143,120,0.1)", border: "1px solid rgba(23,143,120,0.3)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, color: "#178F78", cursor: "pointer" }}>Confirm</button>
                              <button onClick={() => updateBookingStatus(b.id, "cancelled")}
                                style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>Cancel</button>
                            </div>
                          )}
                          {b.status === "confirmed" && (
                            <button onClick={() => updateBookingStatus(b.id, "completed")}
                              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", padding: "3px 8px", fontSize: "10px", fontWeight: 700, color: "#6366F1", cursor: "pointer" }}>Mark Done</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
