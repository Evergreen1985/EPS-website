"use client";
import { useEffect, useState } from "react";

// Web Reels — parity with the native Reels screen. Parent picks section photos →
// /api/reels/generate builds an MP4 slideshow → played inline.
export default function ReelsTab({ phone }: { phone: string }) {
  const [photos, setPhotos]       = useState<any[]>([]);
  const [selected, setSelected]   = useState<string[]>([]);
  const [caption, setCaption]     = useState("");
  const [speed, setSpeed]         = useState(2);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl]   = useState("");
  const [err, setErr]             = useState("");

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetch(`/api/reels/photos?phone=${encodeURIComponent(phone)}`).then(r => r.json())
      .then(d => setPhotos(d.photos || []))
      .finally(() => setLoading(false));
  }, [phone]);

  const toggle = (url: string) => {
    setSelected(s => s.includes(url) ? s.filter(u => u !== url) : (s.length >= 20 ? s : [...s, url]));
  };

  const generate = async () => {
    if (selected.length < 2) { setErr("Pick at least 2 photos."); return; }
    setErr(""); setGenerating(true); setVideoUrl("");
    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrls: selected, transition: "fade", durationPerPhoto: speed, filter: "natural", music: "none", caption, schoolName: "Evergreen Preschool" }),
      });
      const data = await res.json();
      if (!res.ok || !data.videoUrl) throw new Error(data.error || "Generation failed");
      setVideoUrl(data.videoUrl);
    } catch (e: any) {
      setErr(e.message || "Could not create the reel. Try fewer photos.");
    } finally { setGenerating(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6B7A99" }}>Loading photos…</div>;

  if (videoUrl) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, fontWeight: 700, color: "#1A2F4A", marginBottom: 14 }}>Your Reel 🎬</div>
        <video src={videoUrl} controls autoPlay style={{ width: "100%", maxWidth: 420, borderRadius: 16, background: "#000" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <a href={videoUrl} download style={{ background: "#178F78", color: "white", borderRadius: 10, padding: "10px 18px", fontWeight: 700, textDecoration: "none" }}>Download</a>
          <button onClick={() => { setVideoUrl(""); setSelected([]); setCaption(""); }} style={{ background: "#EDE8DF", color: "#6B7A99", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Make another</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, fontWeight: 700, color: "#1A2F4A", marginBottom: 6 }}>Create a Reel</div>
      <div style={{ fontSize: 13, color: "#6B7A99", marginBottom: 14 }}>Pick 2–20 photos → we’ll turn them into a video slideshow.</div>

      {photos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7A99", background: "white", borderRadius: 16, border: "1px solid #EDE8DF" }}>No class photos yet.</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(96px,1fr))", gap: 8 }}>
            {photos.map(p => {
              const idx = selected.indexOf(p.photo_url);
              const sel = idx >= 0;
              return (
                <button key={p.id} onClick={() => toggle(p.photo_url)} style={{ position: "relative", padding: 0, border: sel ? "3px solid #178F78" : "1px solid #EDE8DF", borderRadius: 12, overflow: "hidden", cursor: "pointer", aspectRatio: "1", background: "#F1F5F9" }}>
                  <img src={p.photo_url} alt={p.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {sel && <span style={{ position: "absolute", top: 4, right: 4, background: "#178F78", color: "white", borderRadius: 999, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{idx + 1}</span>}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" style={{ flex: 1, minWidth: 180, border: "1px solid #EDE8DF", borderRadius: 10, padding: "10px 12px", fontSize: 14 }} />
            <label style={{ fontSize: 13, color: "#6B7A99" }}>Seconds/photo:&nbsp;
              <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ border: "1px solid #EDE8DF", borderRadius: 8, padding: "6px 8px" }}>
                <option value={1.5}>1.5</option><option value={2}>2</option><option value={3}>3</option>
              </select>
            </label>
          </div>
          {err && <div style={{ color: "#DC2626", fontSize: 13, marginTop: 8 }}>{err}</div>}
          <button onClick={generate} disabled={generating || selected.length < 2}
            style={{ marginTop: 14, background: "#178F78", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: generating ? "default" : "pointer", opacity: generating || selected.length < 2 ? 0.6 : 1 }}>
            {generating ? "Creating reel… (this can take a minute)" : `Create reel (${selected.length} selected)`}
          </button>
        </>
      )}
    </div>
  );
}
