import Link from "next/link";
import { ArrowRight } from "lucide-react";

const events = [
  { month: "Jan", day: "15", title: "Annual Day & Prize Distribution",        cat: "Event",    time: "10:00 AM", desc: "A celebration of our children's achievements with performances, prizes and proud parents!" },
  { month: "Jan", day: "26", title: "Republic Day Celebration",               cat: "Festival", time: "9:00 AM",  desc: "Patriotic songs, flag hoisting and fun activities to celebrate our nation." },
  { month: "Feb", day: "14", title: "Parent-Teacher Meeting — Playgroup & Nursery", cat: "Meeting",  time: "10:00 AM", desc: "Connect with your child's teacher and discuss progress, milestones and next steps." },
  { month: "Mar", day: "20", title: "Holi Colours Celebration",               cat: "Festival", time: "10:00 AM", desc: "A joyful, safe colour festival with natural colours, music and dancing." },
  { month: "Apr", day: "5",  title: "Science Exhibition & Fair",              cat: "Event",    time: "11:00 AM", desc: "Young scientists present their projects — from volcanoes to rainbows!" },
  { month: "Apr", day: "22", title: "Earth Day — Garden Activity",            cat: "Workshop", time: "9:30 AM",  desc: "Children plant seeds, learn about nature and take home their own little plant." },
];

const catColors: Record<string, { bg: string; color: string }> = {
  Event:    { bg: "rgba(232,105,74,0.1)",  color: "#E8694A" },
  Festival: { bg: "rgba(245,184,41,0.15)", color: "#9A6600" },
  Meeting:  { bg: "rgba(23,143,120,0.1)",  color: "#178F78" },
  Workshop: { bg: "rgba(137,87,229,0.1)",  color: "#8957E5" },
};

const portals = [
  { icon: "👨‍👩‍👧", title: "For Parents",    desc: "Access resources, view curriculum updates, track your child's progress, and communicate with teachers.", cta: "Parent Portal",   href: "#", bg: "#EFF6FF", color: "#1E3A8A" },
  { icon: "👩‍🏫", title: "For Teachers",   desc: "Access teaching resources, lesson plans, professional development opportunities and classroom tools.",   cta: "Teacher Hub",    href: "#", bg: "#F0FDF4", color: "#14532D" },
  { icon: "🧒",   title: "For Students",   desc: "Interactive learning activities, educational games, and resources to support learning at home.",           cta: "Student Corner", href: "#", bg: "#FEFCE8", color: "#78350F" },
  { icon: "🏫",   title: "For Admins",     desc: "School management tools, administrative resources, operational guidelines and reporting dashboards.",     cta: "Admin Login",    href: "#", bg: "#FDF2F8", color: "#9D174D" },
  { icon: "💼",   title: "Consultants",    desc: "Partnership opportunities, curriculum collaboration, professional networking and consultancy resources.",  cta: "Consultant Hub", href: "#", bg: "#F0FDFA", color: "#134E4A" },
];

export default function CommunityPage() {
  return (
    <div className="pb-24" style={{ fontFamily: "'Quicksand', sans-serif" }}>

      {/* Hero */}
      <div className="py-16 md:py-24 border-b" style={{ background: "rgba(245,184,41,0.12)", borderColor: "rgba(245,184,41,0.2)" }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-5" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Our Community
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto">
            Evergreen is more than a school — it&apos;s a community. Resources and portals for every member of our family.
          </p>
        </div>
      </div>

      {/* Events */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <p className="font-bold tracking-wider uppercase text-sm mb-2" style={{ color: "#F5B829" }}>What&apos;s Happening</p>
              <h2 className="text-4xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                Upcoming Events
              </h2>
            </div>
          </div>
          <div className="space-y-5">
            {events.map((ev, i) => {
              const c = catColors[ev.cat] ?? catColors.Event;
              return (
                <div key={i}
                  className="bg-white border border-stone-100 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group">
                  {/* Date box */}
                  <div className="rounded-2xl p-4 text-center shrink-0 w-24 h-24 flex flex-col justify-center border transition-colors group-hover:text-white"
                    style={{ background: c.bg, borderColor: c.color + "40", color: c.color }}>
                    <span className="text-xs font-bold uppercase tracking-wider">{ev.month}</span>
                    <span className="text-4xl font-bold leading-none" style={{ fontFamily: "'Fredoka', sans-serif" }}>{ev.day}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1">
                    <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2"
                      style={{ background: c.bg, color: c.color }}>
                      {ev.cat}
                    </span>
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                      {ev.title}
                    </h3>
                    <p className="text-stone-500 text-sm mb-3">{ev.desc}</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-stone-600">
                      🕐 {ev.time} &nbsp;·&nbsp; 📍 EVERGREEN Campus
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Portals */}
      <section className="py-20" style={{ background: "#FAF0E8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
              Community Portals
            </h2>
            <p className="text-stone-500">Resources for every member of our school community.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((p, i) => (
              <div key={i} className="bg-white rounded-3xl border border-stone-100 p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5" style={{ background: p.bg }}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>{p.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed mb-5">{p.desc}</p>
                <Link href={p.href}
                  className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5"
                  style={{ background: p.bg, color: p.color }}>
                  {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 text-center px-4">
        <div className="max-w-xl mx-auto">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>Stay Updated</h2>
          <p className="text-stone-500 mb-7">Get school updates, event notifications and parenting tips in your inbox.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input type="email" placeholder="Your email address"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-5 py-3 text-sm focus:outline-none focus:border-teal-400 transition-all" />
            <button className="text-white font-bold px-6 py-3 rounded-full transition-all hover:-translate-y-0.5 shrink-0"
              style={{ background: "#E8694A", boxShadow: "0 6px 20px rgba(232,105,74,0.3)" }}>
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#178F78" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Join the Evergreen Community
          </h2>
          <p className="text-white/70 mb-7">Enrol your child and become part of our growing family.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-stone-900 transition-all hover:-translate-y-0.5"
            style={{ background: "#F5B829", boxShadow: "0 8px 24px rgba(245,184,41,0.35)" }}>
            Enrol Now →
          </Link>
        </div>
      </section>
    </div>
  );
}
