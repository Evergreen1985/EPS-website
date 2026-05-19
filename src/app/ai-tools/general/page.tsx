"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RefreshCw, Copy, Check, ChevronDown } from "lucide-react";
import { FREE_MODELS } from "@/lib/freeModels";

const TOOLS = [
  { id:"homeactivity", label:"Activity Ideas",  desc:"3 fun home activities with household items", icon:"🎨", color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"kidstory",     label:"Story Time",       desc:"Short exciting story to listen to",          icon:"📖", color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"riddle",       label:"Fun Riddles",      desc:"5 clever age-appropriate riddles",           icon:"🤔", color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"drawing",      label:"Drawing Guide",    desc:"Step-by-step drawing adventure",             icon:"🖍️", color:"#0F766E", bg:"rgba(15,118,110,0.1)"  },
  { id:"song",         label:"Song & Rhyme",     desc:"Original fun sing-along with actions",       icon:"🎵", color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const AGE_GROUPS     = ["2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];
const HOME_THEMES    = ["Indoor Fun","Kitchen Science","Nature & Outdoors","Arts & Craft","Sensory Play","Movement & Dance","Rainy Day Fun","Festival Activities"];
const STORY_CHARS    = ["A brave little mouse","A curious elephant","A friendly dragon","A tiny frog","A baby lion","A little owl","A kind robot"];
const DRAWING_THEMES = ["Animals","Birds","Fruit & Vegetables","Sea Creatures","Vehicles","Flowers","Insects","Fantasy Creatures"];
const SONG_THEMES    = ["Animals & Nature","Rain & Weather","Numbers & Counting","Colours","Morning Routines","Friendship","Food & Eating","Seasons"];

const inp: React.CSSProperties = { width:"100%", border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 13px", fontSize:"13px", color:"#1A2F4A", background:"white", outline:"none", boxSizing:"border-box", fontFamily:"'Quicksand',sans-serif" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
const lbl: React.CSSProperties = { fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.06em", display:"block", marginBottom:"5px" };

function Chip({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700, border:`1px solid ${active ? color : "#EDE8DF"}`, background:active ? color : "white", color:active ? "white" : "#6B7A99", cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}>
      {label}
    </button>
  );
}

export default function GeneralAITools() {
  const router = useRouter();
  const [toolId,      setToolId]      = useState("homeactivity");
  const [modelId,     setModelId]     = useState<string>("llama-3.1-8b-instant"); // fastest for guests
  const [loggedInRole, setLoggedInRole] = useState<"teacher"|"parent"|null>(null);
  const [result,      setResult]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [modelOpen,   setModelOpen]   = useState(false);
  const resultRef    = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const modelPickRef = useRef<HTMLDivElement>(null);
  const selectedModel = FREE_MODELS.find(m => m.id === modelId) ?? FREE_MODELS[0];
  const tool = TOOLS.find(t => t.id === toolId) ?? TOOLS[0];

  // Detect session on mount and set recommended model
  useEffect(() => {
    const EXPIRY = 24 * 60 * 60 * 1000;
    const isValid = (key: string) => {
      try {
        const s = JSON.parse(localStorage.getItem(key) || "");
        return Date.now() - (s.loginTime || 0) < EXPIRY;
      } catch { return false; }
    };
    if (isValid("ep_teacher_session")) {
      setLoggedInRole("teacher");
      setModelId("llama-3.3-70b-versatile"); // best quality for logged-in
    } else if (isValid("ep_parent_session")) {
      setLoggedInRole("parent");
      setModelId("llama-3.3-70b-versatile");
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (resultRef.current && result) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [result]);

  useEffect(() => {
    if (!modelOpen) return;
    const h = (e: MouseEvent) => {
      if (modelPickRef.current && !modelPickRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [modelOpen]);

  // Form state
  const [age,       setAge]       = useState(AGE_GROUPS[1]);
  const [theme,     setTheme]     = useState(HOME_THEMES[0]);
  const [materials, setMat]       = useState("");
  const [character, setCharacter] = useState(STORY_CHARS[0]);
  const [kidsetting,setKidSet]    = useState("a magical garden in India");
  const [drawTheme, setDrawTheme] = useState(DRAWING_THEMES[0]);
  const [songTheme, setSongTheme] = useState(SONG_THEMES[0]);

  const buildParams = (): Record<string,string> => {
    switch (toolId) {
      case "homeactivity": return { age, theme, materials };
      case "kidstory":     return { age, character, setting:kidsetting };
      case "riddle":       return { age };
      case "drawing":      return { age, theme:drawTheme };
      case "song":         return { age, theme:songTheme };
      default: return {};
    }
  };

  const generate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setResult("");
    try {
      const res = await fetch("/api/ai-tools", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ tool:toolId, model:modelId, ...buildParams() }),
        signal:ctrl.signal,
      });
      if (!res.ok || !res.body) { setResult("❌ Failed to generate. Try again."); setLoading(false); return; }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream:true });
        setResult(text);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setResult("❌ Connection error. Check your network.");
    } finally { setLoading(false); }
  }, [toolId, modelId, age, theme, materials, character, kidsetting, drawTheme, songTheme]);

  return (
    <div style={{ background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif", height:"calc(100vh - 92px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, background:"linear-gradient(135deg,#1A2F4A,#178F78)", padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"white", lineHeight:1 }}>🌿 General Activities</div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>Free for everyone · No login needed</div>
        </div>
        <div style={{ flex:1 }} />

        {/* Login prompts */}
        <button onClick={() => router.push("/teacher-login")}
          style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"20px", padding:"6px 12px", color:"white", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>
          👩‍🏫 Staff Login
        </button>
        <button onClick={() => router.push("/parent-login")}
          style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(137,87,229,0.4)", border:"1px solid rgba(137,87,229,0.5)", borderRadius:"20px", padding:"6px 12px", color:"white", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>
          👨‍👩‍👧 Parent Login
        </button>

      </div>

      {/* ── Tool strip ── */}
      <div style={{ flexShrink:0, background:"white", borderBottom:"1px solid #EDE8DF", display:"flex", overflowX:"auto" }}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => { setToolId(t.id); setResult(""); }}
            style={{ display:"flex", alignItems:"center", gap:"6px", padding:"11px 18px", border:"none", borderBottom:`3px solid ${toolId===t.id ? t.color : "transparent"}`, background:"transparent", fontWeight:700, fontSize:"12px", color:toolId===t.id ? t.color : "#6B7A99", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}

      </div>

      {/* ── Main split ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex" }}>

        {/* LEFT — Form */}
        <div style={{ width:"44%", borderRight:"1px solid #EDE8DF", overflowY:"auto", padding:"20px", background:"white" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px", paddingBottom:"14px", borderBottom:"1px solid #EDE8DF" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:tool.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
              {tool.icon}
            </div>
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:tool.color }}>{tool.label}</div>
              <div style={{ fontSize:"11px", color:"#9CA3AF" }}>{tool.desc}</div>
            </div>
          </div>

          {/* Activity Ideas */}
          {toolId === "homeactivity" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Activity Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {HOME_THEMES.map(t => <Chip key={t} label={t} active={theme===t} color={tool.color} onClick={()=>setTheme(t)} />)}
                </div>
              </div>
              <div><label style={lbl}>Available Materials (optional)</label>
                <input value={materials} onChange={e=>setMat(e.target.value)} placeholder="e.g. newspapers, rice, empty bottles, paint…" style={inp} />
              </div>
            </div>
          )}

          {/* Story Time */}
          {toolId === "kidstory" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Main Character</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {STORY_CHARS.map(c => <Chip key={c} label={c} active={character===c} color={tool.color} onClick={()=>setCharacter(c)} />)}
                </div>
              </div>
              <div><label style={lbl}>Story Setting</label>
                <input value={kidsetting} onChange={e=>setKidSet(e.target.value)} placeholder="e.g. a magical garden in India…" style={inp} />
              </div>
            </div>
          )}

          {/* Riddles */}
          {toolId === "riddle" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div style={{ background:"rgba(232,105,74,0.06)", borderRadius:"12px", padding:"12px", fontSize:"12px", color:"#6B7A99", lineHeight:1.6 }}>
                🤔 5 fun age-appropriate riddles will be generated — perfect for bedtime or car rides!
              </div>
            </div>
          )}

          {/* Drawing Guide */}
          {toolId === "drawing" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Drawing Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {DRAWING_THEMES.map(t => <Chip key={t} label={t} active={drawTheme===t} color={tool.color} onClick={()=>setDrawTheme(t)} />)}
                </div>
              </div>
            </div>
          )}

          {/* Song & Rhyme */}
          {toolId === "song" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Song Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {SONG_THEMES.map(t => <Chip key={t} label={t} active={songTheme===t} color={tool.color} onClick={()=>setSongTheme(t)} />)}
                </div>
              </div>
            </div>
          )}

          {/* Model picker + Generate row */}
          <div style={{ display:"flex", gap:"8px", alignItems:"stretch", marginTop:"20px", position:"relative" }}>
            {/* Model picker — equal flex */}
            <div ref={modelPickRef} style={{ position:"relative", flex:1 }}>
              <button onClick={() => setModelOpen(o => !o)}
                style={{ display:"flex", alignItems:"center", gap:"8px", width:"100%", padding:"13px 14px", border:"2px solid #8957E5", borderRadius:"12px", background:"linear-gradient(135deg,rgba(137,87,229,0.1),rgba(137,87,229,0.04))", cursor:"pointer", fontFamily:"'Quicksand',sans-serif" }}>
                <span style={{ fontSize:"18px" }}>{selectedModel.icon}</span>
                <div style={{ flex:1, textAlign:"left" as const, minWidth:0 }}>
                  <div style={{ fontSize:"13px", fontWeight:700, color:"#1A2F4A", lineHeight:1.1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{selectedModel.name}</div>
                  <div style={{ fontSize:"9px", fontWeight:700, color:"#8957E5", marginTop:"2px" }}>✓ {selectedModel.badge}</div>
                </div>
                <ChevronDown strokeWidth={3} style={{ width:"14px", height:"14px", color:"#8957E5", flexShrink:0 }} />
              </button>
              {modelOpen && (
                <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:0, right:0, background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", boxShadow:"0 8px 32px rgba(0,0,0,0.15)", zIndex:100, overflow:"hidden", minWidth:"260px" }}>
                  <div style={{ padding:"8px 14px", borderBottom:"1px solid #EDE8DF", fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const }}>🆓 Free Models · Groq</div>
                  {FREE_MODELS.map(m => (
                    <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); }}
                      style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"8px 14px", border:"none", background:modelId===m.id?"rgba(137,87,229,0.08)":"white", cursor:"pointer", textAlign:"left" as const }}>
                      <span style={{ fontSize:"15px" }}>{m.icon}</span>
                      <span style={{ flex:1, fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{m.name}</span>
                      <span style={{ fontSize:"9px", fontWeight:700, background:modelId===m.id?"rgba(137,87,229,0.15)":"#F0F4F8", color:modelId===m.id?"#8957E5":"#6B7A99", borderRadius:"6px", padding:"2px 7px" }}>{m.badge}</span>
                      {modelId===m.id && <span style={{ color:"#8957E5", fontSize:"12px" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate — equal flex */}
            <button onClick={generate} disabled={loading}
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"13px", borderRadius:"12px", border:"none", fontWeight:700, fontSize:"14px", color:"white", cursor:loading?"not-allowed":"pointer", background:loading?"#b2dfdb":tool.color, boxShadow:loading?"none":`0 6px 20px ${tool.color}40`, transition:"all 0.2s", fontFamily:"'Quicksand',sans-serif" }}>
              {loading
                ? <><Loader2 style={{ width:"15px", height:"15px", animation:"spin 0.8s linear infinite" }} /> Generating…</>
                : <><Sparkles style={{ width:"15px", height:"15px" }} /> Generate</>}
            </button>
          </div>

          {/* Model tip */}
          {(() => {
            const tips: Record<string,string> = {
              "llama-3.3-70b-versatile": "Rich stories, detailed plans & creative content — best quality output",
              "llama-3.1-8b-instant":    "Fastest replies — great for quick activity ideas & simple tasks",
              "llama-3.1-70b-versatile": "128k context window — ideal for long, detailed multi-step tasks",
              "llama3-70b-8192":         "Classic Llama 3 70B — reliable, balanced quality for all tasks",
              "llama3-8b-8192":          "Compact & quick — great for simple content and fast turnaround",
            };
            const isAutoSelected = loggedInRole && selectedModel.id === "llama-3.3-70b-versatile";
            return (
              <div style={{ marginTop:"8px", padding:"8px 12px", borderRadius:"10px", background: isAutoSelected ? "rgba(137,87,229,0.06)" : "rgba(23,143,120,0.06)", border:`1px solid ${isAutoSelected ? "rgba(137,87,229,0.2)" : "rgba(23,143,120,0.15)"}`, display:"flex", alignItems:"flex-start", gap:"7px" }}>
                <span style={{ fontSize:"13px", flexShrink:0 }}>{isAutoSelected ? "⭐" : "💡"}</span>
                <span style={{ fontSize:"11px", color:"#6B7A99", lineHeight:1.5 }}>
                  {isAutoSelected
                    ? <><strong style={{ color:"#8957E5" }}>Auto-selected for you:</strong> {tips[selectedModel.id]}. You can switch below if needed.</>
                    : <><strong style={{ color:"#178F78" }}>{selectedModel.name}:</strong> {tips[selectedModel.id]}. Switch model above to match your need.</>
                  }
                </span>
              </div>
            );
          })()}

          <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
            {[["🆓","Free forever"],["⚡","Real AI"],["🔒","Private"],["🇮🇳","India-focused"]].map(([ic,tx]) => (
              <span key={tx} style={{ fontSize:"10px", fontWeight:700, color:"#9CA3AF", background:"#F5F5F5", borderRadius:"20px", padding:"3px 10px" }}>{ic} {tx}</span>
            ))}
          </div>
        </div>

        {/* RIGHT — Result */}
        <div style={{ flex:1, overflow:"hidden", background:"#F4FAF8", display:"flex", flexDirection:"column" }}>

          {/* ── Unlock banner — always visible ── */}
          <div style={{ flexShrink:0, position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#0F1F35,#1A2F4A)", borderBottom:"2px solid rgba(255,255,255,0.06)", padding:"14px 18px" }}>
            {/* shimmer sweep */}
            <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.06) 50%,transparent 60%)", animation:"shimmer 2.8s ease-in-out infinite", pointerEvents:"none" }} />
            <div style={{ position:"relative", display:"flex", alignItems:"center", gap:"14px" }}>
              {/* Left copy */}
              <div style={{ flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                  <span style={{ fontSize:"14px" }}>✨</span>
                  <span style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"14px", fontWeight:700, color:"white", letterSpacing:"0.01em" }}>Login for more powerful tools</span>
                </div>
                <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.45)", paddingLeft:"20px" }}>Personalised AI · Reports · Stories · Meals & more</div>
              </div>
              <div style={{ flex:1 }} />
              {/* Teacher button */}
              <button onClick={() => router.push("/ai-tools/teacher")}
                style={{ display:"flex", alignItems:"center", gap:"7px", padding:"7px 11px", borderRadius:"12px", border:"1px solid rgba(23,143,120,0.5)", background:"rgba(23,143,120,0.2)", color:"white", cursor:"pointer", transition:"all 0.2s", backdropFilter:"blur(8px)", flexShrink:0 }}>
                <span style={{ fontSize:"17px" }}>👩‍🏫</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:"11px", fontWeight:700, lineHeight:1.1 }}>I'm a Teacher</div>
                  <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.55)", marginTop:"2px" }}>Plans · Reports · Lessons</div>
                </div>
                <span style={{ fontSize:"10px", background:"#178F78", borderRadius:"20px", padding:"2px 7px", fontWeight:700, whiteSpace:"nowrap" }}>5 →</span>
              </button>
              {/* Parent button */}
              <button onClick={() => router.push("/ai-tools/parent")}
                style={{ display:"flex", alignItems:"center", gap:"7px", padding:"7px 11px", borderRadius:"12px", border:"1px solid rgba(137,87,229,0.5)", background:"rgba(137,87,229,0.2)", color:"white", cursor:"pointer", transition:"all 0.2s", backdropFilter:"blur(8px)", flexShrink:0 }}>
                <span style={{ fontSize:"17px" }}>👨‍👩‍👧</span>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:"11px", fontWeight:700, lineHeight:1.1 }}>I'm a Parent</div>
                  <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.55)", marginTop:"2px" }}>Stories · Milestones · Meals</div>
                </div>
                <span style={{ fontSize:"10px", background:"#8957E5", borderRadius:"20px", padding:"2px 7px", fontWeight:700, whiteSpace:"nowrap" }}>8 →</span>
              </button>
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column" }} ref={resultRef}>
          {result ? (
            <div style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:tool.bg, borderBottom:"1px solid #EDE8DF", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <Sparkles style={{ width:"13px", height:"13px", color:tool.color }} />
                  <span style={{ fontSize:"12px", fontWeight:700, color:tool.color }}>
                    {loading ? `Generating with ${selectedModel.icon} ${selectedModel.name}…` : `${selectedModel.icon} ${selectedModel.name} · General Activities`}
                  </span>
                  {loading && <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:tool.color, display:"inline-block", animation:"pulse 1s infinite" }} />}
                </div>
                {!loading && (
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                      style={{ display:"flex", alignItems:"center", gap:"5px", background:"white", border:"1px solid #EDE8DF", borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:700, color:copied?"#178F78":"#6B7A99", cursor:"pointer" }}>
                      {copied ? <><Check style={{width:"11px",height:"11px"}} /> Copied!</> : <><Copy style={{width:"11px",height:"11px"}} /> Copy</>}
                    </button>
                    <button onClick={generate}
                      style={{ display:"flex", alignItems:"center", gap:"5px", background:"white", border:"1px solid #EDE8DF", borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:700, color:tool.color, cursor:"pointer" }}>
                      <RefreshCw style={{width:"11px",height:"11px"}} /> Try again
                    </button>
                  </div>
                )}
              </div>
              <div style={{ padding:"20px", flex:1, overflowY:"auto" }}>
                <p style={{ fontSize:"13px", lineHeight:1.85, color:"#374151", whiteSpace:"pre-wrap", margin:0 }}>{result}</p>
                {loading && <span style={{ display:"inline-block", width:"2px", height:"14px", background:tool.color, marginLeft:"2px", animation:"pulse 0.8s infinite", borderRadius:"2px" }} />}
              </div>
            </div>
          ) : (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", textAlign:"center" }}>
              <div style={{ fontSize:"56px" }}>🌿</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"22px", fontWeight:700, color:"#1A2F4A" }}>Ready to Generate</div>
              <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"300px", lineHeight:1.7 }}>
                Pick an activity type and options on the left, then click <strong>Generate</strong> to get started.
              </div>
              <div style={{ background:"rgba(23,143,120,0.07)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"12px", padding:"10px 18px", fontSize:"12px", color:"#178F78", fontWeight:700 }}>
                {selectedModel.icon} {selectedModel.name} <span style={{ fontWeight:400, color:"#6B7A99" }}>· {selectedModel.badge}</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes shimmer { 0% { transform:translateX(-100%); } 100% { transform:translateX(200%); } }
      `}</style>
    </div>
  );
}
