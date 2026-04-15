"use client";
import { useState } from "react";
import { BookOpen, Brain, Calendar, FileText, Sparkles, Loader2, RefreshCw } from "lucide-react";

type Tool = "story" | "milestone" | "activity" | "report";

const tools = [
  { id: "story" as Tool,     icon: BookOpen,  label: "Story Generator",   color: "#E8694A", bg: "rgba(232,105,74,0.1)"  },
  { id: "milestone" as Tool, icon: Brain,     label: "Milestone Advisor", color: "#178F78", bg: "rgba(23,143,120,0.1)"  },
  { id: "activity" as Tool,  icon: Calendar,  label: "Activity Planner",  color: "#F5B829", bg: "rgba(245,184,41,0.12)" },
  { id: "report" as Tool,    icon: FileText,  label: "Progress Report",   color: "#8957E5", bg: "rgba(137,87,229,0.1)"  },
];

const storyThemes = ["Adventure in the Forest","A Day at the Beach","Magical Garden","Friendship at School","Space Explorer","The Kind Dragon","Rainy Day Fun","Farm Animals"];
const skills      = ["Language & Communication","Fine Motor Skills","Gross Motor Skills","Social Skills","Creativity & Arts","Numeracy","Literacy","Emotional Intelligence"];
const durations   = ["15 minutes","30 minutes","45 minutes","1 hour"];
const ageGroups   = ["9 months – 2 years","2–3 years","3–4 years","4–5 years","5–6 years","6–8 years"];

// ── Pre-written smart responses ──────────────────────────────────

function generateStory(theme: string, name: string, age: string, lesson: string): string {
  const hero = name || "Mia";
  const lessonText = lesson || "kindness";
  const stories: Record<string, string> = {
    "Adventure in the Forest": `Once upon a time, little ${hero} put on red boots and stepped into the Whispering Forest. The trees swayed gently, and a tiny squirrel appeared.\n\n"I've lost my acorns!" squeaked the squirrel sadly.\n\n${hero}'s eyes went wide. "I'll help you look!" And so they searched together — under golden leaves, behind mossy rocks, and inside a hollow log.\n\nFinally, ${hero} spotted a pile of acorns near the big oak tree. "Found them!"\n\nThe squirrel did a happy dance. "Thank you, ${hero}! You showed real ${lessonText} today."\n\nAll the way home, ${hero} smiled — because helping someone always feels wonderful. 🌲\n\n💛 Remember: ${lessonText.charAt(0).toUpperCase() + lessonText.slice(1)} makes the world a better place!`,
    "Friendship at School": `${hero} felt shy on the first day at Evergreen School. Everyone seemed to already know each other.\n\nAt playtime, ${hero} sat alone — until a girl named Zara came over. "Want to build a tower with me?"\n\nTogether they stacked blocks higher and higher — until CRASH! It tumbled down. They looked at each other and burst out laughing.\n\n"Want to try again?" asked Zara.\n\n"Yes!" said ${hero} happily.\n\nBy the end of the day, ${hero} had a new best friend — and had learned that ${lessonText} is the first step to finding one.\n\n💛 The best friendships start with a simple "hello"!`,
    "Magical Garden": `In ${hero}'s backyard was a tiny seed — brown and wrinkled and small.\n\n${hero} dug a little hole, placed the seed inside, and watered it every single morning.\n\nDays passed. Then one morning — a tiny green shoot poked through the soil!\n\n"It's alive!" cheered ${hero}, clapping with joy.\n\nWeeks later, a beautiful sunflower stood tall, its yellow petals glowing like the sun.\n\nGrandma smiled. "${hero}, you grew that with patience and love — that's the magic of ${lessonText}."\n\n💛 Good things grow when we give them care and time!`,
  };
  const keys = Object.keys(stories);
  const matchKey = keys.find(k => theme.includes(k.split(" ")[1]) || k === theme);
  const base = matchKey ? stories[matchKey] : stories["Adventure in the Forest"];
  return age.includes("2–3") ? base.replace(/\n\n.+\n\n/g, "\n\n") : base;
}

