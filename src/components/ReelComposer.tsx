"use client";
import { useEffect, useMemo, useState } from "react";

/**
 * Smart AI Reel Composer — used across all roles (admin / teacher / parent / owner).
 *
 *   <ReelComposer sectionId={...} />        // teacher / admin / owner (a section)
 *   <ReelComposer />                         // admin / owner (no section = whole school)
 *   <ReelComposer phone={session.phone} />   // parent (their children's sections)
 *
 * Pulls the gallery from /api/reels/photos, lets the teacher build a chronological
 * timeline (drag to reorder), pick a template, add intro / mid / outro cards, then
 * streams real per-stage progress from POST /api/reels/generate.
 */

type Role = "admin" | "teacher" | "parent" | "owner";

interface Photo {
  id: string;
  photo_url: string;
  title?: string | null;
  section_name?: string | null;
  uploaded_at?: string;
}

interface Props {
  role?: Role;
  sectionId?: string;
  phone?: string;
  schoolName?: string;
}

const C = {
  edu:   "#178F78",
  dark:  "#1A2F4A",
  mid:   "#6B7A99",
  light: "#EDE8DF",
  bg:    "#F7F4EE",
  line:  "#E2DDD2",
};

const TEMPLATES = [
  { key: "weekly",   label: "Weekly Classroom Summary", blurb: "Warm tones · gentle 3s fades", emoji: "🍂" },
  { key: "sports",   label: "Energetic Sports/Activity", blurb: "Vibrant · punchy quick cuts", emoji: "⚡" },
  { key: "showcase", label: "Formal Project Showcase",   blurb: "Clean · inspiring · slow fades", emoji: "🎓" },
] as const;
type TemplateKey = (typeof TEMPLATES)[number]["key"];

// Stage → the user-facing ticker it lights up. Order defines the checklist.
const STEPS: { keys: string[]; label: string }[] = [
  { keys: ["start", "images"], label: "Analyzing images" },
  { keys: ["cards"],           label: "Building title cards" },
  { keys: ["transitions"],     label: "Splicing transitions" },
  { keys: ["music"],           label: "Synching background beats" },
  { keys: ["upload"],          label: "Publishing reel" },
];
const stageToStep = (stage: string) => STEPS.findIndex((s) => s.keys.includes(stage));

const MAX = 20;

