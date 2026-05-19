"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RefreshCw, Copy, Check, ChevronDown, ArrowLeft } from "lucide-react";
import { FREE_MODELS } from "@/lib/freeModels";

const TOOLS = [
  { id:"activity",    label:"Activity Planner",    desc:"Design a fun classroom activity",      icon:"📅", color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"report",      label:"Progress Report",      desc:"Write a warm end-of-term report",      icon:"📄", color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"lessonplan",  label:"Lesson Plan",          desc:"Structured plan for any topic/skill",  icon:"📚", color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"observation", label:"Observation Notes",    desc:"Professional developmental record",    icon:"👁️", color:"#0F766E", bg:"rgba(15,118,110,0.1)"  },
  { id:"parentmsg",   label:"Parent Message",       desc:"Compose a WhatsApp or email message",  icon:"💬", color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const AGE_GROUPS  = ["2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];
const SKILLS      = ["Language & Communication","Fine Motor Skills","Gross Motor Skills","Social Skills","Creativity & Arts","Numeracy","Literacy","Emotional Intelligence"];
const DURATIONS   = ["15 minutes","30 minutes","45 minutes","1 hour"];

const inp: React.CSSProperties = { width:"100%", border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 13px", fontSize:"13px", color:"#1A2F4A", background:"white", outline:"none", boxSizing:"border-box", fontFamily:"'Quicksand',sans-serif" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
const ta:  React.CSSProperties = { ...inp, resize:"vertical", minHeight:"76px" };
const lbl: React.CSSProperties = { fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.06em", display:"block", marginBottom:"5px" };

function Chip({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700, border:`1px solid ${active ? color : "#EDE8DF"}`, background:active ? color : "white", color:active ? "white" : "#6B7A99", cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}>
      {label}
    </button>
  );
}

export default function TeacherAITools() {
  const router = useRouter();
  const [toolId,      setToolId]    = useState("activity");
  const [modelId,     setModelId]   = useState<string>("llama-3.3-70b-versatile");
  const [result,      setResult]    = useState("");
  const [loading,     setLoading]   = useState(false);
  const [copied,      setCopied]    = useState(false);
  const [modelOpen,   setModelOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const resultRef    = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const modelPickRef = useRef<HTMLDivElement>(null);
  const selectedModel = FREE_MODELS.find(m => m.id === modelId) ?? FREE_MODELS[0];
  const tool = TOOLS.find(t => t.id === toolId) ?? TOOLS[0];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Form state
  const [age,         setAge]      = useState(AGE_GROUPS[1]);
  const [skill,       setSkill]    = useState(SKILLS[0]);
  const [duration,    setDur]      = useState(DURATIONS[1]);
  const [materials,   setMat]      = useState("");
  const [childName,   setChild]    = useState("");
  const [strengths,   setStr]      = useState("");
  const [improvements,setImpr]     = useState("");
  const [topic,       setTopic]    = useState("");
  const [observation, setObs]      = useState("");
  const [setting,     setSetting]  = useState("classroom");
  const [parentTopic, setParTopic] = useState("");
  const [lessonStyle, setStyle]    = useState("visual and kinaesthetic");

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

  const buildParams = (): Record<string,string> => {
    switch (toolId) {
      case "activity":   return { age, skill, duration, materials };
      case "report":     return { childName, age, strengths, improvements };
      case "lessonplan": return { age, topic, duration, style:lessonStyle };
      case "observation":return { childName, age, observation, setting };
      case "parentmsg":  return { childName, topic:parentTopic };
      default: return {};
    }
  };

  const generate = useCallback(async () => {
    const raw = localStorage.getItem("ep_teacher_session");
    if (!raw) { setLoginPrompt(true); return; }
    try {
      const s = JSON.parse(raw);
      const expired = Date.now() - (s.loginTime || 0) > 24 * 60 * 60 * 1000;
      if (expired) { localStorage.removeItem("ep_teacher_session"); setLoginPrompt(true); return; }
    } catch {
      localStorage.removeItem("ep_teacher_session"); setLoginPrompt(true); return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoginPrompt(false); setLoading(true); setResult("");
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
  }, [toolId, modelId, age, skill, duration, materials, childName, strengths, improvements, topic, observation, setting, parentTopic, lessonStyle]);

  return (
    <div style={{ background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif", height:"calc(100vh - 92px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, background:"linear-gradient(135deg,#178F78,#0F766E)", padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
        <button onClick={() => {
            try {
              const s = JSON.parse(localStorage.getItem("ep_teacher_session") || "");
              if (s && Date.now() - (s.loginTime || 0) < 24 * 60 * 60 * 1000) {
                router.push("/teacher-dashboard"); return;
              }
            } catch {}
            router.push("/ai-tools/general");
          }}
          style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"20px", padding:"6px 12px", color:"white", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>
          <ArrowLeft style={{ width:"12px", height:"12px" }} /> Back
        </button>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"white", lineHeight:1 }}>👩‍🏫 Teachers Corner</div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>5 professional tools · AI-powered</div>
        </div>
        <div style={{ flex:1 }} />

      </div>

      {/* ── Tool tab strip ── */}
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
          {/* Tool header */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px", paddingBottom:"14px", borderBottom:"1px solid #EDE8DF" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:tool.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
              {tool.icon}
            </div>
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:tool.color }}>{tool.label}</div>
              <div style={{ fontSize:"11px", color:"#9CA3AF" }}>{tool.desc}</div>
            </div>
          </div>

          {/* Activity Planner */}
          {toolId === "activity" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Skill to Develop</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {SKILLS.map(s => <Chip key={s} label={s} active={skill===s} color={tool.color} onClick={()=>setSkill(s)} />)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Duration</label>
                  <select value={duration} onChange={e=>setDur(e.target.value)} style={sel}>
                    {DURATIONS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Materials Available</label>
                  <input value={materials} onChange={e=>setMat(e.target.value)} placeholder="paper, crayons, blocks…" style={inp} />
                </div>
              </div>
            </div>
          )}

          {/* Progress Report */}
          {toolId === "report" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChild(e.target.value)} placeholder="e.g. Arjun" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Strengths Observed *</label><textarea value={strengths} onChange={e=>setStr(e.target.value)} placeholder="e.g. loves art, very social, great with numbers…" style={ta} /></div>
              <div><label style={lbl}>Areas for Growth</label><textarea value={improvements} onChange={e=>setImpr(e.target.value)} placeholder="e.g. working on sharing, building group confidence…" style={ta} /></div>
            </div>
          )}

          {/* Lesson Plan */}
          {toolId === "lessonplan" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Topic / Skill *</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Colours, Numbers 1–10, Animals, Sharing…" style={inp} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Duration</label><select value={duration} onChange={e=>setDur(e.target.value)} style={sel}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label style={lbl}>Learning Style</label>
                  <select value={lessonStyle} onChange={e=>setStyle(e.target.value)} style={sel}>
                    {["visual and kinaesthetic","auditory","visual","kinaesthetic","multi-sensory"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Observation Notes */}
          {toolId === "observation" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChild(e.target.value)} placeholder="e.g. Priya" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Setting</label>
                <select value={setting} onChange={e=>setSetting(e.target.value)} style={sel}>
                  {["classroom","outdoor play","lunch / snack time","art activity","group circle time","free play","reading corner"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={lbl}>What You Observed *</label><textarea value={observation} onChange={e=>setObs(e.target.value)} placeholder="Describe the behaviour or situation in detail…" style={{ ...ta, minHeight:"100px" }} /></div>
            </div>
          )}

          {/* Parent Message */}
          {toolId === "parentmsg" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Name (optional)</label><input value={childName} onChange={e=>setChild(e.target.value)} placeholder="e.g. Rahul" style={inp} /></div>
              <div><label style={lbl}>What to Communicate *</label><textarea value={parentTopic} onChange={e=>setParTopic(e.target.value)} placeholder="e.g. Child had a small fall today and is fine. Want to inform parent and explain what happened…" style={{ ...ta, minHeight:"100px" }} /></div>
            </div>
          )}

          {/* Model picker + Generate row */}
          <div style={{ display:"flex", gap:"8px", alignItems:"stretch", marginTop:"20px", position:"relative" }}>
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
                    <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); setResult(""); }}
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
              "llama-3.3-70b-versatile": "Rich lesson plans, detailed reports & creative content — best quality",
              "llama-3.1-8b-instant":    "Fastest replies — great for quick messages & simple tasks",
              "llama-3.1-70b-versatile": "128k context window — ideal for long, detailed lesson plans",
              "llama3-70b-8192":         "Classic Llama 3 70B — reliable, balanced quality for all tasks",
              "llama3-8b-8192":          "Compact & quick — great for simple messages and fast turnaround",
            };
            return (
              <div style={{ marginTop:"8px", padding:"8px 12px", borderRadius:"10px", background:"rgba(137,87,229,0.06)", border:"1px solid rgba(137,87,229,0.15)", display:"flex", alignItems:"flex-start", gap:"7px" }}>
                <span style={{ fontSize:"13px", flexShrink:0 }}>⭐</span>
                <span style={{ fontSize:"11px", color:"#6B7A99", lineHeight:1.5 }}>
                  <strong style={{ color:"#8957E5" }}>{selectedModel.name}:</strong> {tips[selectedModel.id]}. Switch model to match your need.
                </span>
              </div>
            );
          })()}

          <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
            {[["🔒","Private"],["⚡","Streaming"],["🎯","India-focused"],["♾️","Unlimited"]].map(([ic,tx]) => (
              <span key={tx} style={{ fontSize:"10px", fontWeight:700, color:"#9CA3AF", background:"#F5F5F5", borderRadius:"20px", padding:"3px 10px" }}>{ic} {tx}</span>
            ))}
          </div>
        </div>

        {/* RIGHT — Result */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px", background:"#F4FAF8", display:"flex", flexDirection:"column" }} ref={resultRef}>
          {loginPrompt ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", textAlign:"center", padding:"20px" }}>
              <div style={{ fontSize:"48px" }}>🔐</div>
              <div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"22px", fontWeight:700, color:"#1A2F4A", marginBottom:"6px" }}>Login to Generate</div>
                <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"320px", lineHeight:1.7 }}>Already a teacher at Evergreen? Login to unlock all 5 tools. New here? Share your profile!</div>
              </div>

              {/* Existing teacher login */}
              <button onClick={() => router.push("/teacher-login")}
                style={{ width:"100%", maxWidth:"360px", display:"flex", alignItems:"center", gap:"14px", padding:"15px 20px", borderRadius:"16px", border:"2px solid rgba(23,143,120,0.35)", background:"linear-gradient(135deg,rgba(23,143,120,0.08),rgba(15,118,110,0.04))", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"30px", flexShrink:0 }}>👩‍🏫</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78" }}>I'm an Existing Teacher</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>Login to access all 5 professional tools</div>
                </div>
                <span style={{ fontSize:"11px", background:"#178F78", color:"white", borderRadius:"20px", padding:"3px 10px", fontWeight:700, whiteSpace:"nowrap" }}>Login →</span>
              </button>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", maxWidth:"360px" }}>
                <div style={{ flex:1, height:"1px", background:"#E5E7EB" }} />
                <span style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:600 }}>OR</span>
                <div style={{ flex:1, height:"1px", background:"#E5E7EB" }} />
              </div>

              {/* Apply */}
              <button onClick={() => router.push("/join-as-teacher")}
                style={{ width:"100%", maxWidth:"360px", display:"flex", alignItems:"center", gap:"14px", padding:"15px 20px", borderRadius:"16px", border:"2px solid rgba(245,184,41,0.4)", background:"linear-gradient(135deg,rgba(245,184,41,0.08),rgba(232,105,74,0.04))", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"30px", flexShrink:0 }}>✨</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#D97706" }}>Looking to Join Us?</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>Share your profile + voice assessment · Takes 3 mins</div>
                </div>
                <span style={{ fontSize:"11px", background:"#F5B829", color:"white", borderRadius:"20px", padding:"3px 10px", fontWeight:700, whiteSpace:"nowrap" }}>Apply →</span>
              </button>

              <button onClick={() => setLoginPrompt(false)}
                style={{ fontSize:"12px", color:"#9CA3AF", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                ← Keep browsing
              </button>
            </div>
          ) : result ? (
            <div style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
              <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:tool.bg, borderBottom:"1px solid #EDE8DF", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <Sparkles style={{ width:"13px", height:"13px", color:tool.color }} />
                  <span style={{ fontSize:"12px", fontWeight:700, color:tool.color }}>
                    {loading ? `Generating with ${selectedModel.icon} ${selectedModel.name}…` : `${selectedModel.icon} ${selectedModel.name} · Teachers Corner`}
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
                      <RefreshCw style={{width:"11px",height:"11px"}} /> Regenerate
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
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", textAlign:"center" }}>
              <div style={{ fontSize:"52px" }}>👩‍🏫</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#178F78" }}>Your result appears here</div>
              <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"280px", lineHeight:1.6 }}>
                Pick a tool, fill in the details, and click <strong>Generate</strong>.
              </div>
              <div style={{ background:"rgba(23,143,120,0.08)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"12px", padding:"10px 18px", fontSize:"12px", color:"#178F78", fontWeight:700 }}>
                {selectedModel.icon} {selectedModel.name} <span style={{ fontWeight:400, color:"#6B7A99" }}>· {selectedModel.badge} · Free</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
