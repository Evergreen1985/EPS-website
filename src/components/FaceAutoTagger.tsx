"use client";
import { useState, useRef, useEffect } from "react";

interface Child {
  id: string;
  child_name: string;
  photo_url: string;
}

interface Props {
  photo: any;
  sectionId: string;
  children: Child[];
  onSaved: () => void;
}

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model";

declare global {
  interface Window { faceapi: any; }
}

export default function FaceAutoTagger({ photo, sectionId, children, onSaved }: Props) {
  const [open, setOpen]         = useState(false);
  const [status, setStatus]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [faces, setFaces]       = useState<any[]>([]);
  const [activeFace, setActive] = useState<number | null>(null);
  const canvasRef               = useRef<HTMLCanvasElement>(null);
  const imgRef                  = useRef<HTMLImageElement>(null);

  let parsedFaces: any[] = [];
  try { parsedFaces = photo.ai_tags ? JSON.parse(photo.ai_tags) : []; } catch {}
  const tagged    = parsedFaces.filter((f: any) => f.childName).length;
  const allTagged = parsedFaces.length > 0 && tagged === parsedFaces.length;

  useEffect(() => {
    const close = () => setActive(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  // Load face-api.js from CDN
  const loadFaceApi = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.faceapi) { resolve(); return; }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load face-api.js"));
      document.head.appendChild(script);
    });
  };

  const loadModels = async () => {
    const fa = window.faceapi;
    await Promise.all([
      fa.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  };

  const loadImageElement = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url.split("?")[0] + "?t=" + Date.now();
    });
  };

  const autoTag = async () => {
    setLoading(true);
    setStatus("Loading face recognition models…");

    try {
      await loadFaceApi();
      await loadModels();
      const fa = window.faceapi;

      // Build reference descriptors from children profile photos
      setStatus(`Loading ${children.length} profile photos…`);
      const labeled: any[] = [];
      for (const child of children) {
        if (!child.photo_url) continue;
        try {
          const img = await loadImageElement(child.photo_url);
          const det = await fa.detectSingleFace(img, new fa.SsdMobilenetv1Options({ minConfidence: 0.3 }))
            .withFaceLandmarks().withFaceDescriptor();
          if (det) {
            labeled.push({ name: child.child_name, descriptor: det.descriptor });
          }
        } catch { /* skip failed profile */ }
      }

      if (labeled.length === 0) {
        setStatus("❌ No faces found in profile photos. Make sure children have clear profile photos uploaded.");
        setLoading(false);
        return;
      }

      setStatus(`Scanning class photo for faces…`);
      const classImg = await loadImageElement(photo.photo_url);
      const detections = await fa.detectAllFaces(classImg, new fa.SsdMobilenetv1Options({ minConfidence: 0.3 }))
        .withFaceLandmarks().withFaceDescriptors();

      if (detections.length === 0) {
        setStatus("No faces detected in class photo. Try a clearer photo.");
        setLoading(false);
        return;
      }

      setStatus(`Matching ${detections.length} faces to ${labeled.length} children…`);

      // Match each detected face to closest labeled profile
      const { width, height } = classImg;
      const matched: any[] = detections.map((det: any, idx: number) => {
        const box = det.detection.box;
        // Find best matching child by Euclidean distance
        let bestName = null;
        let bestDist = Infinity;
        for (const ref of labeled) {
          const dist = fa.euclideanDistance(det.descriptor, ref.descriptor);
          if (dist < bestDist) { bestDist = dist; bestName = ref.name; }
        }
        const confidence = bestDist < 0.45 ? "high" : bestDist < 0.55 ? "medium" : "low";
        return {
          index:      idx,
          x:          Math.round(box.x),
          y:          Math.round(box.y),
          w:          Math.round(box.width),
          h:          Math.round(box.height),
          imgW:       width,
          imgH:       height,
          childName:  bestDist < 0.6 ? bestName : null, // threshold 0.6
          confidence: bestDist < 0.6 ? confidence : null,
          distance:   Math.round(bestDist * 100) / 100,
          autoTagged: bestDist < 0.6,
        };
      });

      const autoCount = matched.filter(f => f.autoTagged).length;
      setFaces(matched);
      setStatus(`✅ ${autoCount}/${detections.length} faces auto-matched! Click any face to correct.`);

      // Draw on canvas
      if (canvasRef.current && imgRef.current) {
        const canvas  = canvasRef.current;
        const imgEl   = imgRef.current;
        canvas.width  = imgEl.offsetWidth;
        canvas.height = imgEl.offsetHeight;
        const ctx     = canvas.getContext("2d")!;
        const scaleX  = imgEl.offsetWidth  / width;
        const scaleY  = imgEl.offsetHeight / height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        matched.forEach(f => {
          const color = f.childName
            ? f.confidence === "high" ? "#178F78"
            : f.confidence === "medium" ? "#F5B829" : "#E8694A"
            : "#E8694A";
          ctx.strokeStyle = color;
          ctx.lineWidth   = 2;
          ctx.strokeRect(f.x * scaleX, f.y * scaleY, f.w * scaleX, f.h * scaleY);
          ctx.fillStyle   = color;
          ctx.fillRect(f.x * scaleX, (f.y + f.h) * scaleY, f.w * scaleX, 18);
          ctx.fillStyle   = "white";
          ctx.font        = "11px sans-serif";
          ctx.fillText(f.childName || "?", f.x * scaleX + 3, (f.y + f.h) * scaleY + 13);
        });
      }

      // Save to DB
      const namedChildren = matched.filter(f => f.childName).map(f => f.childName).join(",");
      await fetch("/api/photos/detect-faces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId:   photo.id,
          bulkFaces: matched,
          caption:   namedChildren,
        }),
      });
      onSaved();

    } catch (e: any) {
      setStatus(`❌ ${e.message}`);
    }
    setLoading(false);
  };

  const saveTag = async (faceIndex: number, childName: string) => {
    const updated = displayFaces.map((f: any) =>
      f.index === faceIndex ? { ...f, childName, confidence: "manual" } : f
    );
    setFaces(updated);
    setActive(null);
    const namedChildren = updated.filter((f: any) => f.childName).map((f: any) => f.childName).join(",");
    await fetch("/api/photos/detect-faces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoId: photo.id, bulkFaces: updated, caption: namedChildren }),
    });
    onSaved();
  };

  return (
    <div style={{ background:"white", borderRadius:"16px", border:`1px solid ${allTagged?"rgba(23,143,120,0.35)":"#EDE8DF"}`, overflow:"hidden", marginBottom:"10px" }}>
      {/* Header row */}
      <div style={{ display:"flex", gap:"12px", padding:"12px", alignItems:"center" }}>
        <div style={{ position:"relative", flexShrink:0, cursor:"pointer" }} onClick={() => setOpen(o => !o)}>
          <img src={photo.photo_url} alt="" style={{ width:"80px", height:"65px", objectFit:"cover", borderRadius:"10px", display:"block" }} />
          {parsedFaces.length > 0 && (
            <div style={{ position:"absolute", bottom:"3px", right:"3px", background:"rgba(0,0,0,0.6)", borderRadius:"20px", padding:"1px 6px", fontSize:"9px", color:"white", fontWeight:700 }}>
              👤 {parsedFaces.length}
            </div>
          )}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A", marginBottom:"3px" }}>
            {photo.title || "Class photo"}
            {allTagged && <span style={{ marginLeft:"6px", fontSize:"10px", background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"1px 8px" }}>✅ Tagged</span>}
          </div>

          {/* Tag chips — always visible, click to change/remove */}
          {parsedFaces.length > 0 ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", marginBottom:"4px" }}>
              {parsedFaces.map((face: any) => (
                <div key={face.index} style={{ position:"relative" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActive(activeFace === face.index ? null : face.index); }}
                    style={{
                      fontSize:"10px", fontWeight:600, padding:"3px 8px", borderRadius:"20px", border:"none", cursor:"pointer",
                      background: face.childName
                        ? face.confidence==="high" ? "rgba(23,143,120,0.12)"
                        : face.confidence==="medium" ? "rgba(245,184,41,0.12)" : "rgba(232,105,74,0.12)"
                        : "#F0F0F0",
                      color: face.childName
                        ? face.confidence==="high" ? "#178F78"
                        : face.confidence==="medium" ? "#B08000" : "#E8694A"
                        : "#6B7A99",
                    }}>
                    👤 {face.childName || `Face ${face.index+1}`} ✏️
                  </button>
                  {/* Inline dropdown */}
                  {activeFace === face.index && (
                    <div style={{ position:"absolute", top:"100%", left:0, marginTop:"4px", background:"white", borderRadius:"12px", border:"1px solid #EDE8DF", boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:100, minWidth:"180px", padding:"6px" }}
                    onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", padding:"3px 8px 5px" }}>Change to:</div>
                      {children.map((c: any) => (
                        <button key={c.id} onClick={() => saveTag(face.index, c.child_name)}
                          style={{ display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"7px 10px", background:face.childName===c.child_name?"rgba(23,143,120,0.08)":"transparent", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"12px", color:"#1A2F4A", fontWeight:face.childName===c.child_name?700:400 }}>
                          {c.photo_url
                            ? <img src={c.photo_url} alt="" style={{ width:"22px", height:"22px", borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                            : <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"#EDE8DF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", flexShrink:0 }}>🧒</div>}
                          {c.child_name}
                          {face.childName===c.child_name && <span style={{ marginLeft:"auto", color:"#178F78" }}>✓</span>}
                        </button>
                      ))}
                      <div style={{ borderTop:"1px solid #EDE8DF", marginTop:"4px", paddingTop:"4px" }}>
                        <button onClick={() => saveTag(face.index, "")}
                          style={{ width:"100%", padding:"6px 10px", background:"rgba(220,38,38,0.06)", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"11px", color:"#DC2626", textAlign:"left" as const, fontWeight:600 }}>
                          ✕ Remove this tag
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize:"11px", color:"#6B7A99", marginBottom:"3px" }}>Not tagged yet — click Auto-Tag</div>
          )}

          {status && <div style={{ fontSize:"10px", color: status.startsWith("❌")?"#DC2626":status.startsWith("✅")?"#178F78":"#F5B829", marginTop:"2px" }}>{status}</div>}
        </div>
        <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
          <button onClick={() => { setOpen(o => !o); if (!open && displayFaces.length===0) {} }}
            style={{ fontSize:"11px", background:"rgba(23,143,120,0.08)", color:"#178F78", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"20px", padding:"5px 12px", cursor:"pointer", fontWeight:600 }}>
            {open ? "Close" : "✏️ Tag"}
          </button>
          <button onClick={() => { setOpen(true); autoTag(); }} disabled={loading}
            style={{ fontSize:"11px", background:loading?"#EDE8DF":"#178F78", color:loading?"#6B7A99":"white", border:"none", borderRadius:"20px", padding:"5px 14px", cursor:loading?"not-allowed":"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:"4px" }}>
            {loading
              ? <><span style={{ width:"10px", height:"10px", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.8s linear infinite" }} /> Working…</>
              : "🤖 Auto-Tag"}
          </button>
        </div>
      </div>

      {/* Expanded visual tagging */}
      {open && (
        <div style={{ borderTop:"1px solid #EDE8DF", padding:"12px" }}>
          <div style={{ fontSize:"11px", color:"#6B7A99", marginBottom:"8px" }}>
            Click a face box to tag manually · 🟢 High · 🟡 Medium · 🔴 Low/Unmatched
          </div>
          <div style={{ position:"relative", display:"inline-block", maxWidth:"100%", width:"100%" }}>
            <img ref={imgRef} src={photo.photo_url} alt="" crossOrigin="anonymous"
              style={{ width:"100%", maxWidth:"520px", display:"block", borderRadius:"10px" }} />
            <canvas ref={canvasRef}
              style={{ position:"absolute", top:0, left:0, width:"100%", maxWidth:"520px", pointerEvents:"none" }} />
            {/* Clickable face areas */}
            {displayFaces.map((face: any) => {
              const imgEl  = imgRef.current;
              if (!imgEl) return null;
              const dispW  = imgEl.offsetWidth;
              const dispH  = imgEl.offsetHeight;
              const natW   = face.imgW || imgEl.naturalWidth  || dispW;
              const natH   = face.imgH || imgEl.naturalHeight || dispH;
              const scaleX = dispW / natW;
              const scaleY = dispH / natH;
              const color  = face.childName
                ? face.confidence==="high" ? "#178F78"
                : face.confidence==="medium" ? "#F5B829" : "#E8694A"
                : "#E8694A";
              return (
                <div key={face.index}>
                  <div onClick={() => setActive(activeFace===face.index ? null : face.index)}
                    style={{
                      position:"absolute",
                      left: `${face.x * scaleX}px`,
                      top:  `${face.y * scaleY}px`,
                      width:`${face.w * scaleX}px`,
                      height:`${face.h * scaleY}px`,
                      border:`2px solid ${color}`,
                      borderRadius:"4px",
                      cursor:"pointer",
                      background:`${color}15`,
                    }}>
                    <div style={{ position:"absolute", bottom:"-18px", left:0, background:color, color:"white", fontSize:"9px", fontWeight:700, padding:"1px 5px", borderRadius:"0 0 5px 5px", whiteSpace:"nowrap", maxWidth:"100px", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {face.childName || "?"}
                    </div>
                  </div>
                  {activeFace === face.index && (
                    <div style={{
                      position:"absolute",
                      left: `${face.x * scaleX}px`,
                      top:  `${(face.y + face.h) * scaleY + 22}px`,
                      background:"white", borderRadius:"12px", border:"1px solid #EDE8DF",
                      boxShadow:"0 8px 24px rgba(0,0,0,0.15)", zIndex:50, minWidth:"180px", padding:"6px",
                    }}>
                      <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", padding:"3px 8px" }}>Who is this?</div>
                      {children.map((c: any) => (
                        <button key={c.id} onClick={() => saveTag(face.index, c.child_name)}
                          style={{ display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"7px 10px", background:face.childName===c.child_name?"rgba(23,143,120,0.08)":"transparent", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"12px", fontWeight:face.childName===c.child_name?700:400, color:"#1A2F4A" }}>
                          {c.photo_url
                            ? <img src={c.photo_url} alt="" style={{ width:"24px", height:"24px", borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                            : <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:"#EDE8DF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0 }}>🧒</div>}
                          {c.child_name}
                          {face.childName===c.child_name && <span style={{ marginLeft:"auto", color:"#178F78" }}>✓</span>}
                        </button>
                      ))}
                      <button onClick={() => saveTag(face.index, "")}
                        style={{ width:"100%", padding:"6px 10px", background:"transparent", border:"none", borderRadius:"8px", cursor:"pointer", fontSize:"11px", color:"#DC2626", textAlign:"left" as const }}>
                        ✕ Remove tag
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
