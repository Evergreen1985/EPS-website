"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Suspense } from "react";
import { Sparkles, Loader2, RefreshCw, Copy, Check, BookOpen, Brain, Calendar, FileText, MessageSquare, Eye, UtensilsCrossed, Pencil, Music, Puzzle, ChevronDown } from "lucide-react";
import { FREE_MODELS } from "@/lib/freeModels";

type Audience = "teacher" | "parent" | "kids";

interface ToolDef {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
}

const TEACHER_TOOLS: ToolDef[] = [
  { id:"activity",    label:"Activity Planner",    desc:"Design a fun classroom activity",       icon:Calendar,      color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"report",      label:"Progress Report",     desc:"Write a warm, professional report",     icon:FileText,      color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"lessonplan",  label:"Lesson Plan",         desc:"Structured lesson plan for any skill",  icon:BookOpen,      color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"observation", label:"Observation Notes",   desc:"Document a child's behaviour",          icon:Eye,           color:"#0F766E", bg:"rgba(15,118,110,0.1)"  },
  { id:"parentmsg",   label:"Parent Message",      desc:"Compose a message to a parent",         icon:MessageSquare, color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const PARENT_TOOLS: ToolDef[] = [
  { id:"story",     label:"Story Generator",   desc:"Personalised bedtime story",            icon:BookOpen,       color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"milestone", label:"Milestone Advisor", desc:"What to expect at this age",            icon:Brain,          color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"childqa",   label:"Ask an Expert",     desc:"Any parenting or development question", icon:MessageSquare,  color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"mealidea",  label:"Healthy Meal Ideas",desc:"Nutritious recipes for your child",     icon:UtensilsCrossed,color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const KIDS_TOOLS: ToolDef[] = [
  { id:"kidstory", label:"Mini Story",     desc:"A short exciting story",        icon:BookOpen, color:"#E8694A", bg:"rgba(232,105,74,0.1)"  },
  { id:"riddle",   label:"Fun Riddles",    desc:"Clever riddles to solve",       icon:Puzzle,   color:"#178F78", bg:"rgba(23,143,120,0.1)"  },
  { id:"drawing",  label:"Drawing Guide", desc:"Step-by-step drawing adventure", icon:Pencil,   color:"#8957E5", bg:"rgba(137,87,229,0.1)"  },
  { id:"song",     label:"Song & Rhyme",  desc:"A fun sing-along song",         icon:Music,    color:"#F5B829", bg:"rgba(245,184,41,0.12)" },
];

const AGE_GROUPS  = ["2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];
const SKILLS      = ["Language & Communication","Fine Motor Skills","Gross Motor Skills","Social Skills","Creativity & Arts","Numeracy","Literacy","Emotional Intelligence"];
const DURATIONS   = ["15 minutes","30 minutes","45 minutes","1 hour"];
const STORY_THEMES= ["Forest Adventure","Friendship at School","Magical Garden","Ocean Discovery","Space Explorer","The Kind Dragon","Farm Animals","Rainy Day Fun"];
const DRAWING_THEMES = ["Animals","Birds","Fruit & Vegetables","Sea Creatures","Vehicles","Flowers","Insects","Fantasy creatures"];
const SONG_THEMES    = ["Animals & Nature","Rain & Weather","Numbers & Counting","Colours","Morning Routines","Friendship","Food & Eating","Seasons"];
const CHAR_OPTIONS   = ["A brave little mouse","A curious elephant","A friendly dragon","A tiny frog","A baby lion","A little owl","A kind robot"];

const inp: React.CSSProperties = { width:"100%", border:"1px solid #EDE8DF", borderRadius:"12px", padding:"9px 13px", fontSize:"13px", color:"#1A2F4A", background:"white", outline:"none", boxSizing:"border-box", fontFamily:"'Quicksand',sans-serif" };
const sel: React.CSSProperties = { ...inp, cursor:"pointer" };
const ta:  React.CSSProperties = { ...inp, resize:"vertical", minHeight:"72px" };
const lbl: React.CSSProperties = { fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.06em", display:"block", marginBottom:"5px" };

function Chip({ label, active, color, onClick }: { label:string; active:boolean; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:"20px", fontSize:"11px", fontWeight:700, border:`1px solid ${active ? color : "#EDE8DF"}`, background:active ? color : "white", color:active ? "white" : "#6B7A99", cursor:"pointer", flexShrink:0 }}>
      {label}
    </button>
  );
}

export default function AIToolsPage() {
  return (
    <Suspense fallback={<div style={{ height:"calc(100vh - 92px)", background:"#FEFCF8" }} />}>
      <AIToolsInner />
    </Suspense>
  );
}

function AIToolsInner() {
  const [audience, setAudience]   = useState<Audience>("teacher");
  const [toolId, setToolId]       = useState("activity");
  const [modelId, setModelId]     = useState<string>(FREE_MODELS[0].id);
  const [result, setResult]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [copied, setCopied]       = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const resultRef                 = useRef<HTMLDivElement>(null);
  const abortRef                  = useRef<AbortController | null>(null);
  const selectedModel             = FREE_MODELS.find(m => m.id === modelId) ?? FREE_MODELS[0];

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // When audience changes, switch to first tool of that audience
  const switchAudience = (a: Audience) => {
    setAudience(a);
    setResult("");
    const first = a === "teacher" ? TEACHER_TOOLS[0] : a === "parent" ? PARENT_TOOLS[0] : KIDS_TOOLS[0];
    setToolId(first.id);
  };

  const allTools = audience === "teacher" ? TEACHER_TOOLS : audience === "parent" ? PARENT_TOOLS : KIDS_TOOLS;
  const currentTool = allTools.find(t => t.id === toolId) ?? allTools[0];

  // ── Per-tool form state ─────────────────────────────────────────
  const [age,        setAge]        = useState(AGE_GROUPS[1]);
  const [skill,      setSkill]      = useState(SKILLS[0]);
  const [duration,   setDuration]   = useState(DURATIONS[1]);
  const [materials,  setMaterials]  = useState("");
  const [childName,  setChildName]  = useState("");
  const [strengths,  setStrengths]  = useState("");
  const [improvements, setImprove] = useState("");
  const [topic,      setTopic]      = useState("");
  const [observation,setObsText]    = useState("");
  const [setting,    setSetting]    = useState("classroom");
  const [parentTopic,setParentTopic]= useState("");
  const [storyTheme, setStoryTheme] = useState(STORY_THEMES[0]);
  const [lesson,     setLesson]     = useState("kindness");
  const [concern,    setConcern]    = useState("");
  const [question,   setQuestion]   = useState("");
  const [diet,       setDiet]       = useState("vegetarian");
  const [challenge,  setChallenge]  = useState("");
  const [character,  setCharacter]  = useState(CHAR_OPTIONS[0]);
  const [kidsetting, setKidSetting] = useState("a magical garden in India");
  const [drawTheme,  setDrawTheme]  = useState(DRAWING_THEMES[0]);
  const [songTheme,  setSongTheme]  = useState(SONG_THEMES[0]);
  const [lessonStyle, setLessonStyle] = useState("visual and kinaesthetic");

  // Auto-scroll result
  useEffect(() => {
    if (resultRef.current && result) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [result]);

  const buildParams = (): Record<string, string> => {
    switch (toolId) {
      case "activity":   return { age, skill, duration, materials };
      case "report":     return { childName, age, strengths, improvements };
      case "lessonplan": return { age, topic, duration, style: lessonStyle };
      case "observation":return { childName, age, observation, setting };
      case "parentmsg":  return { childName, topic: parentTopic };
      case "story":      return { childName, age, theme: storyTheme, lesson };
      case "milestone":  return { age, concern };
      case "childqa":    return { age, question };
      case "mealidea":   return { age, diet, challenge };
      case "kidstory":   return { age, character, setting: kidsetting };
      case "riddle":     return { age };
      case "drawing":    return { age, theme: drawTheme };
      case "song":       return { age, theme: songTheme };
      default:           return {};
    }
  };

  const generate = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/ai-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: toolId, model: modelId, ...buildParams() }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setResult("❌ Failed to generate. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setResult(text);
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setResult("❌ Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  }, [toolId, age, skill, duration, materials, childName, strengths, improvements, topic, observation, setting, parentTopic, storyTheme, lesson, concern, question, diet, challenge, character, kidsetting, drawTheme, songTheme, lessonStyle]);

  const copyResult = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Close model dropdown on outside click
  useEffect(() => {
    if (!modelOpen) return;
    const handler = () => setModelOpen(false);
    window.addEventListener("click", handler, { capture: true, once: true });
    return () => window.removeEventListener("click", handler, true);
  }, [modelOpen]);

  const AUD_CONFIG: Record<Audience, { label:string; emoji:string; color:string; gradient:string }> = {
    teacher: { label:"Teachers",  emoji:"👩‍🏫", color:"#178F78", gradient:"linear-gradient(135deg,#178F78,#0F766E)" },
    parent:  { label:"Parents",   emoji:"👨‍👩‍👧", color:"#8957E5", gradient:"linear-gradient(135deg,#8957E5,#6366F1)" },
    kids:    { label:"Kids Corner",emoji:"🧒",   color:"#E8694A", gradient:"linear-gradient(135deg,#E8694A,#F5B829)" },
  };

  const aud = AUD_CONFIG[audience];

  return (
    <div style={{ background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif", height:"calc(100vh - 92px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink:0, background:aud.gradient, padding:"12px 24px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"white", lineHeight:1.1 }}>🤖 AI Learning Tools</div>
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.75)", marginTop:"1px" }}>6 Free Models · Groq + Google Gemini · No credit card</div>
        </div>
        <div style={{ flex:1 }} />

        {/* ── Model picker dropdown ── */}
        <div style={{ position:"relative" }}>
          <button onClick={() => setModelOpen(o => !o)}
            style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"12px", padding:"7px 14px", color:"white", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Quicksand',sans-serif" }}>
            <span>{selectedModel.icon}</span>
            <span>{selectedModel.name}</span>
            <span style={{ fontSize:"9px", background:"rgba(255,255,255,0.2)", borderRadius:"6px", padding:"1px 6px" }}>{selectedModel.badge}</span>
            <ChevronDown style={{ width:"12px", height:"12px", opacity:0.7 }} />
          </button>

          {modelOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", boxShadow:"0 8px 32px rgba(0,0,0,0.15)", zIndex:100, minWidth:"280px", overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", borderBottom:"1px solid #EDE8DF", fontSize:"10px", fontWeight:700, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                🆓 Free Models — No payment needed
              </div>
              {/* Groq models */}
              <div style={{ padding:"6px 0" }}>
                <div style={{ padding:"4px 14px", fontSize:"10px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase" }}>Groq (console.groq.com)</div>
                {FREE_MODELS.filter(m => m.provider === "groq").map(m => (
                  <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); setResult(""); }}
                    style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"9px 14px", border:"none", background:modelId===m.id ? "rgba(23,143,120,0.08)" : "white", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:"18px" }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{m.name}</div>
                    </div>
                    <span style={{ fontSize:"9px", fontWeight:700, background:modelId===m.id ? "rgba(23,143,120,0.15)" : "#F0F4F8", color:modelId===m.id ? "#178F78" : "#6B7A99", borderRadius:"6px", padding:"2px 7px" }}>{m.badge}</span>
                    {modelId===m.id && <span style={{ color:"#178F78", fontSize:"14px" }}>✓</span>}
                  </button>
                ))}
              </div>
              {/* Gemini models */}
              <div style={{ padding:"6px 0", borderTop:"1px solid #EDE8DF" }}>
                <div style={{ padding:"4px 14px", fontSize:"10px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase" }}>Google Gemini (aistudio.google.com)</div>
                {FREE_MODELS.filter(m => m.provider === "gemini").map(m => (
                  <button key={m.id} onClick={() => { setModelId(m.id); setModelOpen(false); setResult(""); }}
                    style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"9px 14px", border:"none", background:modelId===m.id ? "rgba(23,143,120,0.08)" : "white", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:"18px" }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{m.name}</div>
                    </div>
                    <span style={{ fontSize:"9px", fontWeight:700, background:modelId===m.id ? "rgba(23,143,120,0.15)" : "#F0F4F8", color:modelId===m.id ? "#178F78" : "#6B7A99", borderRadius:"6px", padding:"2px 7px" }}>{m.badge}</span>
                    {modelId===m.id && <span style={{ color:"#178F78", fontSize:"14px" }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ padding:"8px 14px", borderTop:"1px solid #EDE8DF", fontSize:"10px", color:"#9CA3AF" }}>
                All models are 100% free · Add keys to .env.local to activate
              </div>
            </div>
          )}
        </div>

        {/* Audience switcher */}
        <div style={{ display:"flex", gap:"6px", background:"rgba(255,255,255,0.15)", borderRadius:"20px", padding:"4px" }}>
          {(["teacher","parent","kids"] as Audience[]).map(a => (
            <button key={a} onClick={() => switchAudience(a)}
              style={{ padding:"6px 14px", borderRadius:"16px", fontSize:"12px", fontWeight:700, border:"none", cursor:"pointer", transition:"all 0.15s", background:audience===a ? "white" : "transparent", color:audience===a ? aud.color : "rgba(255,255,255,0.85)" }}>
              {AUD_CONFIG[a].emoji} {AUD_CONFIG[a].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tool selector strip ── */}
      <div style={{ flexShrink:0, background:"white", borderBottom:"1px solid #EDE8DF", padding:"0 20px", display:"flex", gap:"0", overflowX:"auto" }}>
        {allTools.map(t => {
          const Icon = t.icon;
          const active = toolId === t.id;
          return (
            <button key={t.id} onClick={() => { setToolId(t.id); setResult(""); }}
              style={{ display:"flex", alignItems:"center", gap:"7px", padding:"11px 16px", border:"none", borderBottom:`3px solid ${active ? t.color : "transparent"}`, background:"transparent", fontWeight:700, fontSize:"12px", color:active ? t.color : "#6B7A99", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, transition:"all 0.15s" }}>
              <Icon style={{ width:"14px", height:"14px" }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Main area ── */}
      <div style={{ flex:1, overflow:"hidden", display:"flex" }}>

        {/* ── LEFT: Inputs ── */}
        <div style={{ width:"45%", borderRight:"1px solid #EDE8DF", overflowY:"auto", padding:"20px", background:"white" }}>
          {/* Tool header */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"18px", paddingBottom:"14px", borderBottom:"1px solid #EDE8DF" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:currentTool.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <currentTool.icon style={{ width:"20px", height:"20px", color:"white" }} />
            </div>
            <div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:currentTool.color }}>{currentTool.label}</div>
              <div style={{ fontSize:"11px", color:"#9CA3AF" }}>{currentTool.desc}</div>
            </div>
          </div>

          {/* ── TEACHER FORMS ─────────────────────────────────── */}
          {toolId === "activity" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Skill to Develop</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {SKILLS.map(s => <Chip key={s} label={s} active={skill===s} color={currentTool.color} onClick={()=>setSkill(s)} />)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Duration</label>
                  <select value={duration} onChange={e=>setDuration(e.target.value)} style={sel}>
                    {DURATIONS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Available Materials</label>
                  <input value={materials} onChange={e=>setMaterials(e.target.value)} placeholder="paper, crayons, blocks…" style={inp} />
                </div>
              </div>
            </div>
          )}

          {toolId === "report" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChildName(e.target.value)} placeholder="e.g. Arjun" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Strengths Observed *</label><textarea value={strengths} onChange={e=>setStrengths(e.target.value)} placeholder="e.g. loves art, very social, great with numbers, excellent listener…" style={ta} /></div>
              <div><label style={lbl}>Areas for Growth</label><textarea value={improvements} onChange={e=>setImprove(e.target.value)} placeholder="e.g. working on sharing toys, building confidence in group activities…" style={ta} /></div>
            </div>
          )}

          {toolId === "lessonplan" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Topic / Skill *</label><input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Colours, Numbers 1-10, Sharing, Animals…" style={inp} /></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Duration</label><select value={duration} onChange={e=>setDuration(e.target.value)} style={sel}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></div>
                <div><label style={lbl}>Learning Style</label>
                  <select value={lessonStyle} onChange={e=>setLessonStyle(e.target.value)} style={sel}>
                    {["visual and kinaesthetic","auditory","visual","kinaesthetic","multi-sensory"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {toolId === "observation" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChildName(e.target.value)} placeholder="e.g. Priya" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Setting</label>
                <select value={setting} onChange={e=>setSetting(e.target.value)} style={sel}>
                  {["classroom","outdoor play","lunch/snack time","art activity","group circle time","free play","reading corner"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Behaviour / Situation Observed *</label><textarea value={observation} onChange={e=>setObsText(e.target.value)} placeholder="Describe what you observed in as much detail as possible…" style={{ ...ta, minHeight:"100px" }} /></div>
            </div>
          )}

          {toolId === "parentmsg" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Name (optional)</label><input value={childName} onChange={e=>setChildName(e.target.value)} placeholder="e.g. Rahul" style={inp} /></div>
              <div><label style={lbl}>What to Communicate *</label><textarea value={parentTopic} onChange={e=>setParentTopic(e.target.value)} placeholder="e.g. Child had a small fall today and is fine. Want to inform parent and share what happened…" style={{ ...ta, minHeight:"100px" }} /></div>
            </div>
          )}

          {/* ── PARENT FORMS ──────────────────────────────────── */}
          {toolId === "story" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Child's Name</label><input value={childName} onChange={e=>setChildName(e.target.value)} placeholder="e.g. Kavya" style={inp} /></div>
                <div><label style={lbl}>Age Group</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}>{AGE_GROUPS.map(a=><option key={a}>{a}</option>)}</select></div>
              </div>
              <div><label style={lbl}>Story Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {STORY_THEMES.map(t => <Chip key={t} label={t} active={storyTheme===t} color={currentTool.color} onClick={()=>setStoryTheme(t)} />)}
                </div>
              </div>
              <div><label style={lbl}>Lesson to Teach</label>
                <input value={lesson} onChange={e=>setLesson(e.target.value)} placeholder="e.g. kindness, sharing, bravery, honesty…" style={inp} />
              </div>
            </div>
          )}

          {toolId === "milestone" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Your Specific Question or Concern</label>
                <textarea value={concern} onChange={e=>setConcern(e.target.value)} placeholder="e.g. My child is not yet speaking many words. Is this normal? What can I do at home?…" style={{ ...ta, minHeight:"100px" }} />
              </div>
            </div>
          )}

          {toolId === "childqa" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Your Question *</label>
                <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask anything about child development, behaviour, learning, sleep, food, school readiness…" style={{ ...ta, minHeight:"100px" }} />
              </div>
            </div>
          )}

          {toolId === "mealidea" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                <div><label style={lbl}>Dietary Preference</label>
                  <select value={diet} onChange={e=>setDiet(e.target.value)} style={sel}>
                    {["vegetarian","non-vegetarian","vegan","jain"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Challenge / Preference</label>
                  <input value={challenge} onChange={e=>setChallenge(e.target.value)} placeholder="e.g. picky eater, loves spicy food…" style={inp} />
                </div>
              </div>
            </div>
          )}

          {/* ── KIDS FORMS ─────────────────────────────────────── */}
          {toolId === "kidstory" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Main Character</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {CHAR_OPTIONS.map(c => <Chip key={c} label={c} active={character===c} color={currentTool.color} onClick={()=>setCharacter(c)} />)}
                </div>
              </div>
              <div><label style={lbl}>Story Setting</label>
                <input value={kidsetting} onChange={e=>setKidSetting(e.target.value)} placeholder="e.g. a magical garden in India, an underwater kingdom…" style={inp} />
              </div>
            </div>
          )}

          {toolId === "riddle" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div style={{ background:"rgba(23,143,120,0.06)", borderRadius:"12px", padding:"12px", fontSize:"12px", color:"#6B7A99" }}>
                💡 5 age-appropriate riddles will be generated — great for circle time or car rides!
              </div>
            </div>
          )}

          {toolId === "drawing" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Drawing Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {DRAWING_THEMES.map(t => <Chip key={t} label={t} active={drawTheme===t} color={currentTool.color} onClick={()=>setDrawTheme(t)} />)}
                </div>
              </div>
            </div>
          )}

          {toolId === "song" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div><label style={lbl}>Child's Age Group</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {AGE_GROUPS.map(a => <Chip key={a} label={a} active={age===a} color={currentTool.color} onClick={()=>setAge(a)} />)}
                </div>
              </div>
              <div><label style={lbl}>Song Theme</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {SONG_THEMES.map(t => <Chip key={t} label={t} active={songTheme===t} color={currentTool.color} onClick={()=>setSongTheme(t)} />)}
                </div>
              </div>
            </div>
          )}

          {/* Generate button */}
          <button onClick={generate} disabled={loading}
            style={{ marginTop:"20px", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"13px", borderRadius:"14px", border:"none", fontWeight:700, fontSize:"14px", color:"white", cursor:loading ? "not-allowed" : "pointer", background:loading ? "#b2dfdb" : currentTool.color, boxShadow:loading ? "none" : `0 6px 20px ${currentTool.color}40`, transition:"all 0.2s", fontFamily:"'Quicksand',sans-serif" }}>
            {loading
              ? <><Loader2 style={{ width:"16px", height:"16px", animation:"spin 0.8s linear infinite" }} /> Generating with AI…</>
              : <><Sparkles style={{ width:"16px", height:"16px" }} /> Generate · {selectedModel.icon} {selectedModel.name}</>
            }
          </button>

          {/* Feature pills */}
          <div style={{ display:"flex", gap:"6px", marginTop:"12px", flexWrap:"wrap" }}>
            {[["🔒","Private"],["⚡","Real AI"],["🎯","Tailored"],["♾️","Unlimited"]].map(([icon,txt]) => (
              <span key={txt} style={{ fontSize:"10px", fontWeight:700, color:"#9CA3AF", background:"#F5F5F5", borderRadius:"20px", padding:"3px 10px" }}>{icon} {txt}</span>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Result ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px", background:"#FAF0E8", display:"flex", flexDirection:"column" }} ref={resultRef}>
          {result ? (
            <div style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
              {/* Result toolbar */}
              <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", background:currentTool.bg, borderBottom:"1px solid #EDE8DF", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <Sparkles style={{ width:"14px", height:"14px", color:currentTool.color }} />
                  <span style={{ fontSize:"12px", fontWeight:700, color:currentTool.color }}>
                    {loading ? `Generating with ${selectedModel.icon} ${selectedModel.name}…` : `${selectedModel.icon} ${selectedModel.name} · Free AI`}
                  </span>
                  {loading && <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:currentTool.color, animation:"pulse 1s infinite" }} />}
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  {!loading && (
                    <>
                      <button onClick={copyResult}
                        style={{ display:"flex", alignItems:"center", gap:"5px", background:"white", border:"1px solid #EDE8DF", borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:700, color:copied ? "#178F78" : "#6B7A99", cursor:"pointer" }}>
                        {copied ? <><Check style={{ width:"11px", height:"11px" }} /> Copied!</> : <><Copy style={{ width:"11px", height:"11px" }} /> Copy</>}
                      </button>
                      <button onClick={generate}
                        style={{ display:"flex", alignItems:"center", gap:"5px", background:"white", border:"1px solid #EDE8DF", borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:700, color:currentTool.color, cursor:"pointer" }}>
                        <RefreshCw style={{ width:"11px", height:"11px" }} /> Regenerate
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Result text */}
              <div style={{ padding:"20px", flex:1, overflowY:"auto" }}>
                <p style={{ fontSize:"13px", lineHeight:1.8, color:"#374151", whiteSpace:"pre-wrap", margin:0 }}>{result}</p>
                {loading && <span style={{ display:"inline-block", width:"2px", height:"14px", background:currentTool.color, marginLeft:"2px", animation:"pulse 0.8s infinite", borderRadius:"2px" }} />}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px", textAlign:"center" }}>
              <div style={{ fontSize:"48px" }}>✨</div>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:currentTool.color }}>Your result appears here</div>
              <div style={{ fontSize:"13px", color:"#9CA3AF", maxWidth:"300px", lineHeight:1.6 }}>
                Select a <strong>free model</strong> above, fill in the details, and click <strong>Generate</strong>.
              </div>
              <div style={{ background:"rgba(23,143,120,0.07)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"12px", padding:"10px 16px", fontSize:"12px", color:"#178F78", fontWeight:700 }}>
                {selectedModel.icon} Using: {selectedModel.name} <span style={{ fontWeight:400, color:"#6B7A99" }}>· {selectedModel.badge} · 100% Free</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginTop:"8px", width:"100%", maxWidth:"320px" }}>
                {[
                  ["🆓","Truly Free","No credit card"],
                  ["⚡","Live Streaming","Word by word"],
                  ["🎯","6 Models","Groq + Gemini"],
                  ["♾️","Unlimited","No daily limits"],
                ].map(([icon, t, d]) => (
                  <div key={t} style={{ background:"white", borderRadius:"12px", padding:"12px", border:"1px solid #EDE8DF" }}>
                    <div style={{ fontSize:"20px", marginBottom:"4px" }}>{icon}</div>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"#1A2F4A" }}>{t}</div>
                    <div style={{ fontSize:"10px", color:"#9CA3AF" }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}
