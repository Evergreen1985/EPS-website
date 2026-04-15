import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Users, CheckCircle2 } from "lucide-react";
import programs from "@/content/programs.json";

export const metadata: Metadata = {
  title: "Programs",
  description: "Playgroup, Nursery, Jr. KG, Sr. KG, Daycare, After-School and Holiday Camp programmes at Evergreen Preschool, Electronic City Bengaluru.",
};

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  pink:   { bg: "#FDF2F8", text: "#9D174D", border: "#FBCFE8", badge: "#FCE7F3" },
  orange: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA", badge: "#FFEDD5" },
  yellow: { bg: "#FEFCE8", text: "#854D0E", border: "#FEF08A", badge: "#FEF9C3" },
  green:  { bg: "#F0FDF4", text: "#14532D", border: "#BBF7D0", badge: "#DCFCE7" },
  blue:   { bg: "#EFF6FF", text: "#1E3A8A", border: "#BFDBFE", badge: "#DBEAFE" },
  teal:   { bg: "#F0FDFA", text: "#134E4A", border: "#99F6E4", badge: "#CCFBF1" },
  amber:  { bg: "#FFFBEB", text: "#78350F", border: "#FDE68A", badge: "#FEF3C7" },
};

export default function ProgramsPage() {
  const core = programs.filter((p) => ["playgroup","nursery","jrkg","srkg"].includes(p.id));
  const daycare = programs.filter((p) => ["daycare","afterschool","holidaycamp"].includes(p.id));

  return (
    <>
      {/* Page header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--forest4, #74C69D)" }}>
            Our Programs
          </p>
          <h1
            className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Early Childhood Education Programs
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">
            Age-appropriate programmes designed to nurture young minds and prepare children for future academic success. Each level builds on the last.
          </p>
        </div>
      </div>

      {/* Curriculum approach note */}
      <section className="py-10 bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-stone-600 text-base leading-relaxed">
            Our curriculum balances structured learning with play-based activities to develop cognitive, social, emotional, and physical skills. Experienced educators create a supportive environment where every child can explore, discover, and grow at their own pace.
          </p>
        </div>
      </section>

      {/* Core programmes */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="section-title mb-2">Preschool Programmes</h2>
            <div className="w-10 h-0.5 rounded-full mt-3" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {core.map((prog) => {
              const c = colorMap[prog.color] ?? colorMap.green;
              return (
                <div
                  key={prog.id}
                  id={prog.id}
                  className="rounded-3xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
                  style={{ borderColor: c.border, background: "white" }}
                >
                  {/* Colour strip top */}
                  <div className="h-2" style={{ background: c.border }} />

                  <div className="p-8">
                    <div className="flex items-start justify-between mb-5">
                      <div className="text-4xl">{prog.icon}</div>
                      <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: c.badge, color: c.text }}
                      >
                        {prog.ageRange}
                      </span>
                    </div>

                    <h2 className="text-2xl font-normal mb-3" style={{ fontFamily: "var(--font-display)", color: "#1a1a1a" }}>
                      {prog.title}
                    </h2>
                    <p className="text-stone-600 text-sm leading-relaxed mb-6">{prog.description}</p>

                    {/* Meta pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-full px-3 py-1.5 text-xs text-stone-600">
                        <Users className="w-3.5 h-3.5" />
                        Ratio {prog.ratio}
                      </div>
                      {prog.halfDay && (
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-full px-3 py-1.5 text-xs text-stone-600">
                          <Clock className="w-3.5 h-3.5" />
                          Half-day: {prog.halfDay}
                        </div>
                      )}
                      {prog.fullDay && (
                        <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-100 rounded-full px-3 py-1.5 text-xs text-stone-600">
                          <Clock className="w-3.5 h-3.5" />
                          Full-day: {prog.fullDay}
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-stone-700 mb-3">Programme Highlights</h4>
                    <ul className="grid grid-cols-1 gap-2 mb-6">
                      {prog.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-stone-600">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--forest2)" }} />
                          {h}
                        </li>
                      ))}
                    </ul>

                    <Link href="/contact" className="btn-primary w-full justify-center">
                      Enroll Now <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum approach */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Our Curriculum Approach</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🧠", title: "Cognitive Development", desc: "Activities that stimulate thinking, problem-solving, and concept formation." },
              { icon: "💬", title: "Language & Literacy", desc: "Rich language experiences to develop communication skills and early literacy." },
              { icon: "🔢", title: "Numeracy", desc: "Hands-on activities to build mathematical understanding and number sense." },
              { icon: "🎨", title: "Creative Arts", desc: "Opportunities for self-expression through art, music, dance, and drama." },
              { icon: "🏃", title: "Physical Development", desc: "Activities to develop gross and fine motor skills, coordination, and strength." },
              { icon: "🤝", title: "Social-Emotional Learning", desc: "Experiences that foster positive relationships and emotional intelligence." },
            ].map((item) => (
              <div key={item.title} className="card">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daycare & extra programmes */}
      <section className="py-20" style={{ background: "var(--leaf)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="section-title mb-2">Daycare & Enrichment</h2>
            <div className="w-10 h-0.5 rounded-full mt-3" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {daycare.map((prog) => {
              const c = colorMap[prog.color] ?? colorMap.teal;
              return (
                <div
                  key={prog.id}
                  id={prog.id}
                  className="rounded-2xl bg-white border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: c.border }}
                >
                  <div className="h-1.5" style={{ background: c.border }} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{prog.icon}</div>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: c.badge, color: c.text }}
                      >
                        {prog.ageRange}
                      </span>
                    </div>
                    <h3 className="text-lg font-normal mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      {prog.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed mb-4">{prog.description}</p>
                    <div className="text-xs text-stone-400 mb-4">
                      <span className="font-semibold text-stone-600">Hours: </span>{prog.fullDay}
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {prog.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex items-start gap-2 text-xs text-stone-600">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--forest2)" }} />
                          {h}
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="btn-primary w-full justify-center text-xs py-2.5">
                      Enquire Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Enrol Your Child?
          </h2>
          <p className="text-white/65 mb-8">Contact us to schedule a visit or learn more about our programmes.</p>
          <Link href="/contact" className="btn-amber">
            Get in Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
