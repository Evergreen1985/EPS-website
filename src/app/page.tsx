"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Star, ExternalLink, Phone, Mail, MapPin, Clock } from "lucide-react";
import HeroPill from "@/components/HeroPill";
import GoogleReviews from "@/components/GoogleReviews";
import site from "@/content/site.json";
import programs from "@/content/programs.json";

// ─── types ───────────────────────────────────────────────
type FormStatus = "idle" | "sending" | "success";

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

const sectionIds = ["home","programs","about","daycare","gallery","ai-tools","portal","contact"];

// ─── helpers ─────────────────────────────────────────────
const Slide = ({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`min-w-full overflow-y-auto flex-shrink-0 ${className}`}
    style={{ height:"calc(100vh - 168px)", scrollbarWidth:"none" as const, ...style }}>
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
export default function HomePage() {
  const [active, setActive]       = useState(0);
  const [progSlide, setProgSlide] = useState(0);
  const [aboutSlide, setAboutSlide] = useState(0);
  const [daySlide, setDaySlide]   = useState(0);
  const [galFilter, setGalFilter] = useState("All");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [form, setForm] = useState({ parent:"", phone:"", child:"", dob:"", program:"", msg:"" });

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const jumpTo = useCallback((idx: number) => {
    const el = sectionRefs.current[idx];
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop, behavior: "smooth" });
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    await new Promise(r => setTimeout(r, 1400));
    setFormStatus("success");
  };

// Section height = 100vh - topbar(28px) - navbar(48px)
// Band height = 56px, Dots height = 36px
// Slide area = SH - 56 - 36 = 100vh - 168px
const SH  = "calc(100vh - 76px)";
const SSH = "calc(100vh - 168px)"; // slide scroll area height

  return (
    <div ref={scrollRef}
      style={{ height: SH, overflowY:"scroll", scrollSnapType:"y mandatory", scrollBehavior:"smooth", scrollbarWidth:"none" }}
      className="overflow-hidden">

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
                <button onClick={() => jumpTo(7)}
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
                  🧒
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
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${progSlide * 100}%)`, height:"calc(100vh - 168px)" }}>
            {progList.map((prog) => {
              const c = progColors[prog.id] ?? progColors.srkg;
              return (
                <Slide key={prog.id}>
                  <div className="max-w-2xl mx-auto px-14 py-4">
                    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor:"#EDE8DF" }}>
                      <div className="h-1.5" style={{ background:c.strip }} />
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background:`${c.check}18` }}>
                            {programs.find(p=>p.id===prog.id)?.icon ?? "📚"}
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-2xl leading-tight" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>{prog.title}</div>
                            <span className="text-sm font-semibold px-3 py-0.5 rounded-full" style={{ background:"#FAF0E8", color:"#6B7A99" }}>{prog.ageRange}</span>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-base" style={{ fontFamily:"'Fredoka',sans-serif", color:c.btn }}>Ratio {prog.ratio}</div>
                          </div>
                        </div>
                        {/* Description */}
                        <p className="text-sm leading-relaxed mb-3" style={{ color:"#6B7A99" }}>{prog.description}</p>
                        {/* Highlights — 2 columns */}
                        <div className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color:"#1A2F4A" }}>Highlights</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-4">
                          {prog.highlights.slice(0,6).map((h: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm" style={{ color:"#6B7A99" }}>
                              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background:c.check }} />{h}
                            </div>
                          ))}
                        </div>
                        {/* Schedule boxes */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {prog.halfDay && <div className="rounded-xl p-3 text-center" style={{ background:`${c.check}0d` }}>
                            <div className="text-xs mb-0.5" style={{ color:"#6B7A99" }}>Half Day</div>
                            <div className="text-sm font-bold" style={{ color:"#1A2F4A" }}>{prog.halfDay}</div>
                          </div>}
                          {prog.fullDay && <div className="rounded-xl p-3 text-center" style={{ background:`${c.check}0d` }}>
                            <div className="text-xs mb-0.5" style={{ color:"#6B7A99" }}>Full Day</div>
                            <div className="text-sm font-bold" style={{ color:"#1A2F4A" }}>{prog.fullDay}</div>
                          </div>}
                        </div>
                        {/* Enroll button */}
                        <button onClick={() => jumpTo(7)}
                          className="w-full py-3 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5"
                          style={{ background:c.btn, boxShadow:`0 4px 12px ${c.btnShadow}`, fontFamily:"'Quicksand',sans-serif" }}>
                          Enroll in {prog.title} →
                        </button>
                      </div>
                    </div>
                  </div>
                </Slide>
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
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${aboutSlide * 100}%)`, height:"calc(100vh - 168px)" }}>
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
                    <p className="text-sm italic leading-relaxed" style={{ color:"#6B7A99" }}>&ldquo;{site.about.mission}&rdquo;</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border-l-4" style={{ borderColor:"#F5B829" }}>
                    <div className="text-2xl mb-2">🌟</div>
                    <div className="font-bold text-base mb-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Our Vision</div>
                    <p className="text-sm italic leading-relaxed" style={{ color:"#6B7A99" }}>&ldquo;{site.about.vision}&rdquo;</p>
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
          <div className="flex transition-transform duration-500" style={{ transform:`translateX(-${daySlide * 100}%)`, height:"calc(100vh - 168px)" }}>
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
                  <button onClick={() => jumpTo(7)} className="mt-4 font-bold px-6 py-2.5 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
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
                  <button onClick={() => jumpTo(7)} className="mt-4 font-bold px-6 py-2.5 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
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
                <button onClick={() => jumpTo(7)} className="w-full font-bold py-3 rounded-full text-white text-sm hover:-translate-y-0.5 transition-all"
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
                    <Link href={`/ai-tools?tool=${t.tool}`} className="text-xs font-bold" style={{ color:t.color }}>Try it now →</Link>
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
              <Link href="/ai-tools" className="flex-shrink-0 inline-flex items-center gap-2 font-bold px-6 py-2.5 rounded-full text-white transition-all hover:-translate-y-0.5"
                style={{ background:"#178F78", boxShadow:"0 5px 16px rgba(23,143,120,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                Open AI Tools <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          6. PARENT PORTAL
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[6] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("👨‍👩‍👧","Parent Portal","Everything for parents in one place")}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth:"none" }}>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {[
                { icon:"📸", title:"Class Photo Gallery",     tool:"Google Photos",    strip:"#BFDBFE", bg:"#EFF6FF",  tc:"#1E40AF", desc:"Daily photos & videos from teachers." },
                { icon:"📚", title:"Homework & Assignments",  tool:"Google Classroom", strip:"#99F6E4", bg:"#F0FDFA",  tc:"#0F766E", desc:"View, submit and track assignments." },
                { icon:"🎥", title:"Live Classes & Meetings", tool:"Google Meet",      strip:"#C4B5FD", bg:"#F5F3FF",  tc:"#6D28D9", desc:"Join parent-teacher meetings online." },
                { icon:"📋", title:"Digital Report Cards",    tool:"Google Drive",     strip:"#FDE68A", bg:"#FFFBEB",  tc:"#92400E", desc:"Download term reports as PDF anytime." },
              ].map(p => (
                <div key={p.title} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor:"#EDE8DF" }}>
                  <div className="h-1" style={{ background:p.strip }} />
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:p.bg }}>{p.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-0.5" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>{p.title}</div>
                      <div className="text-xs mb-1" style={{ color:"#6B7A99" }}>{p.desc}</div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background:p.bg, color:p.tc }}>{p.tool}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* WhatsApp CTA */}
            <div className="rounded-2xl p-4 flex items-center gap-4 border" style={{ background:"linear-gradient(135deg,rgba(37,211,102,0.08),rgba(37,211,102,0.15))", borderColor:"rgba(37,211,102,0.3)" }}>
              <div className="text-3xl">💬</div>
              <div className="flex-1">
                <div className="font-bold text-base mb-0.5" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Join Your Class WhatsApp Group</div>
                <div className="text-xs" style={{ color:"#6B7A99" }}>All updates, photos, homework reminders sent via WhatsApp — zero friction for parents.</div>
              </div>
              <a href={`https://wa.me/91${site.phone}?text=Hi! Please add me to my child's class WhatsApp group.`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 font-bold px-5 py-2.5 rounded-full text-white text-sm flex items-center gap-1.5"
                style={{ background:"#25D366", boxShadow:"0 4px 12px rgba(37,211,102,0.35)", fontFamily:"'Quicksand',sans-serif" }}>
                Message Us
              </a>
            </div>
            <Link href="/parent-portal" className="block text-center mt-3 text-sm font-bold hover:underline" style={{ color:"#178F78" }}>
              View Full Parent Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          7. CONTACT
      ══════════════════════════════════════════════ */}
      <div ref={el => { sectionRefs.current[7] = el; }}
        style={{ height:SH, scrollSnapAlign:"start", display:"flex", flexDirection:"column" }}>
        {secBand("✉️","Contact & Admissions","We reply within one business day")}
        <div className="flex-1 overflow-y-auto p-5" style={{ background:"#FEFCF8", scrollbarWidth:"none" }}>
          <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-5">
            {/* Form */}
            <div className="lg:col-span-3 bg-white rounded-2xl border p-5" style={{ borderColor:"#EDE8DF" }}>
              {formStatus === "success" ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <div className="font-bold text-xl mb-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Application Received!</div>
                  <p className="text-sm mb-4" style={{ color:"#6B7A99" }}>Our admissions team will call you within 1 business day.</p>
                  <button onClick={() => setFormStatus("idle")} className="font-bold px-6 py-2.5 rounded-full text-white text-sm"
                    style={{ background:"#E8694A" }}>Submit Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="font-bold text-lg mb-1" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>Online Admission Form</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Parent Name *</label>
                      <input required className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                        placeholder="Full name" value={form.parent} onChange={e => setForm(p=>({...p,parent:e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Phone *</label>
                      <input required type="tel" className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                        placeholder="WhatsApp number" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Child&apos;s Name *</label>
                      <input required className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                        placeholder="Child's name" value={form.child} onChange={e => setForm(p=>({...p,child:e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Date of Birth *</label>
                      <input required type="date" className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                        value={form.dob} onChange={e => setForm(p=>({...p,dob:e.target.value}))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Programme *</label>
                    <select required className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                      value={form.program} onChange={e => setForm(p=>({...p,program:e.target.value}))}>
                      <option value="">Select a programme</option>
                      {["Infant Care","Playgroup","Nursery","Junior KG","Senior KG","Full-Day Daycare","After-School Program","Holiday Camp"].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color:"#6B7A99" }}>Message</label>
                    <textarea rows={2} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:border-teal-400 transition-all resize-none" style={{ borderColor:"#EDE8DF", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif" }}
                      placeholder="Any questions or special requirements?" value={form.msg} onChange={e => setForm(p=>({...p,msg:e.target.value}))} />
                  </div>
                  <button type="submit" disabled={formStatus==="sending"}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background:"#E8694A", boxShadow:"0 5px 16px rgba(232,105,74,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
                    {formStatus==="sending"
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Submitting…</>
                      : <>📋 Submit Application</>}
                  </button>
                </form>
              )}
            </div>
            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-2xl p-4 text-white" style={{ background:"#178F78" }}>
                <div className="font-bold text-base mb-3" style={{ fontFamily:"'Fredoka',sans-serif" }}>Contact Info</div>
                <div className="space-y-2 text-xs mb-3" style={{ color:"rgba(255,255,255,0.8)" }}>
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0"/>{site.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0"/>{site.email}</div>
                  <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"/>1427, 13th Cross, Ananthnagar Phase 2, Electronic City, Bengaluru 560100</div>
                </div>
                <a href={`tel:${site.phone}`} className="block text-center font-bold py-2 rounded-full text-sm" style={{ background:"white", color:"#178F78", fontFamily:"'Quicksand',sans-serif" }}>
                  📞 Call Us Now
                </a>
              </div>
              <div className="rounded-2xl p-4 border" style={{ background:"#FAF0E8", borderColor:"#EDE8DF" }}>
                <div className="font-bold text-sm mb-2 flex items-center gap-2" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>
                  <Clock className="w-4 h-4"/> Opening Hours
                </div>
                <div className="text-xs space-y-1" style={{ color:"#6B7A99" }}>
                  <div className="flex justify-between"><span>Monday – Friday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{site.hours.weekdays}</span></div>
                  <div className="flex justify-between"><span>Saturday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{site.hours.saturday}</span></div>
                  <div className="flex justify-between"><span>Sunday</span><span className="font-semibold" style={{ color:"#1A2F4A" }}>{site.hours.sunday}</span></div>
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