function generateMilestone(age: string, concern: string): string {
  const milestones: Record<string, string> = {
    "9 months – 2 years": `🌱 Key Milestones for ${age}\n\n✅ What to expect:\n• Speaks 10–50 words and begins combining two words\n• Walks steadily, climbs stairs with support\n• Points to objects and pictures in books\n• Imitates actions and simple pretend play\n• Shows strong attachment to caregivers\n\n🎮 Activities to support development:\n• Read picture books together daily — point and name objects\n• Play peek-a-boo and simple hiding games\n• Sing nursery rhymes with actions (Wheels on the Bus!)\n• Offer safe objects of different textures to explore\n• Encourage self-feeding with a spoon\n\n💡 Tips for parents:\n• Every child develops at their own pace — a range is normal\n• Talk constantly to your child during daily routines\n${concern ? `\n📌 Regarding your concern "${concern}":\nThis is a common question! Consult your paediatrician if you notice significant delays across multiple areas. Early intervention is always beneficial.` : ""}`,

    "2–3 years": `🌱 Key Milestones for ${age}\n\n✅ What to expect:\n• Vocabulary of 200+ words; speaks in short sentences\n• Runs, jumps, and kicks a ball\n• Begins sorting by shape and colour\n• Engages in parallel play (plays near other children)\n• Shows independence — "Me do it!"\n\n🎮 Activities to support development:\n• Simple puzzles and shape sorters\n• Playdough for fine motor skill building\n• Dress-up and pretend play\n• Singing and dancing together\n• Simple art — finger painting, stickers, crayons\n\n💡 Tips for parents:\n• Tantrums are normal — they are learning to manage big emotions\n• Give simple choices: "Red cup or blue cup?"\n${concern ? `\n📌 Regarding "${concern}":\nThis is very common at this age. Stay patient and consistent. Speak with your child's teacher or paediatrician if it persists.` : ""}`,

    "3–4 years": `🌱 Key Milestones for ${age}\n\n✅ What to expect:\n• Speaks clearly in 4–5 word sentences\n• Counts to 10 and recognises some numbers\n• Draws circles, lines, and simple figures\n• Plays cooperatively with other children\n• Understands "same" and "different"\n\n🎮 Activities to support development:\n• Reading books and asking "what happens next?"\n• Number games with blocks or counting toys\n• Simple board games that teach turn-taking\n• Nature walks — collect leaves, rocks, observe insects\n• Creative art with scissors (supervised)\n\n💡 Tips for parents:\n• Ask open-ended questions: "Tell me about your drawing!"\n• Establish consistent daily routines for security\n${concern ? `\n📌 Regarding "${concern}":\nAt ${age}, this is a common area parents ask about. Share this with your Evergreen teacher — we can support at school too!` : ""}`,

    "4–5 years": `🌱 Key Milestones for ${age}\n\n✅ What to expect:\n• Recognises letters and writes their own name\n• Counts 10+ objects correctly\n• Hops, skips, and catches a bounced ball\n• Tells stories with beginning, middle and end\n• Understands rules and wants to follow them\n\n🎮 Activities to support development:\n• Letter recognition games and simple phonics\n• Addition with physical objects (blocks, toys)\n• Role-play games (shop, doctor, school)\n• Drawing and early writing practice\n• Simple science experiments (mixing colours!)\n\n💡 Tips for parents:\n• This is a great time to build pre-reading skills\n• Encourage problem-solving: "How can we fix that?"\n${concern ? `\n📌 Regarding "${concern}":\nThis is something our teachers at Evergreen actively support. Please speak with our programme coordinator for personalised guidance!` : ""}`,

    "5–6 years": `🌱 Key Milestones for ${age}\n\n✅ What to expect:\n• Beginning to read simple words and sentences\n• Writes letters and numbers independently\n• Can focus on a task for 15–20 minutes\n• Understands rules, fairness, and consequences\n• Strong friendships begin to form\n\n🎮 Activities to support development:\n• Daily reading together — take turns reading pages\n• Maths games: addition, patterns, simple measurement\n• Writing their own simple stories or journals\n• Strategy games like chess, checkers, Snakes & Ladders\n• Group projects and collaborative art\n\n💡 Tips for parents:\n• Encourage independence with homework and chores\n• Celebrate effort, not just results\n${concern ? `\n📌 Regarding "${concern}":\nSr. KG is a key transition year. Our team at Evergreen is here to support every child's unique journey. Let's connect!` : ""}`,
  };
  const key = Object.keys(milestones).find(k => age.includes(k.split("–")[0].trim())) ?? "3–4 years";
  return milestones[key] ?? milestones["3–4 years"];
}

function generateActivity(age: string, skill: string, duration: string, materials: string): string {
  const mats = materials || "paper, crayons, household items";
  return `🎯 Activity Plan for ${age} — ${skill}\n⏱️ Duration: ${duration}\n📦 Materials: ${mats}\n\n━━━━━━━━━━━━━━━━━━━━━━\n🌟 ACTIVITY: "${skill} Adventure!"\n━━━━━━━━━━━━━━━━━━━━━━\n\n🎯 Objective:\nDevelop ${skill.toLowerCase()} through hands-on, playful learning.\n\n📋 Instructions:\n\n1️⃣ Warm Up (3–5 mins)\n   • Start with a short song or rhyme related to today's theme\n   • Ask: "What do you think we'll do today?"\n\n2️⃣ Main Activity (${duration})\n   • Lay out your materials: ${mats}\n   • Let the child lead — follow their curiosity!\n   • For ${skill}: encourage them to try, make mistakes, and try again\n   • Use lots of praise: "Wow, look what you made!"\n\n3️⃣ Cool Down (3–5 mins)\n   • Ask: "What was your favourite part?"\n   • Display or celebrate their work\n   • Clean up together — that's a skill too! 😊\n\n💡 Tips for Parents & Teachers:\n• Keep instructions simple — one step at a time\n• If they lose interest, follow their lead to a related activity\n• Repeat the activity on different days — repetition builds skill!\n\n🔄 Make it easier:\nUse larger materials, provide more guidance, work side by side\n\n🚀 Make it harder:\nAdd a time challenge, introduce new words, ask "why do you think that?"`;
}

