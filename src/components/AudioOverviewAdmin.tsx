"use client";
import { useState, useEffect } from "react";

interface AudioRow {
  id: string;
  title: string;
  language: string;
  audio_url: string | null;
  status: "pending" | "generating" | "ready" | "failed";
  duration_seconds: number | null;
  created_at: string;
}

interface GroupedAudio {
  title: string;
  created_at: string;
  languages: string[];
  ids: string[];
  rows: AudioRow[];
}

const VOICES = ["Aoede", "Zephyr", "Puck", "Charon", "Kore", "Fenrir"];

const LANG_LABEL: Record<string, string> = {
  en: "EN", te: "TE", hi: "HI", ta: "TA", kn: "KN", ml: "ML",
};

const inp: React.CSSProperties = {
  border: "1px solid #F2D9C5", borderRadius: "10px", padding: "9px 13px",
  fontSize: "13px", outline: "none", background: "white",
  fontFamily: "'Quicksand', sans-serif", width: "100%", boxSizing: "border-box", color: "#1A2F4A",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, color: "#8A5A44", display: "block",
  marginBottom: "5px", letterSpacing: "0.4px", textTransform: "uppercase",
};
const ta: React.CSSProperties = { ...inp, resize: "vertical", minHeight: "110px", lineHeight: "1.6" };

