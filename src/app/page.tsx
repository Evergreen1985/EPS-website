"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Phone, Mail, MapPin, Clock } from "lucide-react";
import HeroPill from "@/components/HeroPill";
import GoogleReviews from "@/components/GoogleReviews";
import programs from "@/content/programs.json";


// ─── data ────────────────────────────────────────────────
const progList = programs.filter(p => ["infant","playgroup","nursery","jrkg","srkg"].includes(p.id));

const progColors: Record<string, { strip: string; check: string; btn: string; btnShadow: string }> = {
  infant:   { strip:"#EC4899", check:"#EC4899", btn:"#BE185D", btnShadow:"rgba(190,24,93,0.25)" },
  playgroup:{ strip:"#E8694A", check:"#E8694A", btn:"#E8694A", btnShadow:"rgba(232,105,74,0.28)" },
  nursery:  { strip:"#F5B829", check:"#F5B829", btn:"#B08000", btnShadow:"rgba(176,128,0,0.2)" },
  jrkg:     { strip:"#6366F1", check:"#6366F1", btn:"#4F46E5", btnShadow:"rgba(79,70,229,0.25)" },
  srkg:     { strip:"#178F78", check:"#178F78", btn:"#178F78", btnShadow:"rgba(23,143,120,0.25)" },
};

const galItems = [
  { cat:"Art",     bg:"#FFF0F0", e:"🎨", cap:"Creative expression every day" },
  { cat:"Outdoor", bg:"#F0FFF5", e:"🌳", cap:"Safe outdoor play daily" },
  { cat:"Learning",bg:"#EEF4FF", e:"📚", cap:"Building a love of reading" },
  { cat:"Events",  bg:"#FFF5EB", e:"🎉", cap:"Annual Day celebrations" },
  { cat:"Art",     bg:"#FFFBE6", e:"🎵", cap:"Music and movement sessions" },
  { cat:"Learning",bg:"#F5F0FF", e:"✏️", cap:"Circle time builds community" },
  { cat:"Outdoor", bg:"#EDFFF4", e:"⛹️", cap:"Active and healthy children" },
  { cat:"Events",  bg:"#FFFBE8", e:"🏆", cap:"Prize distribution ceremony" },
  { cat:"Art",     bg:"#FFF0F8", e:"🖌️", cap:"Every child is an artist" },
  { cat:"Learning",bg:"#EEF4FF", e:"🔬", cap:"Young scientists at work" },
  { cat:"Outdoor", bg:"#EDFAF0", e:"🌱", cap:"Garden and nature activities" },
  { cat:"Events",  bg:"#FFF5EB", e:"🎭", cap:"Drama performance night" },
];

const sectionIds = ["home","programs","about","daycare","gallery","ai-tools","contact"];

// ─── helpers ─────────────────────────────────────────────
const Slide = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`min-w-full overflow-y-auto flex-shrink-0 no-scrollbar ${className}`}
    style={{ height:"calc(100vh - 184px)", ...style }}>
    {children}
  </div>
);

const SlideArrows = ({
  cur, total, onPrev, onNext
}: { cur: number; total: number; onPrev: () => void; onNext: () => void }) => (
  <>
    <button onClick={onPrev} disabled={cur === 0}
      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow-lg transition-all disabled:opacity-20 hover:scale-110"
      style={{ background: cur === 0 ? "#EDE8DF" : "#178F78", color: cur === 0 ? "#6B7A99" : "white", border:"none", boxShadow:"0 4px 14px rgba(0,0,0,0.15)" }}>
      ‹
    </button>
    <button onClick={onNext} disabled={cur === total - 1}
      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg shadow-lg transition-all disabled:opacity-20 hover:scale-110"
      style={{ background: cur === total - 1 ? "#EDE8DF" : "#178F78", color: cur === total - 1 ? "#6B7A99" : "white", border:"none", boxShadow:"0 4px 14px rgba(23,143,120,0.35)" }}>
      ›
    </button>
  </>
);

const SlideDots = ({ total, cur, onDot }: { total: number; cur: number; onDot: (i: number) => void }) => (
  <div className="flex items-center justify-center gap-1.5 py-2 border-t" style={{ borderColor:"#EDE8DF", background:"white" }}>
    {Array.from({ length: total }).map((_, i) => (
      <button key={i} onClick={() => onDot(i)}
        className="transition-all rounded-full"
        style={{
          width: i === cur ? "18px" : "6px", height: "6px",
          background: i === cur ? "#E8694A" : "#EDE8DF",
          borderRadius: i === cur ? "3px" : "50%"
        }} />
    ))}
  </div>
);

