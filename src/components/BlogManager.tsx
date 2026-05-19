"use client";
import { useState, useEffect } from "react";

const CATEGORIES = ["news","announcement","event","tips","milestone"];
const CAT_COLOR: Record<string,string> = {
  news: "#4A90D9", announcement: "#E8694A", event: "#178F78", tips: "#9B59B6", milestone: "#F5B829",
};

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image_url: string;
  author: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const inp: React.CSSProperties = { width: "100%", border: "1px solid #EDE8DF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1A2F4A", background: "white", outline: "none", boxSizing: "border-box" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#6B7A99", display: "block", marginBottom: "4px" };
const ta: React.CSSProperties  = { ...inp, resize: "vertical", minHeight: "80px" };

const BLANK = { title: "", excerpt: "", content: "", category: "news", coverImageUrl: "", author: "Evergreen Team", isPublished: false };

export default function BlogManager() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<Post | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<Record<string,any>>(BLANK);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");
  const [filter, setFilter]     = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/blog")
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(BLANK); setEditing(null); setShowForm(true); setMsg(""); };
  const openEdit = (p: Post) => {
    setForm({ title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, coverImageUrl: p.cover_image_url, author: p.author, isPublished: p.is_published, id: p.id });
    setEditing(p); setShowForm(true); setMsg("");
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { setMsg("Title and content are required."); return; }
    setSaving(true); setMsg("");
    const method = form.id ? "PATCH" : "POST";
    const res = await fetch("/api/blog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (d.success) { setShowForm(false); setEditing(null); load(); }
    else setMsg(d.error || "Failed to save");
    setSaving(false);
  };

  const togglePublish = async (p: Post) => {
    await fetch("/api/blog", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, isPublished: !p.is_published }) });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
    load();
  };

  const filtered = posts.filter(p => !filter || p.category === filter);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>📝 Blog & News</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{posts.filter(p => p.is_published).length} published · {posts.length} total</div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inp, width: "140px" }}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={openNew}
            style={{ background: "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            + New Post
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ border: "1px solid rgba(23,143,120,0.25)", borderRadius: "16px", padding: "20px", marginBottom: "20px", background: "#FEFCF8" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#178F78", marginBottom: "14px" }}>
            {editing ? "✏️ Edit Post" : "➕ New Post"}
          </div>
          {msg && <div style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px" }}>⚠️ {msg}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div><label style={lbl}>Title *</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title…" style={inp} /></div>
            <div><label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Author</label><input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} style={inp} /></div>
          </div>
          <div style={{ marginBottom: "10px" }}><label style={lbl}>Excerpt (short summary)</label><input value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="One-line summary shown in list view…" style={inp} /></div>
          <div style={{ marginBottom: "10px" }}><label style={lbl}>Cover Image URL</label><input value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))} placeholder="https://…" style={inp} /></div>
          <div style={{ marginBottom: "14px" }}><label style={lbl}>Content *</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your post content here…" style={{ ...ta, minHeight: "160px" }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <input type="checkbox" id="pub" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
            <label htmlFor="pub" style={{ fontSize: "13px", color: "#1A2F4A", fontWeight: 600, cursor: "pointer" }}>Publish immediately</label>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, background: saving ? "#b2dfdb" : "#178F78", color: "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "✅ Save Post"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); setMsg(""); }}
              style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "12px", padding: "11px 16px", fontSize: "13px", color: "#6B7A99", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📝</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No posts yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map(p => (
            <div key={p.id} style={{ border: "1px solid #EDE8DF", borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              {p.cover_image_url && (
                <img src={p.cover_image_url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                  <span style={{ background: CAT_COLOR[p.category] + "22", color: CAT_COLOR[p.category], borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>{p.category}</span>
                  {p.is_published
                    ? <span style={{ background: "rgba(23,143,120,0.12)", color: "#178F78", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Published</span>
                    : <span style={{ background: "rgba(107,122,153,0.1)", color: "#6B7A99", borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 700 }}>Draft</span>}
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{p.title}</div>
                {p.excerpt && <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>{p.excerpt}</div>}
                <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>By {p.author} · {new Date(p.created_at).toLocaleDateString("en-IN")}</div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => togglePublish(p)}
                  style={{ background: p.is_published ? "rgba(245,184,41,0.1)" : "rgba(23,143,120,0.1)", border: `1px solid ${p.is_published ? "rgba(245,184,41,0.3)" : "rgba(23,143,120,0.3)"}`, borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, color: p.is_published ? "#B08000" : "#178F78", cursor: "pointer" }}>
                  {p.is_published ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => openEdit(p)}
                  style={{ background: "white", border: "1px solid #EDE8DF", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", color: "#6B7A99", cursor: "pointer" }}>Edit</button>
                <button onClick={() => remove(p.id)}
                  style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, color: "#DC2626", cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
