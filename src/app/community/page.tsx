import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Community",
  description: "Resources for parents, teachers, students, administrators and educational consultants at Evergreen Preschool.",
};

const stakeholders = [
  {
    icon: "👨‍👩‍👧",
    title: "For Parents",
    color: "#EFF6FF",
    accent: "#1E3A8A",
    description: "Access resources, view curriculum updates, track your child's progress, and communicate with teachers through the Parent Portal.",
    features: ["Child progress tracking", "Teacher communication", "Curriculum updates", "Event calendar"],
    cta: "Parent Portal",
    href: "/login",
  },
  {
    icon: "👩‍🏫",
    title: "For Teachers",
    color: "#F0FDF4",
    accent: "#14532D",
    description: "Access teaching resources, lesson plans, professional development opportunities, and classroom management tools.",
    features: ["Lesson plan library", "Professional development", "Classroom tools", "Assessment resources"],
    cta: "Teacher Resources",
    href: "#",
  },
  {
    icon: "🧒",
    title: "For Students",
    color: "#FEFCE8",
    accent: "#78350F",
    description: "Interactive learning activities, educational games, and resources to support learning at home and reinforce classroom lessons.",
    features: ["Learning activities", "Educational games", "Story corner", "Creative projects"],
    cta: "Student Corner",
    href: "#",
  },
  {
    icon: "🏫",
    title: "For Administrators",
    color: "#FDF2F8",
    accent: "#9D174D",
    description: "School management tools, administrative resources, operational guidelines, and reporting dashboards.",
    features: ["Enrollment management", "Staff directory", "Operational reports", "Compliance tools"],
    cta: "Admin Login",
    href: "#",
  },
  {
    icon: "💼",
    title: "For Educational Consultants",
    color: "#F0FDFA",
    accent: "#134E4A",
    description: "Partnership opportunities, curriculum collaboration, professional networking, and consultancy resources.",
    features: ["Curriculum partnerships", "Collaboration tools", "Professional network", "Resource sharing"],
    cta: "Consultant Hub",
    href: "#",
  },
];

const events = [
  { date: "15 Jan", title: "Annual Day & Prize Distribution", type: "Event" },
  { date: "26 Jan", title: "Republic Day Celebration", type: "Festival" },
  { date: "14 Feb", title: "Parent-Teacher Meeting — Playgroup & Nursery", type: "Meeting" },
  { date: "20 Mar", title: "Holi Colours Celebration", type: "Festival" },
  { date: "5 Apr", title: "Science Exhibition & Fair", type: "Event" },
  { date: "22 Apr", title: "Earth Day — Garden Activity", type: "Workshop" },
];

export default function CommunityPage() {
  return (
    <>
      {/* Header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#74C69D" }}>
            Our Community
          </p>
          <h1 className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Built for Everyone
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">
            Evergreen is more than a school — it&apos;s a community. Resources and portals for every member of our family.
          </p>
        </div>
      </div>

      {/* Stakeholder cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title mb-2">Community Portals</h2>
            <div className="w-10 h-0.5 rounded-full mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stakeholders.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-stone-100 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-2" style={{ background: s.accent + "40" }} />
                <div className="p-7">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
                    style={{ background: s.color }}
                  >
                    {s.icon}
                  </div>
                  <h3 className="text-xl font-normal mb-3" style={{ fontFamily: "var(--font-display)" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed mb-5">{s.description}</p>
                  <ul className="space-y-1.5 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-stone-600">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={s.href}
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-5 py-2.5 transition-all hover:-translate-y-0.5"
                    style={{ background: s.color, color: s.accent }}
                  >
                    {s.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="section-title mb-2">Upcoming Events</h2>
            <div className="w-10 h-0.5 rounded-full mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="space-y-3">
            {events.map((ev, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 px-6 py-4 flex items-center gap-5 hover:shadow-sm transition-shadow">
                <div
                  className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 text-white"
                  style={{ background: "var(--forest)" }}
                >
                  <span className="text-xs">{ev.date.split(" ")[1]}</span>
                  <span className="text-sm font-bold leading-none">{ev.date.split(" ")[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-stone-900 text-sm">{ev.title}</div>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                  style={{ background: "var(--leaf)", color: "var(--forest)" }}
                >
                  {ev.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="section-title mb-4">Stay Updated</h2>
          <p className="text-stone-500 mb-8">
            Subscribe to our newsletter to get school updates, event notifications, and parenting tips delivered to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm focus:outline-none focus:border-stone-400 focus:bg-white transition-all"
            />
            <button className="btn-primary shrink-0">Subscribe</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Join the Evergreen Community
          </h2>
          <p className="text-white/65 mb-8">Enrol your child and become part of our growing family.</p>
          <Link href="/contact" className="btn-amber">
            Enrol Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