// ─── main component ───────────────────────────────────────
const DEFAULT_SITE = {
  name: "Evergreen Preschool & Daycare",
  contact: { phone: "7411574504", email: "info@evergreenpreschool.com" },
  hours: { weekdays: "7:00 AM – 7:00 PM", saturday: "8:00 AM – 1:00 PM", sunday: "Closed" },
  about: { mission: "To provide a safe, caring, and stimulating environment that promotes each child's social, emotional, physical, and cognitive development.", vision: "To be recognised as a leading preschool and daycare centre that prepares children to become confident, creative, and compassionate individuals." },
};

export default function HomePage() {
  const [active, setActive]       = useState(0);
  const [progSlide, setProgSlide] = useState(0);
  const [siteConfig, setSiteConfig] = useState(DEFAULT_SITE);
  useEffect(() => { fetch("/api/config").then(r=>r.json()).then(d=>{if(d.school)setSiteConfig(d.school);}).catch(()=>{}); }, []);
  const [aboutSlide, setAboutSlide] = useState(0);
  const [daySlide, setDaySlide]   = useState(0);
  const [galFilter, setGalFilter] = useState("All");
  const [sitePhotos, setSitePhotos] = useState<Record<string, string>>({});

  // ── auto-advance slides ──────────────────────────────
  const progTotal  = progList.length;
  const aboutTotal = 3;
  const dayTotal   = 3;

  useEffect(() => {
    if (active !== 1) return; // only run when Programs section is visible
    const t = setInterval(() => setProgSlide(p => (p + 1) % progTotal), 5000);
    return () => clearInterval(t);
  }, [active, progTotal]);

  useEffect(() => {
    if (active !== 2) return;
    const t = setInterval(() => setAboutSlide(p => (p + 1) % aboutTotal), 5000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    if (active !== 3) return;
    const t = setInterval(() => setDaySlide(p => (p + 1) % dayTotal), 5000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    fetch("/api/site-photos").then(r => r.json()).then(d => setSitePhotos(d.photos || {})).catch(() => {});
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const jumpTo = useCallback((idx: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: idx * scrollRef.current.clientHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const h = el.clientHeight;
      const idx = Math.round(el.scrollTop / h);
      const clamped = Math.min(idx, sectionIds.length - 1);
      setActive(clamped);
      // tell Navbar which section is active
      window.dispatchEvent(new CustomEvent("ep-section", { detail: clamped }));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll on homepage (we handle scrolling in the container)
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Listen for Navbar jump requests
  useEffect(() => {
    const onJump = (e: Event) => jumpTo((e as CustomEvent).detail);
    window.addEventListener("ep-jump", onJump);
    return () => window.removeEventListener("ep-jump", onJump);
  }, [jumpTo]);

  const secBand = (icon: string, title: string, sub: string, right?: React.ReactNode) => (
    <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ background:"#178F78" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ background:"rgba(255,255,255,0.15)" }}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-base leading-tight" style={{ fontFamily:"'Fredoka',sans-serif" }}>{title}</div>
        <div className="text-xs" style={{ color:"rgba(255,255,255,0.65)" }}>{sub}</div>
      </div>
      {right}
    </div>
  );

  const filteredGal = galFilter === "All" ? galItems : galItems.filter(g => g.cat === galFilter);


// Section height = 100vh - topbar(28px) - navbar(48px)
// Band height = 56px, Dots height = 36px
// Slide area = SH - 56 - 36 = 100vh - 168px
const SH  = "calc(100vh - 92px)";
const SSH = "calc(100vh - 184px)"; // slide scroll area height

  return (
    <div ref={scrollRef}
      style={{ height: SH, overflowY:"scroll", scrollSnapType:"y mandatory", scrollBehavior:"smooth" }}
      className="overflow-hidden no-scrollbar">

      {/* ══════════════════════════════════════════════
          0. HOME
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[0] = el; }}
        style={{ height: SH, scrollSnapAlign:"start", flexShrink:0, background:"linear-gradient(135deg,#FFF5F0 0%,#FEFCF8 45%,#F0FAF7 100%)", position:"relative", overflow:"hidden" }}>
        <div className="absolute inset-0" style={{ backgroundImage:"radial-gradient(circle at 10% 50%,rgba(245,184,41,0.18) 0%,transparent 50%),radial-gradient(circle at 85% 15%,rgba(232,105,74,0.12) 0%,transparent 50%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-10 items-center w-full">
            {/* left */}
            <div>
              <HeroPill />
              <h1 className="font-display font-bold leading-tight mb-4" style={{ fontSize:"clamp(2rem,4vw,3.5rem)", color:"#178F78" }}>
                Where Little Minds{" "}
                <span className="text-primary relative inline-block" style={{ color:"#E8694A" }}>
                  Grow Big Dreams
                  <svg className="absolute w-full h-2.5 -bottom-1 left-0 opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none" style={{ color:"#F5B829" }}>
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="3" fill="transparent"/>
                  </svg>
                </span>
              </h1>
              <p className="text-base mb-6 leading-relaxed max-w-lg" style={{ color:"#6B7A99", fontFamily:"'Quicksand',sans-serif" }}>
                A warm and nurturing environment in Electronic City, Bengaluru, where play-based learning sparks curiosity, creativity, and lifelong friendships.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <button onClick={() => jumpTo(6)}
                  className="flex items-center gap-2 font-bold px-7 py-3 rounded-full text-white transition-all hover:-translate-y-0.5"
                  style={{ background:"#E8694A", boxShadow:"0 6px 20px rgba(232,105,74,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                  Enroll Your Child <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => jumpTo(2)}
                  className="font-bold px-7 py-3 rounded-full transition-all hover:-translate-y-0.5 border"
                  style={{ background:"white", color:"#178F78", borderColor:"#EDE8DF", fontFamily:"'Quicksand',sans-serif" }}>
                  Learn More
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t pt-5" style={{ borderColor:"#EDE8DF" }}>
                {[["1000+","Happy Families"],["1:3","Best Ratio"],["4.9★","Google Rating"]].map(([v,l]) => (
                  <div key={l}>
                    <div className="font-display font-bold" style={{ fontSize:"1.4rem", color:"#178F78" }}>{v}</div>
                    <div className="text-xs" style={{ color:"#6B7A99" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* right blob */}
            <div className="relative hidden lg:block">
              <div className="relative w-full max-w-md mx-auto aspect-square">
                <div className="blob-shape w-full h-full overflow-hidden shadow-2xl border-8 border-white"
                  style={{ background:"linear-gradient(135deg,#FFD6CA,#B2F0E3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"80px" }}>
                  {sitePhotos.hero
                    ? <img src={sitePhotos.hero} alt="Evergreen Preschool" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : "🧒"
                  }
                </div>
                <div className="float-badge absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background:"rgba(245,184,41,0.2)" }}>
                    <Heart className="w-5 h-5" style={{ color:"#F5B829", fill:"#F5B829" }} />
                  </div>
                  <span className="font-bold text-sm leading-tight" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Loving<br/>Environment</span>
                </div>
                <div className="float-badge-2 absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background:"rgba(232,105,74,0.15)" }}>
                    <Shield className="w-5 h-5" style={{ color:"#E8694A" }} />
                  </div>
                  <span className="font-bold text-sm leading-tight" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Safe &<br/>Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* scroll hint */}
        <div className="absolute bottom-0 left-0 right-0 text-center pb-3 text-xs" style={{ color:"#6B7A99", fontFamily:"'Quicksand',sans-serif" }}>
          ▼ Scroll or click a tab to navigate
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          1. PROGRAMS
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[1] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("📚","Programs","Tap arrows to explore each programme",
          <span className="text-xs font-semibold" style={{ color:"rgba(255,255,255,0.8)" }}>{progSlide + 1} / {progList.length}</span>
        )}
        <div className="flex-1 overflow-hidden relative">
          <SlideArrows cur={progSlide} total={progList.length} onPrev={() => setProgSlide(p => Math.max(0,p-1))} onNext={() => setProgSlide(p => Math.min(progList.length-1,p+1))} />
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${progSlide * 100}%)`, height:SSH }}>
            {progList.map((prog) => {
              const c    = progColors[prog.id] ?? progColors.srkg;
              const lPic = sitePhotos[`prog_${prog.id}_left`];
              const rPic = sitePhotos[`prog_${prog.id}_right`];
              return (
                <div key={prog.id} className="min-w-full flex-shrink-0"
                  style={{ height:SSH, display:"grid", gridTemplateColumns:"30% 40% 30%", overflow:"hidden" }}>

                  {/* col 1 — left photo */}
                  <div style={{ position:"relative", overflow:"hidden", background:`linear-gradient(135deg,${c.check}18,${c.check}06)` }}>
                    {lPic
                      ? <img src={lPic} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"64px", opacity:0.3 }}>{prog.icon ?? "📚"}</div>
                    }
                  </div>

                  {/* col 2 — content */}
                  <div style={{ overflowY:"auto", padding:"18px 16px", background:"white",
                    scrollbarWidth:"none" as const,
                    borderLeft:`3px solid ${c.check}25`, borderRight:`3px solid ${c.check}25` }}>
                    <div style={{ height:"4px", borderRadius:"4px", background:c.strip, marginBottom:"14px" }} />
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px" }}>
                      <div style={{ width:"44px", height:"44px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", background:`${c.check}18`, flexShrink:0 }}>
                        {prog.icon ?? "📚"}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:700, fontSize:"1.35rem", color:"#178F78", lineHeight:1.1 }}>{prog.title}</div>
                        <span style={{ fontSize:"11px", fontWeight:600, background:"#FAF0E8", color:"#6B7A99", borderRadius:"20px", padding:"2px 10px", display:"inline-block", marginTop:"3px" }}>{prog.ageRange}</span>
                      </div>
                      <div style={{ fontFamily:"'Fredoka',sans-serif", fontWeight:700, fontSize:"13px", color:c.btn, flexShrink:0 }}>Ratio {prog.ratio}</div>
                    </div>
                    <p style={{ fontSize:"12px", lineHeight:1.65, color:"#6B7A99", marginBottom:"10px", fontFamily:"'Quicksand',sans-serif" }}>{prog.description}</p>
                    <div style={{ fontSize:"10px", fontWeight:700, textTransform:"uppercase" as const, letterSpacing:"0.08em", color:"#1A2F4A", marginBottom:"6px" }}>Highlights</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 10px", marginBottom:"12px" }}>
                      {prog.highlights.slice(0,6).map((h:string, i:number) => (
                        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"6px", fontSize:"11px", color:"#6B7A99", fontFamily:"'Quicksand',sans-serif" }}>
                          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:c.check, flexShrink:0, marginTop:"4px" }} />{h}
                        </div>
                      ))}
                    </div>
                    <div style={{ borderRadius:"12px", padding:"9px 12px", textAlign:"center", background:`${c.check}0d`, marginBottom:"14px" }}>
                      <div style={{ fontSize:"10px", color:"#6B7A99", marginBottom:"2px" }}>{prog.timingLabel}</div>
                      <div style={{ fontSize:"13px", fontWeight:700, color:"#1A2F4A" }}>{prog.timing}</div>
                    </div>
                    <Link href="/enquiry"
                      style={{ display:"block", textAlign:"center", padding:"11px 16px", borderRadius:"20px", background:c.btn, color:"white", fontWeight:700, fontSize:"13px", boxShadow:`0 5px 16px ${c.btnShadow}`, textDecoration:"none", fontFamily:"'Quicksand',sans-serif" }}>
                      Enquire for {prog.title} →
                    </Link>
                  </div>

                  {/* col 3 — right photo */}
                  <div style={{ position:"relative", overflow:"hidden", background:`linear-gradient(135deg,${c.check}06,${c.check}18)` }}>
                    {rPic
                      ? <img src={rPic} alt="" style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      : <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"64px", opacity:0.3 }}>{prog.icon ?? "📚"}</div>
                    }
                  </div>

                </div>
              );
            })}
          </div>
        </div>
        <SlideDots total={progList.length} cur={progSlide} onDot={setProgSlide} />
      </div>
      {/* ══════════════════════════════════════════════
          2. ABOUT US
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[2] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("🌿","About Us","Our story, values and team",
          <span className="text-xs font-semibold" style={{ color:"rgba(255,255,255,0.8)" }}>{aboutSlide + 1} / 3</span>
        )}
        <div className="flex-1 overflow-hidden relative">
          <SlideArrows cur={aboutSlide} total={3} onPrev={() => setAboutSlide(p => Math.max(0,p-1))} onNext={() => setAboutSlide(p => Math.min(2,p+1))} />
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${aboutSlide * 100}%)`, height:"calc(100vh - 184px)" }}>
            {/* Slide A: Story + Values */}
            <Slide className="p-5" style={{ background:"#FAF0E8" }}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-5">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:"#E8694A" }}>Our Story</div>
                  <div className="font-bold" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78", fontSize:"1.6rem" }}>Rooted in Care, Growing with Love</div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-white rounded-2xl p-5 border-l-4" style={{ borderColor:"#178F78" }}>
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="font-bold text-base mb-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Our Mission</div>
                    <p className="text-sm italic leading-relaxed" style={{ color:"#6B7A99" }}>&ldquo;{siteConfig.about.mission}&rdquo;</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border-l-4" style={{ borderColor:"#F5B829" }}>
                    <div className="text-2xl mb-2">🌟</div>
                    <div className="font-bold text-base mb-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Our Vision</div>
                    <p className="text-sm italic leading-relaxed" style={{ color:"#6B7A99" }}>&ldquo;{siteConfig.about.vision}&rdquo;</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[["❤️","Love First","Every child treated with warmth"],["☀️","Joyful Learning","Fun drives everything"],["🌱","Growth Mindset","Curiosity & resilience"],["🎨","Creativity","Unique imagination"]].map(([icon,title,desc]) => (
                    <div key={title} className="bg-white rounded-2xl p-4 text-center hover:-translate-y-1 transition-transform">
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="font-bold text-sm mb-1" style={{ fontFamily:"'Fredoka',sans-serif" }}>{title}</div>
                      <div className="text-xs" style={{ color:"#6B7A99" }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Slide>
            {/* Slide B: Team */}
            <Slide className="p-5" style={{ background:"white" }}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-5">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:"#F5B829" }}>Meet the Educators</div>
                  <div className="font-bold" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78", fontSize:"1.6rem" }}>Our Loving Staff</div>
                  <p className="text-sm mt-1" style={{ color:"#6B7A99" }}>Every teacher is trained, background-checked and passionate about early childhood education.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {[
                    { init:"MS", name:"Mrs. Sharma",   role:"Principal",             bio:"Over 15 years in early childhood education, leading with passion.", fact:"Loves teaching through storytelling!" },
                    { init:"MP", name:"Mr. Patel",     role:"Programme Coordinator", bio:"Brings science to life through hands-on experiments and nature walks.", fact:"Passionate about STEM education." },
                    { init:"MR", name:"Ms. Reddy",     role:"Daycare Head",          bio:"Patience and warmth make our daycare a safe, home-like space.", fact:"Speaks 3 languages!" },
                  ].map(m => (
                    <div key={m.name} className="rounded-2xl overflow-hidden border" style={{ background:"#FAF0E8", borderColor:"#EDE8DF" }}>
                      <div className="p-5 text-center">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-3"
                          style={{ background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>
                          {m.init}
                        </div>
                        <div className="font-bold text-lg mb-0.5" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>{m.name}</div>
                        <div className="text-xs font-bold mb-3" style={{ color:"#E8694A" }}>{m.role}</div>
                        <p className="text-xs leading-relaxed mb-3" style={{ color:"#6B7A99" }}>{m.bio}</p>
                        <div className="rounded-lg px-3 py-2 text-xs" style={{ background:"rgba(245,184,41,0.15)", color:"#854F0B" }}>💡 {m.fact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Slide>
            {/* Slide C: Reviews */}
            <Slide className="p-5" style={{ background:"#FEFCF8" }}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-5">
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color:"#F5B829" }}>Parent Reviews</div>
                  <div className="font-bold" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78", fontSize:"1.6rem" }}>Loved by Families</div>
                  <p className="text-sm mt-1" style={{ color:"#6B7A99" }}>Real reviews from Google — updated automatically</p>
                </div>
                <GoogleReviews />
              </div>
            </Slide>
          </div>
        </div>
        <SlideDots total={3} cur={aboutSlide} onDot={setAboutSlide} />
      </div>

      {/* ══════════════════════════════════════════════
          3. DAYCARE
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[3] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("🏡","Daycare & Extended Care","Flexible childcare for working parents",
          <span className="text-xs font-semibold" style={{ color:"rgba(255,255,255,0.8)" }}>{daySlide + 1} / 3</span>
        )}
        <div className="flex-1 overflow-hidden relative">
          <SlideArrows cur={daySlide} total={3} onPrev={() => setDaySlide(p => Math.max(0,p-1))} onNext={() => setDaySlide(p => Math.min(2,p+1))} />
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${daySlide * 100}%)`, height:"calc(100vh - 184px)" }}>
            {/* Full-Day Daycare */}
            <Slide className="p-5">
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background:"#EFF6FF" }}>🏡</div>
                    <div>
                      <div className="font-bold text-lg" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Full-Day Daycare</div>
                      <div className="text-xs" style={{ color:"#6B7A99" }}>Ages 2–6 · 7:00 AM – 7:00 PM</div>
                    </div>
                  </div>
                  {["Extended hours 7 AM – 7 PM","Nutritious breakfast, lunch & snacks","Age-appropriate educational activities","Supervised indoor & outdoor play","Quiet time & rest periods","Daily parent progress updates"].map(f => (
                    <div key={f} className="flex items-start gap-2.5 mb-2 text-sm" style={{ color:"#6B7A99", fontFamily:"'Quicksand',sans-serif" }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background:"#178F78" }} />{f}
                    </div>
                  ))}
                  <button onClick={() => jumpTo(6)} className="mt-4 font-bold px-6 py-2.5 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
                    style={{ background:"#178F78", boxShadow:"0 5px 16px rgba(23,143,120,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                    Enquire About Daycare →
                  </button>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#1A2F4A" }}>Sample Daily Schedule</div>
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor:"#EDE8DF" }}>
                    <div className="px-4 py-2 font-bold text-sm" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78", background:"rgba(23,143,120,0.08)" }}>🏡 Full-Day Daycare</div>
                    {[["7:00 – 8:30 AM","Arrival & Free Play"],["8:30 – 9:00 AM","Breakfast"],["9:00 – 11:30 AM","Educational Activities"],["11:30 – 12:30 PM","Outdoor Play"],["12:30 – 1:15 PM","Lunch"],["1:15 – 3:00 PM","Rest / Quiet Time"],["3:00 – 3:30 PM","Afternoon Snack"],["5:00 – 7:00 PM","Free Play & Departure"]].map(([t,a],i) => (
                      <div key={t} className="flex text-xs border-t" style={{ borderColor:"#EDE8DF", background:i%2===0?"white":"#FAF0E8" }}>
                        <div className="px-3 py-2 font-bold w-32 flex-shrink-0" style={{ color:"#178F78" }}>{t}</div>
                        <div className="px-3 py-2" style={{ color:"#6B7A99" }}>{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Slide>
            {/* After-School */}
            <Slide className="p-5">
              <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background:"#F0FDFA" }}>🚌</div>
                    <div>
                      <div className="font-bold text-lg" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>After-School Program</div>
                      <div className="text-xs" style={{ color:"#6B7A99" }}>Ages 5–12 · 3:00 PM – 7:00 PM</div>
                    </div>
                  </div>
                  {["School pickup from selected schools","Supervised homework time","Nutritious afternoon snacks","Enrichment — arts, crafts, music","Indoor and outdoor games","Special interest clubs"].map(f => (
                    <div key={f} className="flex items-start gap-2.5 mb-2 text-sm" style={{ color:"#6B7A99", fontFamily:"'Quicksand',sans-serif" }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background:"#0F766E" }} />{f}
                    </div>
                  ))}
                  <button onClick={() => jumpTo(6)} className="mt-4 font-bold px-6 py-2.5 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
                    style={{ background:"#0F766E", boxShadow:"0 5px 16px rgba(15,118,110,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                    Enquire About After-School →
                  </button>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:"#1A2F4A" }}>After-School Schedule</div>
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor:"#EDE8DF" }}>
                    <div className="px-4 py-2 font-bold text-sm" style={{ fontFamily:"'Fredoka',sans-serif", color:"#0F766E", background:"rgba(15,118,110,0.06)" }}>🚌 After-School Program</div>
                    {[["3:00 – 3:30 PM","Arrival & Snack"],["3:30 – 4:30 PM","Homework Time"],["4:30 – 5:30 PM","Enrichment / Clubs"],["5:30 – 6:30 PM","Outdoor / Indoor Games"],["6:30 – 7:00 PM","Free Play & Departure"]].map(([t,a],i) => (
                      <div key={t} className="flex text-xs border-t" style={{ borderColor:"#EDE8DF", background:i%2===0?"white":"#FAF0E8" }}>
                        <div className="px-3 py-2 font-bold w-32 flex-shrink-0" style={{ color:"#0F766E" }}>{t}</div>
                        <div className="px-3 py-2" style={{ color:"#6B7A99" }}>{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Slide>
            {/* Holiday Camps */}
            <Slide className="p-5" style={{ background:"linear-gradient(135deg,#FFFBEB,#FEFCF8)" }}>
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-5">
                  <div className="font-bold text-2xl mb-1" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>⛺ Holiday Camps</div>
                  <div className="text-sm" style={{ color:"#6B7A99" }}>Ages 3–12 · 8:00 AM – 5:30 PM · Summer, Diwali & Winter holidays</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                  {[["🎨","Arts & Crafts","#F5B829","Creative workshops and hands-on projects"],["⚽","Sports & Games","#E8694A","Outdoor adventures and team sports"],["🔬","Science Fun","#178F78","Cool experiments and discoveries"],["🎭","Drama & Music","#8957E5","Performances, singing and dancing"],["🌱","Nature Walks","#0F766E","Garden activities and local field trips"],["🍳","Cooking Class","#F5B829","Fun, safe cooking experiences for kids"]].map(([icon,title,color,desc]) => (
                    <div key={title} className="bg-white rounded-xl p-4 border-l-4" style={{ borderColor:color }}>
                      <div className="text-2xl mb-2">{icon}</div>
                      <div className="font-bold text-sm mb-1" style={{ color:"#1A2F4A" }}>{title}</div>
                      <div className="text-xs" style={{ color:"#6B7A99" }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => jumpTo(6)} className="w-full font-bold py-3 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
                  style={{ background:"#E8694A", boxShadow:"0 5px 16px rgba(232,105,74,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                  Enquire About Holiday Camps →
                </button>
              </div>
            </Slide>
          </div>
        </div>
        <SlideDots total={3} cur={daySlide} onDot={setDaySlide} />
      </div>

      {/* ══════════════════════════════════════════════
          4. GALLERY
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[4] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("📸","Gallery","Moments from our classrooms and events",
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
            {["All","Art","Outdoor","Learning","Events"].map(cat => (
              <button key={cat} onClick={() => setGalFilter(cat)}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                style={{
                  background: galFilter===cat ? "white" : "rgba(255,255,255,0.1)",
                  color: galFilter===cat ? "#178F78" : "rgba(255,255,255,0.8)",
                  borderColor: galFilter===cat ? "white" : "rgba(255,255,255,0.3)"
                }}>
                {cat}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4" style={{ background:"#FAF0E8", scrollbarWidth:"none" }}>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {filteredGal.map((g, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all" style={{ background:"white", borderColor:"#EDE8DF" }}>
                <div className="flex items-center justify-center text-3xl" style={{ background:g.bg, height:"80px" }}>{g.e}</div>
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold" style={{ color:"#1A2F4A" }}>{g.cap}</div>
                  <div className="text-xs" style={{ color:"#6B7A99" }}>{g.cat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          5. AI TOOLS
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[5] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("🤖","AI Learning Tools","Smart tools for parents and teachers — 100% free")}
        <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth:"none" as const }}>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-3 mb-3">
              {[
                { icon:"📖", title:"Story Generator",  color:"#E8694A", bg:"rgba(232,105,74,0.1)",   tool:"story",     desc:"Personalised bedtime stories with your child's name, theme and moral lesson." },
                { icon:"🧠", title:"Milestone Advisor", color:"#178F78", bg:"rgba(23,143,120,0.1)",   tool:"milestone", desc:"Developmental milestone guidance tailored to your child's specific age." },
                { icon:"📅", title:"Activity Planner",  color:"#B08000", bg:"rgba(245,184,41,0.12)",  tool:"activity",  desc:"A full week of fun, age-appropriate learning activities generated instantly." },
                { icon:"📋", title:"Progress Report",   color:"#8957E5", bg:"rgba(137,87,229,0.1)",   tool:"report",    desc:"Warm, professional progress reports for parents generated in seconds." },
              ].map(t => (
                <div key={t.title} className="bg-white rounded-2xl border p-4 flex items-start gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all" style={{ borderColor:`${t.color}44` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:t.bg }}>{t.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm mb-1" style={{ fontFamily:"'Fredoka',sans-serif", color:t.color }}>{t.title}</div>
                    <div className="text-xs mb-2 leading-relaxed" style={{ color:"#6B7A99" }}>{t.desc}</div>
                    <Link href="/ai-tools/general" className="text-xs font-bold" style={{ color:t.color }}>Try it now →</Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-4 text-center border flex flex-col sm:flex-row items-center gap-4" style={{ background:"linear-gradient(135deg,rgba(23,143,120,0.06),rgba(232,105,74,0.06))", borderColor:"#EDE8DF" }}>
              <div className="text-2xl">✨</div>
              <div className="flex-1 text-left">
                <div className="font-bold text-base mb-0.5" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>100% Free — No API Key or Payment Needed</div>
                <div className="text-xs" style={{ color:"#6B7A99" }}>All tools work instantly — just fill in the details and get your result in seconds.</div>
              </div>
              <Link href="/ai-tools/general" className="flex-shrink-0 inline-flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-white transition-all hover:-translate-y-0.5"
                style={{ background:"#178F78", boxShadow:"0 5px 16px rgba(23,143,120,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                Open AI Tools <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          6. CONTACT
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[6] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("✉️","Contact & Admissions","We reply within one business day")}
        <div className="flex-1 flex items-center px-5 py-4 overflow-hidden" style={{ background:"#FEFCF8" }}>
          <div className="max-w-5xl w-full mx-auto grid lg:grid-cols-5 gap-5 items-center">
            {/* CTA Panel */}
            <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,#178F78,#0f6b5a)" }}>
              <div className="p-8">
                <div className="text-4xl mb-4">🌿</div>
                <div className="font-bold mb-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"white", fontSize:"2rem", lineHeight:1.15 }}>
                  Ready to Enrol Your Child?
                </div>
                <p className="text-sm mb-6 leading-relaxed" style={{ color:"rgba(255,255,255,0.8)", fontFamily:"'Quicksand',sans-serif" }}>
                  Fill in our quick enquiry form — takes under 2 minutes. Tell us your child's name, age and the programme you're interested in, and our team will get back to you within 1 business day.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Link href="/enquiry"
                    className="flex items-center gap-2 font-bold px-7 py-3 rounded-full text-sm transition-all hover:-translate-y-0.5"
                    style={{ background:"#E8694A", color:"white", boxShadow:"0 6px 20px rgba(232,105,74,0.4)", fontFamily:"'Quicksand',sans-serif", textDecoration:"none" }}>
                    Start Enquiry <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href={`https://wa.me/91${siteConfig.contact.phone}?text=Hi! I'd like to enquire about admissions.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold px-6 py-3 rounded-full text-sm transition-all hover:-translate-y-0.5"
                    style={{ background:"#25D366", color:"white", boxShadow:"0 6px 20px rgba(37,211,102,0.35)", fontFamily:"'Quicksand',sans-serif", textDecoration:"none" }}>
                    💬 WhatsApp Us
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["🕐","Replies in","1 business day"],["🏫","Free","campus visit"],["🎁","Sibling","10% off"]].map(([icon,l1,l2]) => (
                    <div key={l1} className="rounded-xl p-3 text-center" style={{ background:"rgba(255,255,255,0.1)" }}>
                      <div className="text-lg mb-0.5">{icon}</div>
                      <div className="text-xs" style={{ color:"rgba(255,255,255,0.7)", fontFamily:"'Quicksand',sans-serif" }}>{l1}</div>
                      <div className="text-xs font-bold" style={{ color:"white", fontFamily:"'Fredoka',sans-serif" }}>{l2}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-2xl p-4 text-white" style={{ background:"#178F78" }}>
                <div className="font-bold text-base mb-2" style={{ fontFamily:"'Fredoka',sans-serif" }}>Contact Info</div>
                <div className="space-y-1.5 text-xs mb-3" style={{ color:"rgba(255,255,255,0.8)" }}>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0"/>{siteConfig.contact.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0"/>{siteConfig.contact.email}</div>
                  <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>1427, 13th Cross, Ananthnagar Phase 2, Electronic City, Bengaluru 560100</div>
                </div>
                <a href={`tel:${siteConfig.contact.phone}`} className="block text-center font-bold py-2 rounded-full text-sm" style={{ background:"white", color:"#178F78", fontFamily:"'Quicksand',sans-serif" }}>
                  📞 Call Us Now
                </a>
              </div>
              <div className="rounded-2xl p-4 border" style={{ background:"#FAF0E8", borderColor:"#EDE8DF" }}>
                <div className="font-bold text-sm mb-2 flex items-center gap-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>
                  <Clock className="w-4 h-4"/> Opening Hours
                </div>
                <div className="text-xs space-y-1" style={{ color:"#6B7A99" }}>
                  <div className="flex justify-between"><span>Monday – Friday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{siteConfig.hours.weekdays}</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{siteConfig.hours.saturday}</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{siteConfig.hours.sunday}</span></div>
                </div>
              </div>
              <div className="rounded-2xl p-4 border" style={{ background:"rgba(245,184,41,0.08)", borderColor:"rgba(245,184,41,0.3)" }}>
                <div className="text-xl mb-1">🎁</div>
                <div className="font-bold text-sm mb-1" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Sibling Discount</div>
                <div className="text-xs leading-relaxed" style={{ color:"#6B7A99" }}>Enroll a second child and get <strong>10% off</strong> monthly tuition fees!</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
