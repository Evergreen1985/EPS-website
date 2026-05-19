"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const TEACHER_TOOLS = [
  { icon: "📅", label: "Activity Planner",  desc: "Design fun classroom activities" },
  { icon: "📄", label: "Progress Report",   desc: "Write warm term reports" },
  { icon: "📚", label: "Lesson Plan",       desc: "Structured plans for any skill" },
  { icon: "👁️", label: "Observation Notes", desc: "Professional dev records" },
  { icon: "💬", label: "Parent Message",    desc: "Compose WhatsApp / email" },
];
const PARENT_TOOLS = [
  { icon: "📖", label: "Story Generator",   desc: "Personalised bedtime stories" },
  { icon: "🧠", label: "Milestone Advisor", desc: "What to expect at this age" },
  { icon: "💡", label: "Ask an Expert",     desc: "Parenting & development Q&A" },
  { icon: "🥗", label: "Healthy Meal Ideas",desc: "Indian recipes for picky eaters" },
];
const KIDS_TOOLS = [
  { icon: "✨", label: "Mini Story",     desc: "Short exciting story to listen to" },
  { icon: "🤔", label: "Fun Riddles",    desc: "5 age-appropriate riddles" },
  { icon: "🎨", label: "Drawing Guide", desc: "Step-by-step drawing adventure" },
  { icon: "🎵", label: "Song & Rhyme",  desc: "Original sing-along song" },
];
const MODELS = [
  { icon:"🦙", name:"Llama 3.3 70B", badge:"Best Quality" },
  { icon:"✨", name:"Gemini 2.0 Flash", badge:"Newest" },
  { icon:"⚡", name:"Llama 3.1 8B", badge:"Fastest" },
  { icon:"🔀", name:"Mixtral 8x7B", badge:"Long Context" },
  { icon:"💎", name:"Gemma 2 9B", badge:"Google Open" },
  { icon:"🚀", name:"Gemini 1.5 Flash", badge:"Google AI" },
];

