import Link from "next/link";
import Image from "next/image";
import GoogleReviews from "@/components/GoogleReviews";
import HeroPill from "@/components/HeroPill";
import { ArrowRight, Heart, Shield, CheckCircle2 } from "lucide-react";
import site from "@/content/site.json";
import programs from "@/content/programs.json";

const programIcons: Record<string, string> = {
  infant: "🍼", playgroup: "🎈", nursery: "🌸", jrkg: "📚", srkg: "🎓",
  daycare: "🏡", afterschool: "🚌", holidaycamp: "⛺",
};
const programColors: Record<string, { icon: string; bg: string }> = {
  pink:   { icon: "#BE185D", bg: "rgba(236,72,153,0.1)" },
  orange: { icon: "#E8694A", bg: "rgba(232,105,74,0.1)" },
  yellow: { icon: "#B08000", bg: "rgba(245,184,41,0.12)" },
  green:  { icon: "#178F78", bg: "rgba(23,143,120,0.1)" },
  blue:   { icon: "#1E40AF", bg: "rgba(59,130,246,0.1)" },
  teal:   { icon: "#0F766E", bg: "rgba(20,184,166,0.1)" },
  amber:  { icon: "#92400E", bg: "rgba(245,158,11,0.12)" },
};

export default function HomePage() {
  const allPrograms = programs.filter(p =>
    ["infant","playgroup","nursery","jrkg","srkg"].includes(p.id)
  );
  const extraPrograms = programs.filter(p =>
    ["daycare","afterschool","holidaycamp"].includes(p.id)
  );

  return (
    <div className="flex flex-col pb-20" style={{ fontFamily: "'Quicksand', sans-serif" }}>

      {/* ── HERO — compact, fits on one screen ── */}
      <section id="home" className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-teal-50" />
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(43,96%,58%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(11,80%,75%) 0%, transparent 50%)" }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <HeroPill />
              <h1 className="text-4xl lg:text-6xl font-display font-bold text-secondary leading-tight mb-4">
                Where Little Minds{" "}
                <span className="text-primary relative inline-block">
                  Grow Big Dreams
                  <svg className="absolute w-full h-2.5 -bottom-1 left-0 text-accent opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed max-w-lg">
                A warm and nurturing environment in Electronic City, Bengaluru, where play-based learning sparks curiosity, creativity, and lifelong friendships.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/admissions"
                  className="bg-primary text-white font-bold px-7 py-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  Enroll Your Child <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/about"
                  className="bg-white text-secondary font-bold px-7 py-3 rounded-full shadow-md border border-border hover:bg-muted/50 hover:-translate-y-0.5 transition-all">
                  Learn More
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                <div>
                  <div className="text-2xl font-bold text-secondary" style={{ fontFamily: "'Fredoka', sans-serif" }}>1000+</div>
                  <div className="text-xs text-muted-foreground">Happy Families</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary" style={{ fontFamily: "'Fredoka', sans-serif" }}>1:4</div>
                  <div className="text-xs text-muted-foreground">Best Ratio</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary" style={{ fontFamily: "'Fredoka', sans-serif" }}>4.9★</div>
                  <div className="text-xs text-muted-foreground">Google Rating</div>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <Image
                  src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80"
                  alt="Happy children at Evergreen Preschool"
                  fill priority
                  className="blob-shape object-cover shadow-2xl border-8 border-white"
                />
                <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 float-badge">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-accent fill-accent" />
                  </div>
                  <p className="font-bold text-secondary text-sm leading-tight">Loving<br/>Environment</p>
                </div>
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 float-badge-2">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-bold text-secondary text-sm leading-tight">Safe &<br/>Secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="block w-full h-12 text-background fill-current">
            <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ── PROGRAMS — visible right after hero ── */}
      <section id="programs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-primary font-bold tracking-wider uppercase text-xs mb-2">Our Curriculum</p>
          <h2 className="text-3xl font-display font-bold text-secondary mb-3">Programs for Every Age</h2>
          <p className="text-muted-foreground text-sm">From Infant Care to Senior KG — tailored learning at every stage.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {allPrograms.map((prog) => {
            const c = programColors[prog.color] ?? programColors.green;
            return (
              <Link key={prog.id} href="/programs"
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all text-center group">
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 text-3xl group-hover:scale-110 transition-transform"
                  style={{ background: c.bg }}>
                  {programIcons[prog.id]}
                </div>
                <div className="font-bold text-sm text-foreground mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>{prog.title}</div>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block">{prog.ageRange}</div>
              </Link>
            );
          })}
        </div>
        {/* Daycare extras inline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {extraPrograms.map((prog) => {
            const c = programColors[prog.color] ?? programColors.teal;
            return (
              <Link key={prog.id} href="/daycare"
                className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: c.bg }}>
                  {programIcons[prog.id]}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>{prog.title}</div>
                  <div className="text-xs text-muted-foreground">{prog.ageRange}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── WHY EVERGREEN ── */}
      <section id="why" className="bg-muted/30 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-primary font-bold tracking-wider uppercase text-xs mb-2">Why Choose Us</p>
            <h2 className="text-3xl font-display font-bold text-secondary">More Than Just a School</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🎓", title: "Quality Education",    desc: "Age-appropriate curriculum fostering holistic development." },
              { icon: "❤️", title: "Caring Environment",   desc: "Dedicated staff committed to a nurturing atmosphere." },
              { icon: "🛡️", title: "Safe Facilities",      desc: "CCTV, controlled access and modern safety measures." },
              { icon: "👥", title: "Small Class Sizes",    desc: "Low ratios ensuring personalised attention." },
            ].map((v) => (
              <div key={v.title} className="bg-card p-6 rounded-3xl shadow-sm border border-border text-center hover:-translate-y-2 transition-transform">
                <div className="text-4xl mb-4">{v.icon}</div>
                <h4 className="font-display font-bold text-lg text-foreground mb-2">{v.title}</h4>
                <p className="text-muted-foreground text-xs">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE GOOGLE REVIEWS ── */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-accent font-bold tracking-wider uppercase text-xs mb-2">Parent Reviews</p>
          <h2 className="text-3xl font-display font-bold text-secondary mb-3">Loved by Families</h2>
          <p className="text-muted-foreground text-sm">Real reviews from Google — updated automatically</p>
        </div>
        <GoogleReviews />
      </section>

      {/* ── COMMUNITY ── */}
      <section id="community" className="bg-secondary text-secondary-foreground py-14 relative overflow-hidden rounded-t-[2rem] lg:rounded-t-[3rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <p className="text-accent font-bold tracking-wider uppercase text-xs mb-2">Community</p>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Our Community</h2>
              <p className="text-secondary-foreground/80 text-sm">Resources for parents, teachers, students and administrators.</p>
            </div>
            <Link href="/admissions" className="bg-white text-secondary font-bold px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors shrink-0 text-sm">
              Enroll Now
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: "👨‍👩‍👧", title: "For Parents",   cta: "Parent Portal",   href: "/parent-portal" },
              { icon: "👩‍🏫", title: "For Teachers",  cta: "Resources",       href: "/contact" },
              { icon: "🧒",   title: "For Students",  cta: "Student Corner",  href: "/ai-tools" },
              { icon: "🏫",   title: "For Admins",    cta: "Admin Login",     href: "/contact" },
              { icon: "💼",   title: "Consultants",   cta: "Hub",             href: "/contact" },
            ].map((s) => (
              <Link key={s.title} href={s.href}
                className="bg-white/10 border border-white/20 p-4 rounded-2xl text-center hover:bg-white/20 transition-colors">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-bold text-white text-sm mb-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>{s.title}</div>
                <span className="text-xs text-secondary-foreground/60 bg-white/10 px-2 py-0.5 rounded-full">{s.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 text-center py-10">
        <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-3xl p-10 border border-border">
          <h2 className="text-3xl font-display font-bold text-secondary mb-3">Give Your Child the Best Start in Life</h2>
          <p className="text-muted-foreground mb-6">Enrol now for the upcoming academic year · Limited seats available</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/admissions"
              className="bg-primary text-white font-bold px-7 py-3.5 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
              Contact Us Today <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={`tel:${site.phone}`}
              className="bg-white text-secondary font-bold px-7 py-3.5 rounded-full shadow-md border border-border hover:bg-muted/50 hover:-translate-y-1 transition-all">
              📞 {site.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
