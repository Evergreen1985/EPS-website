import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Clock, Users } from "lucide-react";
import programs from "@/content/programs.json";

const progImages: Record<string, string> = {
  infant:      "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",
  playgroup:   "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
  nursery:     "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop",
  jrkg:        "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",
  srkg:        "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",
  daycare:     "https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=800&auto=format&fit=crop",
  afterschool: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",
  holidaycamp: "https://images.unsplash.com/photo-1536337005238-94b997371b40?q=80&w=800&auto=format&fit=crop",
};

const progColors: Record<string, { icon: string; badge: string; badgeText: string; btn: string }> = {
  pink:   { icon: "#BE185D", badge: "rgba(236,72,153,0.1)",  badgeText: "#BE185D", btn: "#BE185D" },
  orange: { icon: "#E8694A", badge: "rgba(232,105,74,0.1)",  badgeText: "#E8694A", btn: "#E8694A" },
  yellow: { icon: "#B08000", badge: "rgba(245,184,41,0.15)", badgeText: "#B08000", btn: "#B08000" },
  green:  { icon: "#178F78", badge: "rgba(23,143,120,0.1)",  badgeText: "#178F78", btn: "#178F78" },
  blue:   { icon: "#1E40AF", badge: "rgba(59,130,246,0.1)",  badgeText: "#1E40AF", btn: "#1E40AF" },
  teal:   { icon: "#0F766E", badge: "rgba(20,184,166,0.1)",  badgeText: "#0F766E", btn: "#0F766E" },
  amber:  { icon: "#92400E", badge: "rgba(245,158,11,0.12)", badgeText: "#92400E", btn: "#92400E" },
};

const coreProg  = ["infant","playgroup","nursery","jrkg","srkg"];
const extraProg = ["daycare","afterschool","holidaycamp"];

export default function ProgramsPage() {
  const core  = programs.filter(p => coreProg.includes(p.id));
  const extra = programs.filter(p => extraProg.includes(p.id));

  return (
    <div className="pb-24" style={{ fontFamily: "'Quicksand', sans-serif" }}>

      {/* Hero */}
      <div className="py-16 md:py-24 border-b border-stone-100" style={{ background: "#FAF0E8" }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-5" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Our Programs
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto">
            From infant care to kindergarten readiness — age-appropriate learning that builds confident, curious children.
          </p>
        </div>
      </div>

      {/* Core Preschool Programs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {core.map((prog, index) => {
          const c = progColors[prog.color] ?? progColors.green;
          const img = progImages[prog.id] ?? progImages.playgroup;
          const isEven = index % 2 === 0;
          return (
            <div key={prog.id} id={prog.id}
              className={`flex flex-col lg:flex-row gap-12 items-center ${!isEven ? "lg:flex-row-reverse" : ""}`}>
              {/* Image */}
              <div className="w-full lg:w-1/2 relative">
                <div className="absolute inset-0 rounded-3xl translate-x-3 translate-y-3 -z-10 opacity-20"
                  style={{ background: c.icon }} />
                <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
                  <Image src={img} alt={prog.title} fill className="object-cover" />
                </div>
                {/* Floating badge */}
                <div className={`absolute -bottom-5 ${isEven ? "-right-5" : "-left-5"} bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3`}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
                    style={{ background: c.icon }}>
                    {prog.icon}
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide">Ages</p>
                    <p className="font-bold text-stone-800">{prog.ageRange}</p>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="w-full lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4 border"
                  style={{ background: c.badge, color: c.badgeText, borderColor: c.icon + "30" }}>
                  <Clock className="w-4 h-4" />
                  Ratio {prog.ratio}
                </div>
                <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                  {prog.title}
                </h2>
                <p className="text-lg text-stone-500 mb-6 leading-relaxed">{prog.description}</p>
                {prog.halfDay && (
                  <p className="text-sm text-stone-400 mb-6">
                    <span className="font-semibold text-stone-600">Half-day:</span> {prog.halfDay} &nbsp;·&nbsp;
                    <span className="font-semibold text-stone-600">Full-day:</span> {prog.fullDay}
                  </p>
                )}
                <ul className="space-y-3 mb-8">
                  {prog.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: c.icon }} />
                      <span className="text-stone-600 font-medium">{h}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/contact"
                  className="inline-flex items-center justify-center gap-2 font-bold px-7 py-3.5 rounded-xl text-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
                  style={{ background: c.btn, boxShadow: `0 6px 20px ${c.btn}40` }}>
                  Enroll in {prog.title} →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daycare & Extra Programs */}
      <section className="py-20" style={{ background: "#FAF0E8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-bold tracking-wider uppercase text-sm mb-2" style={{ color: "#E8694A" }}>Extended Care</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
              Daycare & Enrichment
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {extra.map(prog => {
              const c = progColors[prog.color] ?? progColors.teal;
              const img = progImages[prog.id] ?? progImages.daycare;
              return (
                <div key={prog.id} id={prog.id}
                  className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="relative h-48 overflow-hidden">
                    <Image src={img} alt={prog.title} fill className="object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-7">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{prog.icon}</span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: c.badge, color: c.badgeText }}>
                        {prog.ageRange}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>{prog.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed mb-4">{prog.description}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mb-5">
                      <Users className="w-3.5 h-3.5" /> {prog.ratio} ratio
                      <span className="mx-1">·</span>
                      <Clock className="w-3.5 h-3.5" /> {prog.fullDay}
                    </div>
                    <Link href="/contact"
                      className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-white transition-all hover:-translate-y-0.5 text-sm"
                      style={{ background: c.btn }}>
                      Enquire Now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#178F78" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Ready to Enrol Your Child?
          </h2>
          <p className="text-white/70 mb-7">Contact us to schedule a visit or learn more about our programmes.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-stone-900 transition-all hover:-translate-y-0.5"
            style={{ background: "#F5B829", boxShadow: "0 8px 24px rgba(245,184,41,0.35)" }}>
            Get in Touch →
          </Link>
        </div>
      </section>
    </div>
  );
}
