"use client";

import { useState } from "react";
import { BookOpen, Brain, Calendar, FileText, Sparkles, Loader2, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
type Tool = "story" | "milestone" | "activity" | "report";

interface StoryForm   { theme: string; childName: string; age: string; lesson: string; }
interface MilestoneForm { age: string; concern: string; }
interface ActivityForm  { age: string; skill: string; duration: string; materials: string; }
interface ReportForm    { childName: string; age: string; strengths: string; improvements: string; }

// ── Claude API call ────────────────────────────────────────────────
async function askClaude(prompt: string): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.text ?? "Something went wrong. Please try again.";
}

// ── Tool Config ────────────────────────────────────────────────────
const tools = [
  { id: "story" as Tool,     icon: BookOpen,  label: "Story Generator",   color: "#E8694A", bg: "rgba(232,105,74,0.1)"  },
  { id: "milestone" as Tool, icon: Brain,     label: "Milestone Advisor", color: "#178F78", bg: "rgba(23,143,120,0.1)"  },
  { id: "activity" as Tool,  icon: Calendar,  label: "Activity Planner",  color: "#F5B829", bg: "rgba(245,184,41,0.12)" },
  { id: "report" as Tool,    icon: FileText,  label: "Progress Report",   color: "#8957E5", bg: "rgba(137,87,229,0.1)"  },
];

