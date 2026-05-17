"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;
async function getSb(): Promise<SupabaseClient> {
  if (_sb) return _sb;
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    const cfg = await fetch("/api/config").then(r => r.json());
    url = cfg.supabaseUrl; key = cfg.supabaseKey;
  }
  _sb = createClient(url, key);
  return _sb;
}

const PROG_LIST = [
  { id: "infant",    label: "Infant Care",  icon: "🍼" },
  { id: "playgroup", label: "Playgroup",     icon: "🎈" },
  { id: "nursery",   label: "Nursery",       icon: "🌸" },
  { id: "jrkg",      label: "Junior KG",    icon: "📚" },
  { id: "srkg",      label: "Senior KG",    icon: "🎓" },
];

export default function SitePhotosManager() {
  const [photos, setPhotos]       = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const r = await fetch("/api/site-photos", { cache: "no-store" });
    const d = await r.json();
    setPhotos(d.photos || {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (slot: string, file: File) => {
    setUploading(slot); setError("");
    try {
      const ext  = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `site/${slot}.${ext}`;
      const supabase = await getSb();

      // Remove any existing files for this slot (all common extensions)
      await supabase.storage.from("school-photos")
        .remove(["jpg","jpeg","png","webp"].map(e => `site/${slot}.${e}`));

      const { error: storErr } = await supabase.storage
        .from("school-photos")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (storErr) { setError(storErr.message); setUploading(null); return; }

      const { data: { publicUrl } } = supabase.storage.from("school-photos").getPublicUrl(path);

      const r = await fetch("/api/site-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, photo_url: publicUrl }),
      });
      if (!r.ok) { const d = await r.json(); setError(d.error || "Save failed"); setUploading(null); return; }

      setPhotos(p => ({ ...p, [slot]: publicUrl }));
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    }
    setUploading(null);
  };

  const handleRemove = async (slot: string) => {
    await fetch(`/api/site-photos?slot=${encodeURIComponent(slot)}`, { method: "DELETE" });
    setPhotos(p => { const n = { ...p }; delete n[slot]; return n; });
  };

  const photoBox = (slot: string, label: string, desc?: string) => {
    const url = photos[slot];
    const busy = uploading === slot;
    return (
      <div style={{ background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"12px", display:"flex", flexDirection:"column", gap:"8px" }}>
        <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase" }}>{label}</div>
        {desc && <div style={{ fontSize:"10px", color:"#9CA3AF" }}>{desc}</div>}

        {url ? (
          <div style={{ position:"relative" }}>
            <img src={url} alt={label} style={{ width:"100%", height:"130px", objectFit:"cover", borderRadius:"10px", display:"block" }} />
            <button onClick={() => handleRemove(slot)}
              style={{ position:"absolute", top:"6px", right:"6px", background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"50%", width:"24px", height:"24px", color:"white", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <X style={{ width:"12px", height:"12px" }} />
            </button>
            <button onClick={() => fileRefs.current[slot]?.click()}
              style={{ position:"absolute", bottom:"6px", right:"6px", background:"rgba(0,0,0,0.55)", border:"none", borderRadius:"20px", padding:"3px 8px", color:"white", fontSize:"10px", fontWeight:600, cursor:"pointer" }}>
              Replace
            </button>
          </div>
        ) : (
          <div onClick={() => !busy && fileRefs.current[slot]?.click()}
            style={{ height:"130px", background:"#FAF0E8", borderRadius:"10px", border:"2px dashed #EDE8DF", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:busy?"wait":"pointer", gap:"6px" }}>
            {busy
              ? <Loader2 style={{ width:"20px", height:"20px", color:"#178F78", animation:"spin 0.8s linear infinite" }} />
              : <><Upload style={{ width:"18px", height:"18px", color:"#178F78" }} /><span style={{ fontSize:"11px", color:"#6B7A99" }}>Click to upload</span></>
            }
          </div>
        )}

        <input ref={el => { fileRefs.current[slot] = el; }} type="file" accept="image/*" style={{ display:"none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(slot, f); e.target.value = ""; }} />
      </div>
    );
  };

  return (
    <div style={{ fontFamily:"'Quicksand',sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>🌐 Website Display Photos</div>
        <div style={{ fontSize:"11px", color:"#6B7A99", background:"#EDE8DF", borderRadius:"8px", padding:"5px 10px" }}>Changes appear live on the public website</div>
      </div>

      {error && (
        <div style={{ background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"10px", padding:"9px 12px", fontSize:"12px", color:"#DC2626", marginBottom:"12px" }}>❌ {error}</div>
      )}

      {/* Tips banner */}
      <div style={{ background:"linear-gradient(135deg,#FFF8E7,#FFFDF5)", border:"1px solid #F5B82940", borderRadius:"14px", padding:"12px 16px", marginBottom:"18px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
        <span style={{ fontSize:"20px", flexShrink:0 }}>💡</span>
        <div>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#92620A", marginBottom:"6px" }}>Photo Size Tips (no restriction — any size works)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 24px" }}>
            {[
              ["🏠 Hero photo", "Square (1:1) · e.g. 800 × 800 px"],
              ["📚 Program side photos", "Portrait (2:3) · e.g. 600 × 900 px"],
              ["📐 Minimum recommended", "800 px on the shortest side"],
              ["📦 File size", "Under 2 MB for fast loading"],
              ["🖼️ Format", "JPG or WebP preferred"],
              ["🎨 Subject", "Children's faces, activities, classrooms"],
            ].map(([label, tip]) => (
              <div key={label} style={{ display:"flex", gap:"6px", fontSize:"11px", color:"#6B7A99", lineHeight:1.5 }}>
                <span style={{ flexShrink:0 }}>{label}:</span>
                <span style={{ color:"#92620A", fontWeight:600 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,#F0FFF7,#FEFCF8)", borderRadius:"16px", border:"1px solid rgba(23,143,120,0.2)", padding:"16px", marginBottom:"20px" }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:"#178F78", marginBottom:"4px" }}>🏠 Home — Hero Photo</div>
        <div style={{ fontSize:"11px", color:"#6B7A99", marginBottom:"12px" }}>Shown on the right side of the homepage. Square photos look best here.</div>
        <div style={{ maxWidth:"280px" }}>
          {photoBox("hero", "Hero Photo")}
        </div>
      </div>

      {/* Programs */}
      <div style={{ background:"#F0F4F8", borderRadius:"16px", border:"1px solid #EDE8DF", padding:"16px" }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:"#1A2F4A", marginBottom:"4px" }}>📚 Programs — Slide Photos</div>
        <div style={{ fontSize:"11px", color:"#6B7A99", marginBottom:"16px" }}>Left and right panels of each program slide. Portrait (tall) photos fill the panel best.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          {PROG_LIST.map(prog => (
            <div key={prog.id} style={{ background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"14px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#1A2F4A", marginBottom:"6px" }}>{prog.icon} {prog.label}</div>
              <div style={{ fontSize:"10px", color:"#9CA3AF", marginBottom:"10px" }}>Suggested: portrait 600 × 900 px · JPG/WebP · under 2 MB</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {photoBox(`prog_${prog.id}_left`, "Left Photo")}
                {photoBox(`prog_${prog.id}_right`, "Right Photo")}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
