"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, RefreshCw, Copy, Check, ChevronDown, ArrowLeft } from "lucide-react";
import { FREE_MODELS } from "@/lib/freeModels";

type Audience = "parent" | "kids";

const PARENT_TOOLS = [
  { id:"story",    label:"Story Generator",   desc:"Personalised bedtime story",            icon:"📖", color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"milestone",label:"Milestone Advisor", desc:"What to expect at this age",            icon:"🧠", color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"childqa",  label:"Ask an Expert",     desc:"Any parenting or development question", icon:"💡", color:"#6366F1", bg:"rgba(99,102,241,0.1)"  },
  { id:"mealidea", label:"Healthy Meal Ideas",desc:"Indian recipes for your child",         icon:"🥗", color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];
const KIDS_TOOLS = [
  { id:"kidstory", label:"Mini Story",     desc:"Short exciting story to listen to", icon:"✨", color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"riddle",   label:"Fun Riddles",    desc:"5 age-appropriate riddles",         icon:"🤔", color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"drawing",  label:"Drawing Guide", desc:"Step-by-step drawing adventure",    icon:"🎨", color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"song",     label:"Song & Rhyme",  desc:"Original fun sing-along",           icon:"🎵", color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const AGE_GROUPS    = ["2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];
const STORY_THEMES  = ["Forest Adventure","Friendship at School","Magical Garden","Ocean Discovery","Space Explorer","The Kind Dragon","Farm Animals","Rainy Day Fun"];
const DRAWING_THEMES= ["Animals","Birds","Fruit & Vegetables","Sea Creatures","Vehicles","Flowers","Insects","Fantasy Creatures"];
const SONG_THEMES   = ["Animals & Nature","Rain & Weather","Numbers & Counting","Colours","Morning Routines","Friendship","Food & Eating","Seasons"];
const CHAR_OPTIONS  = ["A brave little mouse","A curious elephant","A friendly dragon","A tiny frog","A baby lion","A little owl","A kind robot"];

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

export default function ParentAITools() {
  const router = useRouter();
  const [audience,   setAudience]  = useState<Audience>("parent");
  const [toolId,     setToolId]    = useState("story");
  const [modelId,    setModelId]   = useState<string>("llama-3.3-70b-versatile");
  const [result,     setResult]    = useState("");
  const [loading,    setLoading]   = useState(false);
  const [copied,     setCopied]    = useState(false);
  const [modelOpen,   setModelOpen]   = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const resultRef    = useRef<HTMLDivElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const modelPickRef = useRef<HTMLDivElement>(null);
  const selectedModel = FREE_MODELS.find(m => m.id === modelId) ?? FREE_MODELS[0];

  const allTools = audience === "parent" ? PARENT_TOOLS : KIDS_TOOLS;
  const tool     = allTools.find(t => t.id === toolId) ?? allTools[0];

  const audGradient = audience === "parent"
    ? "linear-gradient(135deg,#8957E5,#6366F1)"
    : "linear-gradient(135deg,#E8694A,#F5B829)";

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Form state
  const [age,        setAge]       = useState(AGE_GROUPS[1]);
  const [childName,  setChild]     = useState("");
  const [storyTheme, setStoryTheme]= useState(STORY_THEMES[0]);
  const [lesson,     setLesson]    = useState("kindness");
  const [concern,    setConcern]   = useState("");
  const [question,   setQuestion]  = useState("");
  const [diet,       setDiet]      = useState("vegetarian");
  const [challenge,  setChallenge] = useState("");
  const [character,  setCharacter] = useState(CHAR_OPTIONS[0]);
  const [kidsetting, setKidSet]    = useState("a magical garden in India");
  const [drawTheme,  setDrawTheme] = useState(DRAWING_THEMES[0]);
  const [songTheme,  setSongTheme] = useState(SONG_THEMES[0]);

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

  const switchAudience = (a: Audience) => {
    setAudience(a);
    setResult("");
    setToolId(a === "parent" ? PARENT_TOOLS[0].id : KIDS_TOOLS[0].id);
  };

  const buildParams = (): Record<string,string> => {
    switch (toolId) {
      case "story":    return { childName, age, theme:storyTheme, lesson };
      case "milestone":return { age, concern };
      case "childqa":  return { age, question };
      case "mealidea": return { age, diet, challenge };
      case "kidstory": return { age, character, setting:kidsetting };
      case "riddle":   return { age };
      case "drawing":  return { age, theme:drawTheme };
      case "song":     return { age, theme:songTheme };
      default: return {};
    }
  };

  const generate = useCallback(async () => {
    const raw = localStorage.getItem("ep_parent_session");
    if (!raw) { setLoginPrompt(true); return; }
    try {
      const s = JSON.parse(raw);
      const expired = Date.now() - (s.loginTime || 0) > 24 * 60 * 60 * 1000;
      if (expired) { localStorage.removeItem("ep_parent_session"); setLoginPrompt(true); return; }
    } catch {
      localStorage.removeItem("ep_parent_session"); setLoginPrompt(true); return;
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
  }, [toolId, modelId, age, childName, storyTheme, lesson, concern, question, diet, challenge, character, kidsetting, drawTheme, songTheme]);

  return (
    <div style={{ background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif", height:"calc(100vh - 92px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, background:audGradient, padding:"10px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
        <button onClick={() => {
            try {
              const s = JSON.parse(localStorage.getItem("ep_parent_session") || "");
              if (s && Date.now() - (s.loginTime || 0) < 24 * 60 * 60 * 1000) {
                router.push("/parent-dashboard"); return;
              }
            } catch {}
            router.push("/ai-tools/general");
          }}
          style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"20px", padding:"6px 12px", color:"white", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>
          <ArrowLeft style={{ width:"12px", height:"12px" }} /> Back
        </button>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"white", lineHeight:1 }}>
            {audience === "parent" ? "👨‍👩‍👧 Parents Corner" : "🧒 Kids Corner"}
          </div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>
            {audience === "parent" ? "4 parenting tools" : "4 fun activities"} · AI-powered
          </div>
        </div>
        <div style={{ flex:1 }} />

        {/* Audience toggle */}
        <div style={{ display:"flex", gap:"4px", background:"rgba(255,255,255,0.15)", borderRadius:"20px", padding:"3px" }}>
          {(["parent","kids"] as Audience[]).map(a => (
            <button key={a} onClick={() => switchAudience(a)}
              style={{ padding:"6px 14px", borderRadius:"16px", fontSize:"12px", fontWeight:700, border:"none", cursor:"pointer", background:audience===a ? "white" : "transparent", color:audience===a ? (a==="parent"?"#8957E5":"#E8694A") : "rgba(255,255,255,0.85)", transition:"all 0.15s" }}>
              {a === "parent" ? "👨‍👩‍👧 Parents" : "🧒 Kids"}
            </button>
          ))}
        </div>

      </div>

      {/* ── Ask School AI RAG banner ── */}
      {audience === "parent" && (
        <div style={{ flexShrink:0, background:"linear-gradient(90deg,rgba(137,87,229,0.12),rgba(99,102,241,0.05))", borderBottom:"1px solid rgba(137,87,229,0.2)", padding:"7px 16px", display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"15px" }}>💬</span>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:"11px", fontWeight:700, color:"#8957E5" }}>Ask School AI</span>
            <span style={{ fontSize:"10px", color:"#6B7A99", marginLeft:"8px" }}>Fees, policies & school info — from official documents</span>
          </div>
          <a href="/parent-dashboard" style={{ background:"#8957E5", color:"white", borderRadius:"20px", padding:"5px 14px", fontSize:"11px", fontWeight:700, textDecoration:"none", flexShrink:0 }}>Open in Portal →</a>
        </div>
      )}

      {/* ── Tool strip ── */}
      <div style={{ flexShrink:0, background:"white", borderBottom:"1px solid #EDE8DF", display:"flex", overflowX:"auto" }}>
        {allTools.map(t => (
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

          {/* Story Generator */}
          {toolId === "story" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChild(e.target.value)} placeholder="e.g. Kavya" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Story Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {STORY_THEMES.map(t => <Chip key={t} label={t} active={storyTheme===t} color={tool.color} onClick={()=>setStoryTheme(t)} />)}
                </div>
              </div>
              <div><label style={lbl}>Lesson to Teach</label>
                <input value={lesson} onChange={e=>setLesson(e.target.value)} placeholder="e.g. kindness, sharing, bravery, honesty…" style={inp} />
              </div>
            </div>
          )}

          {/* Milestone Advisor */}
          {toolId === "milestone" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Your Question or Concern</label>
                <textarea value={concern} onChange={e=>setConcern(e.target.value)} placeholder="e.g. My child is not yet speaking many words. Is this normal?…" style={{ ...ta, minHeight:"100px" }} />
              </div>
            </div>
          )}

          {/* Ask an Expert */}
          {toolId === "childqa" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Your Question *</label>
                <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask anything about child development, behaviour, learning, sleep, food…" style={{ ...ta, minHeight:"100px" }} />
              </div>
            </div>
          )}

          {/* Meal Ideas */}
          {toolId === "mealidea" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Dietary Preference</label>
                  <select value={diet} onChange={e=>setDiet(e.target.value)} style={sel}>
                    {["vegetarian","non-vegetarian","vegan","jain"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Challenge</label>
                  <input value={challenge} onChange={e=>setChallenge(e.target.value)} placeholder="e.g. picky eater…" style={inp} />
                </div>
              </div>
            </div>
          )}

          {/* Mini Story (Kids) */}
          {toolId === "kidstory" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={tool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Main Character</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {CHAR_OPTIONS.map(c => <Chip key={c} label={c} active={character===c} color={tool.color} onClick={()=>setCharacter(c)} />)}
                </div>
              </div>
              <div><label style={lbl}>Story Setting</label>
                <input value={kidsetting} onChange={e=>setKidSet(e.target.value)} placeholder="e.g. a magical garden in India, an underwater kingdom…" style={inp} />
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
              <div style={{ background:"rgba(23,143,120,0.06)", borderRadius:"12px", padding:"12px", fontSize:"12px", color:"#6B7A99" }}>
                💡 5 age-appropriate riddles will be generated — great for circle time or car rides!
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
              style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"13px", borderRadius:"12px", border:"none", fontWeight:700, fontSize:"14px", color:"white", cursor:loading?"not-allowed":"pointer", background:loading?"#C4B5FD":tool.color, boxShadow:loading?"none":`0 6px 20px ${tool.color}40`, transition:"all 0.2s", fontFamily:"'Quicksand',sans-serif" }}>
              {loading
                ? <><Loader2 style={{ width:"15px", height:"15px", animation:"spin 0.8s linear infinite" }} /> Generating…</>
                : <><Sparkles style={{ width:"15px", height:"15px" }} /> Generate</>}
            </button>
          </div>

          {/* Model tip */}
          {(() => {
            const tips: Record<string,string> = {
              "llama-3.3-70b-versatile":                   "Rich stories, detailed milestone advice & creative content — best quality",
              "meta-llama/llama-4-scout-17b-16e-instruct": "Meta's newest Llama 4 — fast, smart & great for parenting advice",
              "llama-3.1-8b-instant":                      "Fastest replies — great for quick questions & simple tasks",
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
        <div style={{ flex:1, overflowY:"auto", padding:"20px", background: audience==="parent" ? "#F7F3FF" : "#FFF8F4", display:"flex", flexDirection:"column" }} ref={resultRef}>
          {loginPrompt ? (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", textAlign:"center", padding:"20px" }}>
              <div style={{ fontSize:"48px" }}>🔐</div>
              <div>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"22px", fontWeight:700, color:"#1A2F4A", marginBottom:"6px" }}>Login to Generate</div>
                <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"300px", lineHeight:1.7 }}>
                  Already enrolled at Evergreen? Login below. New here? Book an enquiry to get started.
                </div>
              </div>

              {/* Existing parent */}
              <button onClick={() => router.push("/parent-login")}
                style={{ width:"100%", maxWidth:"360px", display:"flex", alignItems:"center", gap:"14px", padding:"15px 20px", borderRadius:"16px", border:"2px solid rgba(137,87,229,0.35)", background:"linear-gradient(135deg,rgba(137,87,229,0.08),rgba(99,102,241,0.04))", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"30px", flexShrink:0 }}>👨‍👩‍👧</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#8957E5" }}>I'm an Existing Parent</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>Stories · Milestones · Expert Q&A · Meals · Fun activities</div>
                </div>
                <span style={{ fontSize:"11px", background:"#8957E5", color:"white", borderRadius:"20px", padding:"3px 10px", fontWeight:700, whiteSpace:"nowrap" }}>Login →</span>
              </button>

              {/* Divider */}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", maxWidth:"360px" }}>
                <div style={{ flex:1, height:"1px", background:"#E5E7EB" }} />
                <span style={{ fontSize:"11px", color:"#9CA3AF", fontWeight:600 }}>New to Evergreen?</span>
                <div style={{ flex:1, height:"1px", background:"#E5E7EB" }} />
              </div>

              {/* Enquiry */}
              <button onClick={() => router.push("/enquiry")}
                style={{ width:"100%", maxWidth:"360px", display:"flex", alignItems:"center", gap:"14px", padding:"15px 20px", borderRadius:"16px", border:"2px solid rgba(23,143,120,0.35)", background:"linear-gradient(135deg,rgba(23,143,120,0.08),rgba(15,118,110,0.04))", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:"30px", flexShrink:0 }}>🌿</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78" }}>Enrol My Child</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>Fill our quick enquiry form · We'll get back within 24 hrs</div>
                </div>
                <span style={{ fontSize:"11px", background:"#178F78", color:"white", borderRadius:"20px", padding:"3px 10px", fontWeight:700, whiteSpace:"nowrap" }}>Enquire →</span>
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
                    {loading ? `Generating with ${selectedModel.icon} ${selectedModel.name}…` : `${selectedModel.icon} ${selectedModel.name} · ${audience==="parent"?"Parents":"Kids"} Corner`}
                  </span>
                  {loading && <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:tool.color, display:"inline-block", animation:"pulse 1s infinite" }} />}
                </div>
                {!loading && (
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                      style={{ display:"flex", alignItems:"center", gap:"5px", background:"white", border:"1px solid #EDE8DF", borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:700, color:copied?tool.color:"#6B7A99", cursor:"pointer" }}>
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
              <div style={{ fontSize:"52px" }}>{audience === "parent" ? "👨‍👩‍👧" : "🧒"}</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:tool.color }}>Your result appears here</div>
              <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"280px", lineHeight:1.6 }}>
                Pick a tool, fill in the details, and click <strong>Generate</strong>.
              </div>
              <div style={{ background:tool.bg, border:`1px solid ${tool.color}30`, borderRadius:"12px", padding:"10px 18px", fontSize:"12px", color:tool.color, fontWeight:700 }}>
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
