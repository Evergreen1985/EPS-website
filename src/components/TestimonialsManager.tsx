"use client";
import { useState, useEffect } from "react";

const SOURCES = ["direct","google","facebook","whatsapp"];
const SOURCE_ICON: Record<string,string> = { direct: "✍️", google: "🔍", facebook: "📘", whatsapp: "💬" };

interface Testimonial {
  id: string;
  parent_name: string;
  child_name: string;
  program: string;
  content: string;
  rating: number;
  avatar_url: string;
  is_published: boolean;
  is_featured: boolean;
  source: string;
  created_at: string;
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };
const BLANK = { parentName: "", childName: "", program: "", content: "", rating: 5, avatarUrl: "", isPublished: false, isFeatured: false, source: "direct" };

export default function TestimonialsManager() {
  const [items, setItems]       = useState<Testimonial[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<Record<string,any>>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [editId, setEditId]     = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/testimonials")
      .then(r => r.json())
      .then(d => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(BLANK); setEditId(null); setShowForm(true); setMsg(""); };
  const openEdit = (t: Testimonial) => {
    setForm({ parentName: t.parent_name, childName: t.child_name, program: t.program, content: t.content, rating: t.rating, avatarUrl: t.avatar_url, isPublished: t.is_published, isFeatured: t.is_featured, source: t.source, id: t.id });
    setEditId(t.id); setShowForm(true); setMsg("");
  };

  const save = async () => {
    if (!form.parentName.trim() || !form.content.trim()) { setMsg("Parent name and content are required."); return; }
    setSaving(true); setMsg("");
    const method = editId ? "PATCH" : "POST";
    const res = await fetch("/api/testimonials", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (d.success) { setShowForm(false); setEditId(null); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const toggle = async (id: string, field: "is_published" | "is_featured", val: boolean) => {
    const body: Record<string,any> = { id };
    body[field === "is_published" ? "isPublished" : "isFeatured"] = val;
    await fetch("/api/testimonials", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await fetch(`/api/testimonials?id=${id}`, { method: "DELETE" });
    load();
  };

  const Stars = ({ n }: { n: number }) => (
    <span style={{ color: "#F5B829" }}>{Array.from({ length: 5 }).map((_, i) => i < n ? "★" : "☆").join("")}</span>
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>💬 Testimonials</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{items.filter(t => t.is_published).length} published · {items.filter(t => t.is_featured).length} featured</div>
        </div>
        <button onClick={openNew}
          style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          + Add Testimonial
        </button>
      </div>

      {showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "16px", marginBottom: "20px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#178F78", marginBottom: "14px" }}>{editId ? "✏️ Edit" : "➕ Add"} Testimonial</div>
          {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Parent Name *</label><input value={form.parentName} onChange={e => setForm(f => ({ ...f, parentName: e.target.value }))} placeholder="e.g. Mrs Rekha Sharma" style={inp} /></div>
            <div><label style={lbl}>Child Name</label><input value={form.childName} onChange={e => setForm(f => ({ ...f, childName: e.target.value }))} placeholder="e.g. Arjun" style={inp} /></div>
            <div><label style={lbl}>Programme</label><input value={form.program} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} placeholder="e.g. Senior KG" style={inp} /></div>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={lbl}>Testimonial *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="What the parent said…" rows={3}
              style={{ ...inp, resize: "vertical", minHeight: "80px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={lbl}>Rating</label>
              <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} style={inp}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{"★".repeat(n)} ({n}/5)</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={inp}>
                {SOURCES.map(s => <option key={s} value={s}>{SOURCE_ICON[s]} {s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Avatar URL (optional)</label><input value={form.avatarUrl} onChange={e => setForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://…" style={inp} /></div>
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: "14px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />Published
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />Featured on Homepage
            </label>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "✅ Save"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setMsg(""); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No testimonials yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map(t => (
            <div key={t.id} style={{ border: "1px solid #EDE8DF", borderRadius: "14px", padding: "14px 16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg,rgba(23,143,120,0.15),rgba(99,102,241,0.15))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👤</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{t.parent_name}</span>
                    {t.child_name && <span style={{ fontSize: "12px", color: "#6B7A99" }}>· {t.child_name}{t.program ? ` (${t.program})` : ""}</span>}
                    <Stars n={t.rating} />
                    <span style={{ fontSize: "11px", color: "#9CA3AF" }}>{SOURCE_ICON[t.source]} {t.source}</span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#1A2F4A", marginTop: "6px", lineHeight: 1.5, fontStyle: "italic" }}>"{t.content}"</div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                    {t.is_published && <span style={{ background: "rgba(23,143,120,0.1)", color: "#178F78", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Published</span>}
                    {t.is_featured && <span style={{ background: "rgba(245,184,41,0.15)", color: "#B08000", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>⭐ Featured</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => toggle(t.id, "is_published", !t.is_published)}
                    style={{ background: t.is_published ? "rgba(245,184,41,0.1)" : "rgba(23,143,120,0.1)", border: `1px solid ${t.is_published ? "rgba(245,184,41,0.3)" : "rgba(23,143,120,0.3)"}`, borderRadius: "8px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: t.is_published ? "#B08000" : "#178F78", cursor: "pointer" }}>
                    {t.is_published ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => toggle(t.id, "is_featured", !t.is_featured)}
                    style={{ background: t.is_featured ? "rgba(245,184,41,0.15)" : "white", border: "1px solid rgba(245,184,41,0.35)", borderRadius: "8px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: "#B08000", cursor: "pointer" }}>
                    {t.is_featured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => openEdit(t)}
                    style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "8px", padding: "4px 10px", fontSize: "10px", color: "#6B7A99", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => remove(t.id)}
                    style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "4px 10px", fontSize: "10px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
