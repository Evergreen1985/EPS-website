"use client";
import { useState, useRef, useEffect, useCallback } from "react";

interface Child { id: string; child_name: string; photo_url: string; }
interface Props { photo: any; sectionId: string; children: Child[]; onSaved: () => void; }

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";
declare global { interface Window { faceapi: any; } }

export default function FaceAutoTagger({ photo, sectionId, children, onSaved }: Props) {
  const [open, setOpen]       = useState(false);
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);
  const [faces, setFaces]     = useState<any[]>([]);
  const [active, setActive]   = useState<number | null>(null);
  const canvasRef             = useRef<HTMLCanvasElement>(null);
  const imgRef                = useRef<HTMLImageElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const close = () => setActive(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Parse saved tags from DB
  let savedFaces: any[] = [];
  try { savedFaces = photo.ai_tags ? JSON.parse(photo.ai_tags) : []; } catch {}
  const displayFaces = faces.length > 0 ? faces : savedFaces;
  const tagged    = displayFaces.filter((f: any) => f.childName).length;
  const allTagged = displayFaces.length > 0 && tagged === displayFaces.length;

  const loadFaceApi = (): Promise<void> => new Promise((resolve, reject) => {
    if (window.faceapi) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load face-api.js"));
    document.head.appendChild(s);
  });

  const loadImg = async (url: string): Promise<HTMLImageElement> => {
    // Fetch as blob first to bypass CORS restriction on canvas
    const res  = await fetch(url.split("?")[0]);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = blobUrl;
    });
  };

  const autoTag = async () => {
    setLoading(true); setStatus("Loading face models…");
    try {
      await loadFaceApi();
      const fa = window.faceapi;
      await Promise.all([
        fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      // Build reference descriptors from profile photos
      setStatus(`Loading ${children.length} profiles…`);
      const refs: { name: string; descriptor: Float32Array }[] = [];
      for (const c of children) {
        if (!c.photo_url) continue;
        try {
          const img = await loadImg(c.photo_url);
          const det = await fa.detectSingleFace(img, new fa.SsdMobilenetv1Options({ minConfidence: 0.3 }))
            .withFaceLandmarks().withFaceDescriptor();
          if (det) refs.push({ name: c.child_name, descriptor: det.descriptor });
        } catch {}
      }

      if (refs.length === 0) {
        setStatus("❌ Could not load any profile photos. Check if profile photos are uploaded and accessible.");
        setLoading(false); return;
      }

      setStatus(`✅ Loaded ${refs.length} profiles. Scanning class photo…`);
      const classImg  = await loadImg(photo.photo_url);
      const dets = await fa.detectAllFaces(classImg, new fa.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks().withFaceDescriptors();

      if (dets.length === 0) {
        setStatus("No faces detected. Try a clearer photo."); setLoading(false); return;
      }

      setStatus(`Matching ${dets.length} faces…`);
      const { width, height } = classImg;

      const matched: any[] = dets.map((det: any, idx: number) => {
        const box = det.detection.box;
        let bestName = null; let bestDist = Infinity;
        for (const ref of refs) {
          const d = fa.euclideanDistance(det.descriptor, ref.descriptor);
          if (d < bestDist) { bestDist = d; bestName = ref.name; }
        }
        const matched = bestDist < 0.6;
        return {
          index: idx,
          x: Math.round(box.x), y: Math.round(box.y),
          w: Math.round(box.width), h: Math.round(box.height),
          imgW: width, imgH: height,
          childName:  matched ? bestName : null,
          confidence: bestDist < 0.45 ? "high" : bestDist < 0.55 ? "medium" : matched ? "low" : null,
          autoTagged: matched,
          distance:   Math.round(bestDist * 100) / 100,
        };
      });

      const autoCount = matched.filter(f => f.autoTagged).length;
      const distInfo  = matched.map(f => `${f.childName||"?"}: ${f.distance}`).join(", ");
      setFaces(matched);
      setStatus(`✅ ${autoCount}/${dets.length} matched! Distances: ${distInfo}`);

      // Save to DB
      const caption = matched.filter(f => f.childName).map(f => f.childName).join(",");
      await fetch("/api/photos/detect-faces", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, bulkFaces: matched, caption }),
      });
      onSaved();

      // Draw boxes on canvas
      setTimeout(() => {
        if (!canvasRef.current || !imgRef.current) return;
        const canvas = canvasRef.current;
        const imgEl  = imgRef.current;
        canvas.width = imgEl.offsetWidth; canvas.height = imgEl.offsetHeight;
        const ctx    = canvas.getContext("2d")!;
        const sx     = imgEl.offsetWidth / width;
        const sy     = imgEl.offsetHeight / height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        matched.forEach(f => {
          const color = f.childName
            ? f.confidence==="high" ? "#178F78" : f.confidence==="medium" ? "#F5B829" : "#E8694A"
            : "#6B7A99";
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.strokeRect(f.x*sx, f.y*sy, f.w*sx, f.h*sy);
          ctx.fillStyle = color;
          ctx.fillRect(f.x*sx, (f.y+f.h)*sy, f.w*sx, 18);
          ctx.fillStyle = "white"; ctx.font = "11px sans-serif";
          ctx.fillText(f.childName || "?", f.x*sx+3, (f.y+f.h)*sy+13);
        });
      }, 300);

    } catch (e: any) { setStatus(`❌ ${e.message}`); }
    setLoading(false);
  };

  const saveTag = async (faceIndex: number, childName: string) => {
    const updated = displayFaces.map((f: any) =>
      f.index === faceIndex ? { ...f, childName: childName || null, confidence: childName ? "manual" : null } : f
    );
    setFaces(updated); setActive(null);
    const caption = updated.filter((f: any) => f.childName).map((f: any) => f.childName).join(",");
    await fetch("/api/photos/detect-faces", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: photo.id, bulkFaces: updated, caption }),
    });
    onSaved();
  };

  const chipColor = (f: any) =>
    !f.childName   ? { bg:"#F0F0F0",              text:"#6B7A99" }
    : f.confidence==="high"   ? { bg:"rgba(23,143,120,0.12)", text:"#178F78" }
    : f.confidence==="medium" ? { bg:"rgba(245,184,41,0.12)", text:"#B08000" }
    : f.confidence==="manual" ? { bg:"rgba(99,102,241,0.12)", text:"#6366F1" }
    : { bg:"rgba(232,105,74,0.12)", text:"#E8694A" };

  return (
    <div style={{ background:"white", borderRadius:"16px", border:`1px solid ${allTagged?"rgba(23,143,120,0.3)":"#EDE8DF"}`, overflow:"visible", marginBottom:"10px" }}>
      {/* Header */}
      <div style={{ display:"flex", gap:"12px", padding:"12px", alignItems:"flex-start" }}>
        <img src={photo.photo_url} alt="" onClick={() => setOpen(o=>!o)}
          style={{ width:"80px", height:"65px", objectFit:"cover", borderRadius:"10px", flexShrink:0, cursor:"pointer" }} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A", marginBottom:"5px" }}>
            {photo.title || "Class photo"}
            {allTagged && <span style={{ marginLeft:"6px", fontSize:"10px", background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"1px 8px" }}>✅ Tagged</span>}
          </div>

          {/* Tag chips */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
            {displayFaces.length > 0 ? displayFaces.map((face: any) => {
              const c = chipColor(face);
              return (
                <div key={face.index} style={{ position:"relative" }}
                  onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setActive(active===face.index ? null : face.index)}
                    style={{ fontSize:"11px", fontWeight:600, padding:"3px 10px", borderRadius:"20px", border:`1px solid ${c.text}40`, background:c.bg, color:c.text, cursor:"pointer" }}>
                    👤 {face.childName || `Face ${face.index+1}`} ✏️
                  </button>
                  {active === face.index && (
                    <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, background:"white", borderRadius:"12px", border:"1px solid #EDE8DF", boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:200, minWidth:"190px", padding:"6px" }}>
                      <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", padding:"3px 8px 5px" }}>Who is this?</div>
                      {children.map((ch: any) => (
                        <button key={ch.id} onClick={() => saveTag(face.index, ch.child_name)}
                          style={{ display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"7px 10px", background:face.childName===ch.child_name?"rgba(23,143,120,0.08)":"transparent", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"12px", color:"#1A2F4A", fontWeight:face.childName===ch.child_name?700:400 }}>
                          {ch.photo_url
                            ? <img src={ch.photo_url} alt="" style={{ width:"22px", height:"22px", borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                            : <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"#EDE8DF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", flexShrink:0 }}>🧒</div>}
                          {ch.child_name}
                          {face.childName===ch.child_name && <span style={{ marginLeft:"auto", color:"#178F78" }}>✓</span>}
                        </button>
                      ))}
                      <div style={{ borderTop:"1px solid #EDE8DF", marginTop:"4px", paddingTop:"4px" }}>
                        <button
                          onClick={async () => {
                            setActive(null);
                            await saveTag(face.index, "");
                          }}
                          style={{ width:"100%", padding:"7px 10px", background:"rgba(220,38,38,0.06)", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"12px", color:"#DC2626", textAlign:"left" as const, fontWeight:700 }}>
                          ✕ Remove tag
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <span style={{ fontSize:"11px", color:"#6B7A99" }}>No tags yet — click Auto-Tag</span>
            )}
          </div>

          {status && (
            <div style={{ fontSize:"10px", marginTop:"5px", color: status.startsWith("❌")?"#DC2626":status.startsWith("✅")?"#178F78":"#B08000" }}>
              {status}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
          {displayFaces.length > 0 && (
            <button onClick={() => setOpen(o=>!o)}
              style={{ fontSize:"11px", background:"rgba(23,143,120,0.08)", color:"#178F78", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"20px", padding:"5px 12px", cursor:"pointer", fontWeight:600 }}>
              {open ? "Close" : "🖼 View"}
            </button>
          )}
          <button onClick={autoTag} disabled={loading}
            style={{ fontSize:"11px", background:loading?"#EDE8DF":"#178F78", color:loading?"#6B7A99":"white", border:"none", borderRadius:"20px", padding:"5px 14px", cursor:loading?"not-allowed":"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:"4px", whiteSpace:"nowrap" }}>
            {loading
              ? <><span style={{ width:"10px", height:"10px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} /> Working…</>
              : "🤖 Auto-Tag"}
          </button>
        </div>
      </div>

      {/* Expanded visual view */}
      {open && (
        <div style={{ borderTop:"1px solid #EDE8DF", padding:"12px" }}>
          <div style={{ position:"relative", display:"inline-block", maxWidth:"100%", width:"100%" }}>
            <img ref={imgRef} src={photo.photo_url} alt="" crossOrigin="anonymous"
              style={{ width:"100%", maxWidth:"520px", display:"block", borderRadius:"10px" }} />
            <canvas ref={canvasRef}
              style={{ position:"absolute", top:0, left:0, width:"100%", maxWidth:"520px", pointerEvents:"none" }} />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