function formatDuration(s: number | null) {
  if (!s) return "–";
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function AudioGroupCard({ group, onDelete }: { group: GroupedAudio; onDelete: (ids: string[]) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ready = group.rows.filter(r => r.status === "ready");

  const handleDelete = async () => {
    if (!confirm(`Delete "${group.title}" in all languages?`)) return;
    setDeleting(true);
    await onDelete(group.ids);
    setDeleting(false);
  };

  return (
    <div style={{
      border: "1px solid #F2D9C5", borderRadius: "14px", background: "white",
      opacity: deleting ? 0.5 : 1, transition: "opacity 0.2s",
    }}>
      {/* Header row */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A", marginBottom: "6px" }}>
            {group.title}
          </div>
          {/* Language badges */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
            {group.languages.map(lang => {
              const row = group.rows.find(r => r.language === lang);
              const isReady = row?.status === "ready";
              return (
                <span key={lang} style={{
                  padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700,
                  background: isReady ? "rgba(23,143,120,0.12)" : "rgba(245,184,41,0.12)",
                  color: isReady ? "#178F78" : "#92700A",
                }}>
                  {LANG_LABEL[lang] ?? lang.toUpperCase()} {isReady ? "✓" : "⏳"}
                </span>
              );
            })}
          </div>
          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
            {new Date(group.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            &nbsp;·&nbsp;{ready.length}/{group.languages.length} languages ready
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: "rgba(79,70,229,0.07)", border: "1px solid rgba(79,70,229,0.2)",
              borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 700,
              color: "#4F46E5", cursor: "pointer",
            }}
          >
            {expanded ? "▲ Hide" : "▼ Listen"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 700,
              color: "#DC2626", cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Expanded: audio players per language */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F2D9C5", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {group.rows.map(row => (
            <div key={row.id}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#6B7A99", marginBottom: "4px" }}>
                {LANG_LABEL[row.language] ?? row.language.toUpperCase()}
                {row.duration_seconds ? ` · ${formatDuration(row.duration_seconds)}` : ""}
              </div>
              {row.status === "ready" && row.audio_url ? (
                <audio controls src={row.audio_url} style={{ width: "100%", height: "36px" }} />
              ) : (
                <div style={{ fontSize: "12px", color: "#92700A" }}>
                  {row.status === "generating" ? "🔄 Generating…" : row.status === "failed" ? "❌ Failed" : "⏳ Pending"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AudioOverviewAdmin() {
  const [groups, setGroups]       = useState<GroupedAudio[]>([]);
  const [libLoading, setLibLoading] = useState(true);

  const [title, setTitle]         = useState("");
  const [content, setContent]     = useState("");
  const [voice, setVoice]         = useState("Aoede");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const loadLibrary = async () => {
    setLibLoading(true);
    try {
      const res = await fetch("/api/audio/overviews");
      const rows: AudioRow[] = await res.json().then(d => Array.isArray(d) ? d : []);
      // Group by title
      const map = new Map<string, GroupedAudio>();
      for (const row of rows) {
        if (!map.has(row.title)) {
          map.set(row.title, { title: row.title, created_at: row.created_at, languages: [], ids: [], rows: [] });
        }
        const g = map.get(row.title)!;
        g.languages.push(row.language ?? "en");
        g.ids.push(row.id);
        g.rows.push(row);
      }
      setGroups([...map.values()]);
    } catch {}
    setLibLoading(false);
  };

  useEffect(() => { loadLibrary(); }, []);

  const handleCreate = async () => {
    setError(""); setSuccess("");
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!content.trim()) { setError("Please enter the content/key points."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/audio/generate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), voice }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Created in ${data.succeeded}/${data.total} languages! Refreshing library…`);
        setTitle(""); setContent(""); setVoice("Aoede");
        await loadLibrary();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.error || "Generation failed. Please try again.");
      }
    } catch {
      setError("Network error — please check your connection.");
    }
    setBusy(false);
  };

  const handleDelete = async (ids: string[]) => {
    for (const id of ids) {
      await fetch("/api/audio/overviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    }
    await loadLibrary();
  };

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "20px" }}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{
          fontFamily: "'Fredoka', sans-serif", fontSize: "22px", fontWeight: 700,
          background: "linear-gradient(135deg, #E8694A 0%, #F5B829 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          display: "inline-flex", alignItems: "center", gap: "8px",
        }}>
          🎙️ Audio Overviews
        </div>
        <div style={{ fontSize: "13px", color: "#6B7A99", marginTop: "2px" }}>
          Create once — AI generates audio in all 6 languages. Each parent hears it in their language.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "20px", alignItems: "start" }}>

        {/* ── Form ── */}
        <div style={{ background: "white", border: "1px solid #F2D9C5", borderRadius: "18px", padding: "22px" }}>

          {/* Info pill */}
          <div style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(124,58,237,0.08) 100%)",
            border: "1px solid rgba(79,70,229,0.2)", borderRadius: "12px",
            padding: "10px 14px", marginBottom: "18px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "18px" }}>🌐</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#4F46E5" }}>
              Generates in: English · Telugu · Hindi · Tamil · Kannada · Malayalam
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. May 2025 Monthly Newsletter" style={inp} disabled={busy} />
          </div>

          {/* Content */}
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Content / Key Points *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Paste your newsletter, announcement, or key points here. The AI will convert this into a spoken script for each language."
              style={ta} disabled={busy} />
          </div>

          {/* Voice */}
          <div style={{ marginBottom: "20px" }}>
            <label style={lbl}>Voice</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {VOICES.map(v => (
                <button key={v} type="button" onClick={() => setVoice(v)} style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                  border: voice === v ? "1px solid #4F46E5" : "1px solid #F2D9C5",
                  background: voice === v ? "rgba(79,70,229,0.1)" : "white",
                  color: voice === v ? "#4F46E5" : "#6B7A99", cursor: "pointer",
                }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Errors / success */}
          {error && (
            <div style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#DC2626", marginBottom: "12px", display: "flex", gap: "6px" }}>
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(23,143,120,0.08)", border: "1px solid rgba(23,143,120,0.25)", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", color: "#178F78", marginBottom: "12px", display: "flex", gap: "6px" }}>
              <span>✅</span><span>{success}</span>
            </div>
          )}

          {/* Submit */}
          <button onClick={handleCreate} disabled={busy} style={{
            width: "100%",
            background: busy ? "rgba(79,70,229,0.35)" : "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            color: "white", border: "none", borderRadius: "12px", padding: "14px",
            fontSize: "14px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "'Quicksand', sans-serif",
            boxShadow: busy ? "none" : "0 3px 10px rgba(79,70,229,0.35)",
            transition: "all 0.2s",
          }}>
            {busy ? "🎙️ Generating in 6 languages… (~30s)" : "✨ Create in All 6 Languages"}
          </button>
        </div>

        {/* ── Library ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, color: "#1A2F4A" }}>
              🎧 Audio Library
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#6B7A99" }}>
                {groups.length} overview{groups.length !== 1 ? "s" : ""}
              </div>
              <button onClick={loadLibrary} title="Refresh" style={{
                background: "white", border: "1px solid #F2D9C5", borderRadius: "8px",
                padding: "4px 8px", fontSize: "13px", cursor: "pointer", color: "#E8694A",
              }}>↻</button>
            </div>
          </div>

          {libLoading ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#6B7A99", border: "1px dashed #F2D9C5", borderRadius: "16px" }}>
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
              <div style={{ fontSize: "13px" }}>Loading library…</div>
            </div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#6B7A99", border: "1px dashed #F2D9C5", borderRadius: "16px", background: "linear-gradient(135deg, rgba(79,70,229,0.04) 0%, rgba(124,58,237,0.04) 100%)" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎙️</div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>No audio yet</div>
              <div style={{ fontSize: "12px" }}>Generate your first overview using the form</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {groups.map(g => (
                <AudioGroupCard key={g.title} group={g} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