export default function AIToolsPublicPage() {
  const router = useRouter();

  useEffect(() => {
    let teacherTime = 0, parentTime = 0;
    try { const s = JSON.parse(localStorage.getItem("ep_teacher_session") || "null"); if (s) teacherTime = s.loginTime || 1; } catch {}
    try { const s = JSON.parse(localStorage.getItem("ep_parent_session")  || "null"); if (s) parentTime  = s.loginTime || 1; } catch {}
    if (teacherTime > 0 && teacherTime >= parentTime) router.replace("/ai-tools/teacher");
    else if (parentTime > 0) router.replace("/ai-tools/parent");
    else router.replace("/ai-tools/general");
  }, [router]);

  const Card = ({ gradient, borderColor, bgColor, emoji, title, subtitle, tools, btnLabel, onClick }: any) => (
    <div style={{ background:"rgba(255,255,255,0.05)", backdropFilter:"blur(20px)", border:`1px solid ${borderColor}`, borderRadius:"24px", padding:"28px", display:"flex", flexDirection:"column", gap:"16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"52px", height:"52px", borderRadius:"16px", background:gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", flexShrink:0, boxShadow:`0 4px 16px ${borderColor}` }}>
          {emoji}
        </div>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"21px", fontWeight:700, color:"white", lineHeight:1.1 }}>{title}</div>
          <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.45)", marginTop:"3px" }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"7px", flex:1 }}>
        {tools.map((t: any) => (
          <div key={t.label} style={{ display:"flex", alignItems:"center", gap:"10px", background:bgColor, borderRadius:"10px", padding:"9px 12px" }}>
            <span style={{ fontSize:"16px", flexShrink:0 }}>{t.icon}</span>
            <div>
              <div style={{ fontSize:"12px", fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{t.label}</div>
              <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.4)" }}>{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onClick}
        style={{ width:"100%", padding:"13px", borderRadius:"14px", border:"none", background:gradient, color:"white", fontSize:"14px", fontWeight:700, cursor:"pointer", fontFamily:"'Quicksand',sans-serif", boxShadow:`0 4px 20px ${borderColor}`, letterSpacing:"0.01em" }}>
        {btnLabel}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0D1B2A 0%,#1A2F4A 45%,#0D2318 100%)", fontFamily:"'Quicksand',sans-serif", padding:"48px 20px 60px" }}>

      {/* ── Hero ── */}
      <div style={{ textAlign:"center", maxWidth:"680px", margin:"0 auto 52px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(23,143,120,0.15)", border:"1px solid rgba(23,143,120,0.3)", borderRadius:"20px", padding:"6px 16px", fontSize:"12px", color:"rgba(23,143,120,1)", fontWeight:700, marginBottom:"20px" }}>
          🆓 100% Free · No credit card · No signup
        </div>
        <h1 style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"clamp(30px,6vw,48px)", fontWeight:700, color:"white", margin:"0 0 14px", lineHeight:1.1 }}>
          🤖 Evergreen AI<br />Learning Tools
        </h1>
        <p style={{ fontSize:"15px", color:"rgba(255,255,255,0.55)", lineHeight:1.75, margin:"0 0 28px" }}>
          Personalised AI tools for <strong style={{ color:"#7EFCE1" }}>teachers</strong>, <strong style={{ color:"#C4B5FD" }}>parents</strong> and <strong style={{ color:"#FDE68A" }}>kids</strong> at Evergreen Preschool.<br />
          Powered by Groq & Google Gemini — real AI, completely free.
        </p>
        {/* Model badges */}
        <div style={{ display:"flex", gap:"6px", justifyContent:"center", flexWrap:"wrap" }}>
          {MODELS.map(m => (
            <span key={m.name} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", color:"rgba(255,255,255,0.65)", fontWeight:600, display:"flex", alignItems:"center", gap:"5px" }}>
              {m.icon} {m.name} <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400 }}>· {m.badge}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Role Cards ── */}
      <div style={{ maxWidth:"1020px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:"20px" }}>
        <Card
          gradient="linear-gradient(135deg,#178F78,#0F766E)"
          borderColor="rgba(23,143,120,0.4)"
          bgColor="rgba(23,143,120,0.12)"
          emoji="👩‍🏫" title="Teachers Corner" subtitle="5 professional tools"
          tools={TEACHER_TOOLS}
          btnLabel="Login as Teacher →"
          onClick={() => router.push("/teacher-login")}
        />
        <Card
          gradient="linear-gradient(135deg,#8957E5,#6366F1)"
          borderColor="rgba(137,87,229,0.4)"
          bgColor="rgba(137,87,229,0.12)"
          emoji="👨‍👩‍👧" title="Parents Corner" subtitle="4 parenting tools"
          tools={PARENT_TOOLS}
          btnLabel="Login as Parent →"
          onClick={() => router.push("/parent-login")}
        />
        <Card
          gradient="linear-gradient(135deg,#E8694A,#F5B829)"
          borderColor="rgba(232,105,74,0.4)"
          bgColor="rgba(232,105,74,0.12)"
          emoji="🧒" title="Kids Corner" subtitle="4 fun activities · via Parent login"
          tools={KIDS_TOOLS}
          btnLabel="Login as Parent →"
          onClick={() => router.push("/parent-login")}
        />
      </div>

      {/* ── Feature strip ── */}
      <div style={{ maxWidth:"700px", margin:"48px auto 0", display:"flex", gap:"12px", justifyContent:"center", flexWrap:"wrap" }}>
        {[["🔒","Private & secure"],["⚡","Real-time streaming"],["🎯","India-focused content"],["♾️","Unlimited uses"],["📱","Works on mobile"]].map(([icon,txt]) => (
          <div key={txt} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", color:"rgba(255,255,255,0.6)", fontWeight:600 }}>
            {icon} {txt}
          </div>
        ))}
      </div>
    </div>
  );
}
