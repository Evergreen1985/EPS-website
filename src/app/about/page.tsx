import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Evergreen Preschool & Daycare — our story, mission, values, team and facilities in Electronic City, Bengaluru.",
};

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#74C69D" }}>About Us</p>
          <h1 className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Our Story
          </h1>
          <p className="text-white/65 text-lg leading-relaxed">
            {site.about.story}
          </p>
        </div>
      </div>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="rounded-3xl p-8 border border-stone-100" style={{ background: "var(--leaf)" }}>
              <div className="text-2xl mb-4">🎯</div>
              <h2 className="text-2xl font-normal mb-4" style={{ fontFamily: "var(--font-display)" }}>Our Mission</h2>
              <p className="text-stone-600 leading-relaxed text-base italic border-l-4 pl-4" style={{ borderColor: "var(--forest)" }}>
                &ldquo;{site.about.mission}&rdquo;
              </p>
            </div>
            <div className="rounded-3xl p-8 border border-stone-100" style={{ background: "var(--amber2)" }}>
              <div className="text-2xl mb-4">🌟</div>
              <h2 className="text-2xl font-normal mb-4" style={{ fontFamily: "var(--font-display)" }}>Our Vision</h2>
              <p className="text-stone-600 leading-relaxed text-base italic border-l-4 pl-4" style={{ borderColor: "var(--amber)" }}>
                &ldquo;{site.about.vision}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Our Core Values</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🧒", title: "Child-Centred", desc: "We place children at the heart of everything, respecting their individuality and unique journey." },
              { icon: "📖", title: "Excellence", desc: "High-quality educational experiences through innovative teaching and comprehensive curriculum." },
              { icon: "🤝", title: "Family Partnership", desc: "Working closely with families to ensure consistent support at home and at school." },
              { icon: "🌍", title: "Inclusion", desc: "Celebrating diversity and creating an inclusive environment where every child feels valued." },
            ].map((v) => (
              <div key={v.title} className="card text-center">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{v.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Meet Our Team</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
            <p className="section-sub text-center mt-4 mx-auto">
              Dedicated, qualified educators passionate about early childhood education.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {site.about.team.map((member) => (
              <div key={member.name} className="card text-center">
                <div
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-semibold text-white"
                  style={{ background: "var(--forest)" }}
                >
                  {member.initials}
                </div>
                <h3 className="text-lg font-normal mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {member.name}
                </h3>
                <p className="text-sm font-semibold mb-3" style={{ color: "var(--forest2)" }}>
                  {member.role}
                </p>
                <p className="text-sm text-stone-500">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="py-20" style={{ background: "var(--leaf)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Our Facilities</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🏫", title: "Modern Classrooms", desc: "Spacious, well-lit classrooms with age-appropriate learning materials and resources." },
              { icon: "⛹️", title: "Outdoor Playground", desc: "Safe and engaging play area designed to promote physical development and exploration." },
              { icon: "🎨", title: "Activity Room", desc: "Dedicated space for arts, crafts, music and creative expression." },
              { icon: "🛏️", title: "Rest Area", desc: "Comfortable, quiet space for children to rest and recharge during the day." },
            ].map((f) => (
              <div key={f.title} className="card bg-white">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Experience the Evergreen Difference
          </h2>
          <p className="text-white/65 mb-8">Schedule a visit to our campus and see our facilities firsthand.</p>
          <Link href="/contact" className="btn-amber">
            Contact Us Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
