"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface Props {
  sectionId:   string;
  sectionName: string;
  uploadedBy:  string;
  uploadedByRole: "teacher" | "admin";
  children?:   { id: string; child_name: string }[];
  onUploaded?: (photo: any) => void;
}

export default function PhotoUploader({ sectionId, sectionName, uploadedBy, uploadedByRole, children = [], onUploaded }: Props) {
  const fileRef               = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string; title: string; event: string; featured: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiTagging, setAiTagging] = useState(false);
  const [results, setResults]   = useState<{ url: string; caption: string; tags: string[] }[]>([]);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [progress, setProgress] = useState(0);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPreviews = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      title: "",
      event: "",
      featured: false,
    }));
    setPreviews(p => [...p, ...newPreviews]);
  }, []);

  const upload = async () => {
    if (previews.length === 0) return;
    setUploading(true);
    setError("");
    setProgress(0);
    const uploaded: any[] = [];

    for (let i = 0; i < previews.length; i++) {
      const p = previews[i];
      setProgress(Math.round(((i) / previews.length) * 100));
      try {
        const fd = new FormData();
        fd.append("file", p.file);
        fd.append("sectionId", sectionId);
        fd.append("sectionName", sectionName);
        fd.append("title", p.title);
        fd.append("eventName", p.event);
        fd.append("uploadedBy", uploadedBy);
        fd.append("uploadedByRole", uploadedByRole);
        fd.append("isFeatured", String(p.featured));

        const res  = await fetch("/api/photos/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) {
          setError(`Upload failed: ${data.error}`);
          setUploading(false);
          return;
        }
        if (data.photo) {
          uploaded.push(data.photo);
          onUploaded?.(data.photo);
        }
      } catch (e: any) {
        setError(`Error: ${e?.message}`);
        setUploading(false);
        return;
      }
    }

    setProgress(100);
    setUploading(false);

    // AI tagging
    if (uploaded.length > 0) {
      setAiTagging(true);
      const aiResults: { url: string; caption: string; tags: string[] }[] = [];
      for (const photo of uploaded) {
        try {
          const res  = await fetch("/api/photos/ai-tag", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId: photo.id, photoUrl: photo.photo_url, childrenInSection: children }),
          });
          const data = await res.json();
          aiResults.push({ url: photo.photo_url, caption: data.aiResult?.caption || "", tags: data.aiResult?.tags || [] });
        } catch {
          aiResults.push({ url: photo.photo_url, caption: "", tags: [] });
        }
      }
      setResults(aiResults);
      setAiTagging(false);
    }

    setPreviews([]);
    setProgress(0);
    setDone(true);
    setTimeout(() => setDone(false), 5000);
  };

  return (
    <div style={{ fontFamily:"'Quicksand',sans-serif" }}>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        style={{ border:"2px dashed #EDE8DF", borderRadius:"16px", padding:"28px", textAlign:"center", cursor:"pointer", background:"#FAF0E8", transition:"all 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor="#178F78")}
        onMouseLeave={e => (e.currentTarget.style.borderColor="#EDE8DF")}
      >
        <Upload style={{ width:"28px", height:"28px", color:"#178F78", margin:"0 auto 8px" }} />
        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A", marginBottom:"4px" }}>Drop photos here or click to browse</div>
        <div style={{ fontSize:"11px", color:"#6B7A99" }}>JPG, PNG, WEBP · Multiple files supported</div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
          onChange={e => onFiles(e.target.files)} />
      </div>

      {/* Preview queue */}
      {previews.length > 0 && (
        <div style={{ marginTop:"14px" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#6B7A99", marginBottom:"8px" }}>
            {previews.length} photo{previews.length > 1 ? "s" : ""} ready to upload
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"10px", marginBottom:"12px" }}>
            {previews.map((p, i) => (
              <div key={i} style={{ borderRadius:"12px", border:"1px solid #EDE8DF", overflow:"hidden", background:"white" }}>
                <div style={{ position:"relative" }}>
                  <img src={p.url} alt="" style={{ width:"100%", height:"110px", objectFit:"cover", display:"block" }} />
                  <button onClick={() => setPreviews(ps => ps.filter((_,j) => j!==i))}
                    style={{ position:"absolute", top:"6px", right:"6px", width:"22px", height:"22px", borderRadius:"50%", background:"rgba(0,0,0,0.5)", border:"none", color:"white", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X style={{ width:"12px", height:"12px" }} />
                  </button>
                  <button onClick={() => setPreviews(ps => ps.map((x,j) => j===i ? {...x, featured:!x.featured} : x))}
                    title="Mark as featured (shows on homepage)"
                    style={{ position:"absolute", top:"6px", left:"6px", width:"22px", height:"22px", borderRadius:"50%", background:p.featured?"#F5B829":"rgba(0,0,0,0.4)", border:"none", color:"white", fontSize:"12px", cursor:"pointer" }}>
                    ⭐
                  </button>
                </div>
                <div style={{ padding:"6px" }}>
                  <input value={p.title} onChange={e => setPreviews(ps => ps.map((x,j) => j===i?{...x,title:e.target.value}:x))}
                    placeholder="Caption…"
                    style={{ width:"100%", border:"1px solid #EDE8DF", borderRadius:"6px", padding:"4px 7px", fontSize:"10px", outline:"none", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
            <button onClick={upload} disabled={uploading || aiTagging}
              style={{ display:"flex", alignItems:"center", gap:"7px", background: uploading||aiTagging ? "#ccc" : "#178F78", color:"white", border:"none", borderRadius:"12px", padding:"9px 20px", fontSize:"13px", fontWeight:700, cursor: uploading||aiTagging ? "not-allowed":"pointer", boxShadow: uploading||aiTagging ? "none":"0 4px 14px rgba(23,143,120,0.3)" }}>
              {uploading ? <><Loader2 style={{ width:"14px", height:"14px", animation:"spin 0.8s linear infinite" }} /> Uploading {progress}%…</>
               : aiTagging ? <><Sparkles style={{ width:"14px", height:"14px" }} /> AI Tagging…</>
               : <><Upload style={{ width:"14px", height:"14px" }} /> Upload {previews.length} Photo{previews.length>1?"s":""}</>}
            </button>
            <button onClick={() => { setPreviews([]); setError(""); }}
              style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"12px", padding:"9px 14px", fontSize:"12px", cursor:"pointer" }}>
              Clear
            </button>
            {!uploading && !aiTagging && (
              <div style={{ fontSize:"11px", color:"#6B7A99", display:"flex", alignItems:"center", gap:"4px" }}>
                <Sparkles style={{ width:"12px", height:"12px", color:"#F5B829" }} />
                AI will auto-tag & caption after upload
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploading && (
            <div style={{ marginTop:"10px", background:"#EDE8DF", borderRadius:"20px", height:"6px", overflow:"hidden" }}>
              <div style={{ height:"100%", background:"#178F78", borderRadius:"20px", width:`${progress}%`, transition:"width 0.3s" }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ marginTop:"10px", background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"10px", padding:"9px 12px", fontSize:"12px", color:"#DC2626" }}>
              ❌ {error}<br/>
              <span style={{ fontSize:"10px", color:"#6B7A99" }}>Make sure the Supabase Storage bucket "school-photos" exists and is public.</span>
            </div>
          )}
        </div>
      )}

      {/* AI results */}
      {done && results.length > 0 && (
        <div style={{ marginTop:"14px", background:"rgba(23,143,120,0.06)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"14px", padding:"14px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", fontWeight:700, fontSize:"13px", color:"#178F78", marginBottom:"10px" }}>
            <CheckCircle2 style={{ width:"16px", height:"16px" }} />
            Uploaded & AI-tagged successfully!
          </div>
          {results.map((r, i) => (
            <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"8px", alignItems:"flex-start" }}>
              <img src={r.url} alt="" style={{ width:"48px", height:"48px", borderRadius:"8px", objectFit:"cover", flexShrink:0 }} />
              <div>
                <div style={{ fontSize:"12px", fontWeight:600, color:"#1A2F4A" }}>{r.caption}</div>
                <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop:"4px" }}>
                  {r.tags.map(tag => (
                    <span key={tag} style={{ fontSize:"10px", background:"#FAF0E8", borderRadius:"20px", padding:"2px 8px", color:"#6B7A99" }}>#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