function generateReport(childName: string, age: string, strengths: string, improvements: string): string {
  const name = childName || "Your child";
  const str  = strengths    || "enthusiasm, creativity, and a warm heart";
  const imp  = improvements || "building confidence in group settings";
  return `📋 PROGRESS REPORT\nEvergreen Preschool & Daycare, Bengaluru\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nChild: ${name}       Age Group: ${age}\nProgramme: Evergreen Early Learning\nPeriod: Current Term\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 OVERALL PROGRESS\n\nIt has been a wonderful term watching ${name} grow and blossom at Evergreen! ${name} comes to school with a positive attitude each day and has made impressive strides across all areas of our curriculum. We are very proud of the progress shown this term.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⭐ STRENGTHS\n\n${name} particularly shines in: ${str}. These qualities make ${name} a joy to have in our classroom, and peers naturally respond well to this positive energy. Keep celebrating these wonderful qualities at home!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🌱 AREAS FOR GROWTH\n\nAs ${name} continues to develop, we are gently supporting growth in: ${imp}. This is completely age-appropriate and we are seeing steady improvement each week. With consistent encouragement at home and school, we are confident ${name} will continue to thrive.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💛 A NOTE FROM THE TEAM\n\nThank you for entrusting us with ${name}'s early childhood journey. It truly takes a village, and we are grateful to be part of yours. Please feel free to reach out anytime.\n\nWarm regards,\nThe Evergreen Team 🌿\n1427, 13th Cross, Ananthnagar Phase 2\nElectronic City, Bengaluru – 560100\n📞 7411574504`;
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>("story");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState("");

  const [storyTheme,    setStoryTheme]    = useState(storyThemes[0]);
  const [storyName,     setStoryName]     = useState("");
  const [storyAge,      setStoryAge]      = useState(ageGroups[2]);
  const [storyLesson,   setStoryLesson]   = useState("kindness");
  const [msAge,         setMsAge]         = useState(ageGroups[2]);
  const [msConcern,     setMsConcern]     = useState("");
  const [actAge,        setActAge]        = useState(ageGroups[2]);
  const [actSkill,      setActSkill]      = useState(skills[0]);
  const [actDuration,   setActDuration]   = useState(durations[1]);
  const [actMaterials,  setActMaterials]  = useState("");
  const [repName,       setRepName]       = useState("");
  const [repAge,        setRepAge]        = useState(ageGroups[2]);
  const [repStrengths,  setRepStrengths]  = useState("");
  const [repImprove,    setRepImprove]    = useState("");

  const currentTool = tools.find(t => t.id === activeTool)!;

  function handleGenerate() {
    setLoading(true);
    setResult("");
    setTimeout(() => {
      let output = "";
      if (activeTool === "story")     output = generateStory(storyTheme, storyName, storyAge, storyLesson);
      if (activeTool === "milestone") output = generateMilestone(msAge, msConcern);
      if (activeTool === "activity")  output = generateActivity(actAge, actSkill, actDuration, actMaterials);
      if (activeTool === "report")    output = generateReport(repName, repAge, repStrengths, repImprove);
      setResult(output);
      setLoading(false);
    }, 1200);
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all";
  const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5";
  const chipCls  = (active: boolean, color: string) => ({
    background:  active ? color : "white",
    color:       active ? "white" : "#6B7A99",
    borderColor: active ? color : "#EDE8DF",
  });

  return (
    <div className="min-h-screen pb-20" style={{ background: "#FEFCF8", fontFamily: "'Quicksand', sans-serif" }}>

      {/* Header */}
      <div className="py-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #178F78 0%, #0f6b5a 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 mb-5">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-sm font-semibold">Smart Learning Tools</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            AI Learning Tools
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto">
            Smart tools for parents and teachers — helping make early childhood education more joyful and personalised.
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
              <button key={tool.id} onClick={() => { setActiveTool(tool.id); setResult(""); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: isActive ? tool.color : "#EDE8DF",
                  background:  isActive ? tool.bg : "white",
                  transform:   isActive ? "translateY(-2px)" : "none",
                  boxShadow:   isActive ? `0 8px 24px ${tool.color}25` : "0 2px 8px rgba(0,0,0,0.04)",
                }}>
                <Icon className="w-6 h-6" style={{ color: tool.color }} />
                <span className="text-xs font-bold text-center leading-tight" style={{ color: isActive ? tool.color : "#6B7A99" }}>
                  {tool.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100" style={{ background: currentTool.bg }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: currentTool.color }}>
                <currentTool.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: currentTool.color }}>
                  {currentTool.label}
                </h2>
                <p className="text-sm text-gray-500">
                  {activeTool === "story"     && "Create a personalised story for your little one in seconds."}
                  {activeTool === "milestone" && "Get developmental milestone guidance for your child's age."}
                  {activeTool === "activity"  && "Generate fun, educational activities tailored to your child."}
                  {activeTool === "report"    && "Create a warm, professional progress report in seconds."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">

            {/* STORY */}
            {activeTool === "story" && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Story Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {storyThemes.map(t => (
                      <button key={t} onClick={() => setStoryTheme(t)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={chipCls(storyTheme===t, "#E8694A")}>{t}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Child&apos;s Name (optional)</label>
                    <input className={inputCls} placeholder="e.g. Arjun" value={storyName} onChange={e=>setStoryName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Age Group</label>
                    <select className={inputCls} value={storyAge} onChange={e=>setStoryAge(e.target.value)}>
                      {ageGroups.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Lesson to Teach</label>
                  <input className={inputCls} placeholder="e.g. kindness, sharing, bravery, honesty"
                    value={storyLesson} onChange={e=>setStoryLesson(e.target.value)} />
                </div>
              </div>
            )}

            {/* MILESTONE */}
            {activeTool === "milestone" && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Child&apos;s Age Group</label>
                  <div className="flex flex-wrap gap-2">
                    {ageGroups.map(a => (
                      <button key={a} onClick={() => setMsAge(a)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={chipCls(msAge===a, "#178F78")}>{a}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Specific Concern (optional)</label>
                  <textarea className={inputCls} rows={3}
                    placeholder="e.g. My child is not yet speaking many words..."
                    value={msConcern} onChange={e=>setMsConcern(e.target.value)} />
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {activeTool === "activity" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Age Group</label>
                    <select className={inputCls} value={actAge} onChange={e=>setActAge(e.target.value)}>
                      {ageGroups.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Duration</label>
                    <select className={inputCls} value={actDuration} onChange={e=>setActDuration(e.target.value)}>
                      {durations.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Skill to Develop</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(s => (
                      <button key={s} onClick={() => setActSkill(s)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                        style={chipCls(actSkill===s, "#F5B829")}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Available Materials (optional)</label>
                  <input className={inputCls} placeholder="e.g. paper, crayons, blocks, playdough..."
                    value={actMaterials} onChange={e=>setActMaterials(e.target.value)} />
                </div>
              </div>
            )}

            {/* REPORT */}
            {activeTool === "report" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Child&apos;s Name</label>
                    <input className={inputCls} placeholder="e.g. Priya" value={repName} onChange={e=>setRepName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Age Group</label>
                    <select className={inputCls} value={repAge} onChange={e=>setRepAge(e.target.value)}>
                      {ageGroups.map(a=><option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Strengths Observed</label>
                  <textarea className={inputCls} rows={2}
                    placeholder="e.g. loves art, very social, great with numbers, kind to friends..."
                    value={repStrengths} onChange={e=>setRepStrengths(e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Areas for Growth</label>
                  <textarea className={inputCls} rows={2}
                    placeholder="e.g. working on sharing, developing pencil grip, building confidence..."
                    value={repImprove} onChange={e=>setRepImprove(e.target.value)} />
                </div>
              </div>
            )}

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-bold text-sm transition-all"
              style={{
                background:  loading ? "#ccc" : currentTool.color,
                boxShadow:   loading ? "none" : `0 8px 24px ${currentTool.color}40`,
                cursor:      loading ? "not-allowed" : "pointer",
              }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Sparkles className="w-4 h-4" /> Generate with AI</>}
            </button>

            {/* Result */}
            {result && (
              <div className="mt-6 rounded-2xl border-2 overflow-hidden" style={{ borderColor: currentTool.color + "40" }}>
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: currentTool.bg }}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{ color: currentTool.color }} />
                    <span className="text-sm font-bold" style={{ color: currentTool.color }}>Result</span>
                  </div>
                  <button onClick={handleGenerate}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70 transition-opacity"
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

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { icon: "🔒", title: "Safe & Private",    desc: "No child data is stored. All content is generated fresh each time and never saved." },
            { icon: "🎯", title: "Age-Appropriate",   desc: "Every tool is calibrated for early childhood development stages from 9 months to 8 years." },
            { icon: "⚡", title: "Instant Results",   desc: "Get personalised content in seconds — stories, plans, reports and milestone guidance." },
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