const storyThemes  = ["Adventure in the Forest","A Day at the Beach","Magical Garden","Friendship at School","Space Explorer","The Kind Dragon","Rainy Day Fun","Farm Animals"];
const skills       = ["Language & Communication","Fine Motor Skills","Gross Motor Skills","Social Skills","Creativity & Arts","Numeracy","Literacy","Emotional Intelligence"];
const durations    = ["15 minutes","30 minutes","45 minutes","1 hour"];
const ageGroups    = ["9 months – 2 years","2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];

// ── Main Component ────────────────────────────────────────────────
export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>("story");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState("");

  // Form states
  const [storyForm,    setStoryForm]    = useState<StoryForm>({ theme: storyThemes[0], childName: "", age: ageGroups[2], lesson: "kindness" });
  const [milestoneForm,setMilestoneForm]= useState<MilestoneForm>({ age: ageGroups[2], concern: "" });
  const [activityForm, setActivityForm] = useState<ActivityForm>({ age: ageGroups[2], skill: skills[0], duration: durations[1], materials: "" });
  const [reportForm,   setReportForm]   = useState<ReportForm>({ childName: "", age: ageGroups[2], strengths: "", improvements: "" });

  const currentTool = tools.find(t => t.id === activeTool)!;

  async function handleGenerate() {
    setLoading(true);
    setResult("");
    try {
      let prompt = "";
      if (activeTool === "story") {
        prompt = `Write a short, engaging children's story (about 200 words) for a ${storyForm.age} old child${storyForm.childName ? ` named ${storyForm.childName}` : ""}. 
Theme: "${storyForm.theme}". The story should teach the lesson of ${storyForm.lesson || "kindness and sharing"}.
Make it warm, playful, age-appropriate, and end with a positive message. Use simple language a preschooler would enjoy.`;
      } else if (activeTool === "milestone") {
        prompt = `As an early childhood development expert, provide friendly and reassuring advice for parents about developmental milestones for a child aged ${milestoneForm.age}.
${milestoneForm.concern ? `Parent's specific concern: "${milestoneForm.concern}"` : "Give a general overview of key milestones."}
Include: key milestones to expect, fun activities to support development, and when to consult a professional. Keep it warm, supportive and practical. Use bullet points.`;
      } else if (activeTool === "activity") {
        prompt = `Create a detailed, fun activity plan for a ${activityForm.age} old child to develop ${activityForm.skill}.
Duration: ${activityForm.duration}.
${activityForm.materials ? `Available materials: ${activityForm.materials}` : "Use common household items."}
Include: activity name, objective, step-by-step instructions, tips for parents/teachers, and variations to make it easier or harder. Make it playful and engaging!`;
      } else if (activeTool === "report") {
        prompt = `Write a warm, professional, and encouraging progress report for a preschool child${reportForm.childName ? ` named ${reportForm.childName}` : ""} (age ${reportForm.age}).
Strengths observed: ${reportForm.strengths || "enthusiastic, curious, friendly"}
Areas for growth: ${reportForm.improvements || "focus during circle time, following multi-step instructions"}
Write in a positive, supportive tone that celebrates the child's progress while gently noting areas for development. Keep it under 200 words, suitable for sharing with parents.`;
      }
      const text = await askClaude(prompt);
      setResult(text);
    } catch {
      setResult("Oops! Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen" style={{ background: "#FEFCF8", fontFamily: "'Quicksand', sans-serif" }}>

      {/* Header */}
      <div className="py-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #178F78 0%, #0f6b5a 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-semibold">Powered by AI</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            AI Learning Tools
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">
            Smart tools for parents and teachers — powered by AI to make early childhood education more joyful and personalised.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Tool tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => { setActiveTool(tool.id); setResult(""); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: isActive ? tool.color : "#EDE8DF",
                  background: isActive ? tool.bg : "white",
                  transform: isActive ? "translateY(-2px)" : "none",
                  boxShadow: isActive ? `0 8px 24px ${tool.color}25` : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <Icon className="w-6 h-6" style={{ color: tool.color }} />
                <span className="text-xs font-bold text-center leading-tight" style={{ color: isActive ? tool.color : "#6B7A99" }}>
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tool panel */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Panel header */}
          <div className="px-8 py-6 border-b border-gray-100" style={{ background: currentTool.bg }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: currentTool.color }}>
                <currentTool.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: currentTool.color }}>
                  AI {currentTool.label}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeTool === "story"     && "Create a magical, personalised story for your little one in seconds."}
                  {activeTool === "milestone" && "Get expert guidance on your child's developmental milestones."}
                  {activeTool === "activity"  && "Generate fun, educational activities tailored to your child's age and needs."}
                  {activeTool === "report"    && "Create a warm, professional progress report in seconds."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* ── STORY GENERATOR ── */}
            {activeTool === "story" && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Story Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {storyThemes.map(t => (
                      <button key={t} onClick={() => setStoryForm(f => ({ ...f, theme: t }))}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{
                          background: storyForm.theme === t ? "#E8694A" : "white",
                          color: storyForm.theme === t ? "white" : "#6B7A99",
                          borderColor: storyForm.theme === t ? "#E8694A" : "#EDE8DF",
                        }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Child&apos;s Name (optional)</label>
                    <input className={inputClass} placeholder="e.g. Arjun" value={storyForm.childName}
                      onChange={e => setStoryForm(f => ({ ...f, childName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Age Group</label>
                    <select className={inputClass} value={storyForm.age}
                      onChange={e => setStoryForm(f => ({ ...f, age: e.target.value }))}>
                      {ageGroups.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Lesson to Teach</label>
                  <input className={inputClass} placeholder="e.g. kindness, sharing, bravery, honesty"
                    value={storyForm.lesson} onChange={e => setStoryForm(f => ({ ...f, lesson: e.target.value }))} />
                </div>
              </div>
            )}

            {/* ── MILESTONE ADVISOR ── */}
            {activeTool === "milestone" && (
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Child&apos;s Age Group</label>
                  <div className="flex flex-wrap gap-2">
                    {ageGroups.map(a => (
                      <button key={a} onClick={() => setMilestoneForm(f => ({ ...f, age: a }))}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{
                          background: milestoneForm.age === a ? "#178F78" : "white",
                          color: milestoneForm.age === a ? "white" : "#6B7A99",
                          borderColor: milestoneForm.age === a ? "#178F78" : "#EDE8DF",
                        }}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Specific Concern or Question (optional)</label>
                  <textarea className={inputClass} rows={3}
                    placeholder="e.g. My child is not yet speaking many words, is that normal? Or ask about any specific developmental area..."
                    value={milestoneForm.concern}
                    onChange={e => setMilestoneForm(f => ({ ...f, concern: e.target.value }))} />
                </div>
              </div>
            )}

            {/* ── ACTIVITY PLANNER ── */}
            {activeTool === "activity" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age Group</label>
                    <select className={inputClass} value={activityForm.age}
                      onChange={e => setActivityForm(f => ({ ...f, age: e.target.value }))}>
                      {ageGroups.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Duration</label>
                    <select className={inputClass} value={activityForm.duration}
                      onChange={e => setActivityForm(f => ({ ...f, duration: e.target.value }))}>
                      {durations.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Skill to Develop</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <button key={s} onClick={() => setActivityForm(f => ({ ...f, skill: s }))}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={{
                          background: activityForm.skill === s ? "#F5B829" : "white",
                          color: activityForm.skill === s ? "#1A1A1A" : "#6B7A99",
                          borderColor: activityForm.skill === s ? "#F5B829" : "#EDE8DF",
                        }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Available Materials (optional)</label>
                  <input className={inputClass} placeholder="e.g. paper, crayons, blocks, playdough, cups..."
                    value={activityForm.materials}
                    onChange={e => setActivityForm(f => ({ ...f, materials: e.target.value }))} />
                </div>
              </div>
            )}

            {/* ── PROGRESS REPORT ── */}
            {activeTool === "report" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Child&apos;s Name</label>
                    <input className={inputClass} placeholder="e.g. Priya" value={reportForm.childName}
                      onChange={e => setReportForm(f => ({ ...f, childName: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelClass}>Age Group</label>
                    <select className={inputClass} value={reportForm.age}
                      onChange={e => setReportForm(f => ({ ...f, age: e.target.value }))}>
                      {ageGroups.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Strengths Observed</label>
                  <textarea className={inputClass} rows={2}
                    placeholder="e.g. excellent at art, loves storytelling, great with numbers, kind to friends..."
                    value={reportForm.strengths}
                    onChange={e => setReportForm(f => ({ ...f, strengths: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Areas for Growth</label>
                  <textarea className={inputClass} rows={2}
                    placeholder="e.g. needs support with listening, working on sharing, developing pencil grip..."
                    value={reportForm.improvements}
                    onChange={e => setReportForm(f => ({ ...f, improvements: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-bold text-sm transition-all"
              style={{
                background: loading ? "#ccc" : currentTool.color,
                boxShadow: loading ? "none" : `0 8px 24px ${currentTool.color}40`,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating with AI...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate with AI</>
              )}
            </button>

            {/* Result */}
            {result && (
              <div className="mt-6 rounded-2xl border-2 overflow-hidden" style={{ borderColor: currentTool.color + "40" }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: currentTool.bg }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: currentTool.color }} />
                    <span className="text-sm font-bold" style={{ color: currentTool.color }}>AI Generated Result</span>
                  </div>
                  <button onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: currentTool.color }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
                <div className="p-5 bg-white">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom info cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { icon: "🔒", title: "Safe & Private", desc: "No child data is stored. All AI responses are generated fresh each time." },
            { icon: "🎯", title: "Age-Appropriate", desc: "Every tool is calibrated for early childhood development stages." },
            { icon: "⚡", title: "Instant Results", desc: "Get personalised AI-generated content in seconds, not hours." },
          ].map(c => (
            <div key={c.title} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="font-bold text-gray-800 mb-2" style={{ fontFamily: "'Fredoka', sans-serif" }}>{c.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