export default function ReelComposer({ role = "teacher", sectionId, phone, schoolName = "Evergreen Preschool" }: Props) {
  const [gallery, setGallery]   = useState<Photo[]>([]);
  const [loading, setLoading]   = useState(true);

  // timeline = the ordered selection the teacher is composing
  const [timeline, setTimeline] = useState<Photo[]>([]);
  const selectedIds = useMemo(() => new Set(timeline.map((p) => p.id)), [timeline]);

  const [template, setTemplate] = useState<TemplateKey>("weekly");
  const [introTitle, setIntroTitle] = useState("");
  const [midText, setMidText]       = useState("");
  const [outroText, setOutroText]   = useState(schoolName);

  const [generating, setGenerating] = useState(false);
  const [stepIdx, setStepIdx]   = useState(-1);   // which STEP is currently active
  const [detail, setDetail]     = useState("");   // e.g. "3 / 8"
  const [videoUrl, setVideoUrl] = useState("");
  const [err, setErr]           = useState("");

  const [dragId, setDragId] = useState<string | null>(null);

  // ── Load gallery ───────────────────────────────────────────────────────────
  useEffect(() => {
    const qs = sectionId
      ? `sectionId=${encodeURIComponent(sectionId)}`
      : phone
      ? `phone=${encodeURIComponent(phone)}`
      : "";
    fetch(`/api/reels/photos?${qs}`)
      .then((r) => r.json())
      .then((d) => setGallery((d.photos || []).filter((p: Photo) => p.photo_url)))
      .catch(() => setGallery([]))
      .finally(() => setLoading(false));
  }, [sectionId, phone]);

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggle = (p: Photo) => {
    setErr("");
    setTimeline((t) =>
      selectedIds.has(p.id)
        ? t.filter((x) => x.id !== p.id)
        : t.length >= MAX
        ? t
        : [...t, p]
    );
  };

  const sortByDate = () =>
    setTimeline((t) =>
      [...t].sort((a, b) => new Date(a.uploaded_at || 0).getTime() - new Date(b.uploaded_at || 0).getTime())
    );

  // ── Drag-and-drop reorder (native HTML5 DnD, no extra deps) ─────────────────
  const onDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    setTimeline((t) => {
      const from = t.findIndex((p) => p.id === dragId);
      const to   = t.findIndex((p) => p.id === overId);
      if (from < 0 || to < 0) return t;
      const next = [...t];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragId(null);
  };

  // ── Generate (streamed real progress) ───────────────────────────────────────
  const generate = async () => {
    if (timeline.length < 2) { setErr("Pick at least 2 photos for a reel."); return; }
    setErr(""); setVideoUrl(""); setGenerating(true); setStepIdx(0); setDetail("");

    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Send IDs — the server resolves the real URLs (prevents SSRF / tampering).
          photoIds: timeline.map((p) => p.id),
          template,
          introTitle,
          midText,
          outroText,
          schoolName,
          stream: true,
        }),
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }

      // Read the NDJSON stage stream line-by-line.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let evt: any;
          try { evt = JSON.parse(line); } catch { continue; }

          if (evt.stage === "done") {
            setStepIdx(STEPS.length);
            setVideoUrl(evt.videoUrl);
          } else if (evt.stage === "error") {
            throw new Error(evt.error || "Generation failed");
          } else {
            const idx = stageToStep(evt.stage);
            if (idx >= 0) setStepIdx(idx);
            setDetail(evt.stage === "images" && evt.n ? `${evt.i} / ${evt.n}` : "");
          }
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Could not create the reel. Try fewer photos.");
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => { setVideoUrl(""); setTimeline([]); setIntroTitle(""); setMidText(""); setStepIdx(-1); };

  // ── Render: result view ─────────────────────────────────────────────────────
  if (videoUrl) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={h1}>Your Reel 🎬</div>
        <video src={videoUrl} controls autoPlay playsInline style={{ width: "100%", maxWidth: 420, borderRadius: 16, background: "#000" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <a href={videoUrl} download style={{ ...btn, background: C.edu, color: "#fff", textDecoration: "none" }}>Download</a>
          <button onClick={reset} style={{ ...btn, background: C.light, color: C.mid }}>Make another</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: C.mid }}>Loading gallery…</div>;

  // ── Render: composer ────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }}>
      <div style={h1}>Smart Reel Composer</div>
      <div style={{ fontSize: 12, color: C.mid, marginBottom: 14 }}>
        Select photos, drag to set the order, pick a style, then generate.
      </div>

      {/* 1 · Gallery picker */}
      <SectionLabel n={1} text={`Pick photos${gallery.length ? ` (${timeline.length}/${MAX})` : ""}`} />
      {gallery.length === 0 ? (
        <div style={{ color: C.mid, fontSize: 13, padding: "10px 0" }}>No photos in this gallery yet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(82px,1fr))", gap: 6 }}>
          {gallery.map((p) => {
            const on = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p)}
                title={p.title || ""}
                style={{
                  position: "relative", aspectRatio: "1", border: on ? `3px solid ${C.edu}` : `1px solid ${C.line}`,
                  borderRadius: 10, overflow: "hidden", padding: 0, cursor: "pointer",
                  background: `center/cover no-repeat url(${p.photo_url})`,
                }}
              >
                {on && (
                  <span style={{ position: "absolute", top: 4, right: 4, background: C.edu, color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 12, fontWeight: 700, lineHeight: "20px" }}>
                    {timeline.findIndex((x) => x.id === p.id) + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2 · Timeline (drag to reorder) */}
      {timeline.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
            <SectionLabel n={2} text="Timeline — drag to reorder" inline />
            <button onClick={sortByDate} style={{ ...chip, cursor: "pointer" }}>↕ Sort by date</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "8px 2px 4px" }}>
            {timeline.map((p, i) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragId(p.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(p.id)}
                style={{
                  position: "relative", flex: "0 0 auto", width: 72, height: 96, borderRadius: 10,
                  border: dragId === p.id ? `2px dashed ${C.edu}` : `1px solid ${C.line}`,
                  background: `center/cover no-repeat url(${p.photo_url})`, cursor: "grab",
                }}
              >
                <span style={{ position: "absolute", top: 3, left: 3, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6, fontSize: 11, padding: "1px 5px" }}>{i + 1}</span>
                <button
                  onClick={() => toggle(p)}
                  style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 11, lineHeight: "16px", cursor: "pointer" }}
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 3 · Template picker */}
      <SectionLabel n={3} text="Style template" top />
      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value as TemplateKey)}
        style={{ width: "100%", padding: "11px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, color: C.dark, background: "#fff" }}
      >
        {TEMPLATES.map((t) => (
          <option key={t.key} value={t.key}>{t.emoji}  {t.label} — {t.blurb}</option>
        ))}
      </select>
      <div style={{ fontSize: 11, color: C.mid, marginTop: 5 }}>
        Music is a generated background bed (instrumental tones), not a licensed track.
      </div>

      {/* 4 · Text overlays */}
      <SectionLabel n={4} text="Text cards" top />
      <Field label="Intro card title" value={introTitle} onChange={setIntroTitle} placeholder="e.g. UKG-A · Sports Day" />
      <Field label="Mid-video highlight" value={midText} onChange={setMidText} placeholder="e.g. The Big Race! 🏃" />
      <Field label="Outro / closing signature" value={outroText} onChange={setOutroText} placeholder={schoolName} />

      {err && <div style={{ color: "#C0392B", fontSize: 13, marginTop: 12 }}>{err}</div>}

      {/* Generate */}
      <button
        onClick={generate}
        disabled={generating || timeline.length < 2}
        style={{ ...btn, width: "100%", marginTop: 16, background: timeline.length < 2 ? C.line : C.edu, color: timeline.length < 2 ? C.mid : "#fff", cursor: timeline.length < 2 ? "default" : "pointer" }}
      >
        {generating ? "Generating…" : `Generate Reel${timeline.length ? ` (${timeline.length})` : ""}`}
      </button>

      {/* 5 · Loading overlay with real step tickers */}
      {generating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,47,74,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "26px 28px", width: 320, maxWidth: "88vw" }}>
            <div style={{ ...h1, marginBottom: 4 }}>Composing your reel…</div>
            <div style={{ fontSize: 12, color: C.mid, marginBottom: 16 }}>This usually takes 20–60 seconds.</div>
            {STEPS.map((s, i) => {
              const state = stepIdx > i ? "done" : stepIdx === i ? "active" : "pending";
              return (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", opacity: state === "pending" ? 0.45 : 1 }}>
                  <span style={{ width: 18, textAlign: "center" }}>
                    {state === "done" ? "✓" : state === "active" ? <Spinner /> : "○"}
                  </span>
                  <span style={{ fontSize: 13, color: C.dark, fontWeight: state === "active" ? 700 : 500 }}>
                    {s.label}{state === "active" && detail ? `  ${detail}` : "…"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────
function SectionLabel({ n, text, top, inline }: { n: number; text: string; top?: boolean; inline?: boolean }) {
  return (
    <div style={{ display: inline ? "inline-flex" : "flex", alignItems: "center", gap: 8, marginTop: top ? 18 : 0, marginBottom: 8 }}>
      <span style={{ background: C.dark, color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 12, fontWeight: 700, lineHeight: "20px", textAlign: "center" }}>{n}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{text}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: C.mid, marginBottom: 4 }}>{label}</div>
      <input
        value={value}
        maxLength={60}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, color: C.dark, boxSizing: "border-box" }}
      />
    </div>
  );
}

function Spinner() {
  return (
    <span
      style={{ display: "inline-block", width: 13, height: 13, border: `2px solid ${C.line}`, borderTopColor: C.edu, borderRadius: "50%", animation: "rc-spin 0.7s linear infinite" }}
    >
      <style>{`@keyframes rc-spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  );
}

const h1: React.CSSProperties = { fontFamily: "'Fredoka',sans-serif", fontSize: 17, fontWeight: 700, color: C.dark, marginBottom: 10 };
const btn: React.CSSProperties = { border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 700, fontSize: 14 };
const chip: React.CSSProperties = { background: C.light, color: C.mid, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, padding: "5px 10px" };
