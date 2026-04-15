import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Heart, Shield, BookOpen, Users, GraduationCap, CheckCircle2, Clock } from "lucide-react";
import site from "@/content/site.json";
import programs from "@/content/programs.json";
import testimonials from "@/content/testimonials.json";

const programIcons: Record<string, string> = {
  playgroup: "🎈", nursery: "🌸", jrkg: "📚", srkg: "🎓",
  daycare: "🏡", afterschool: "🚌", holidaycamp: "⛺",
};
const programColors: Record<string, { icon: string; bg: string; border: string }> = {
  pink:   { icon: "text-primary",   bg: "bg-primary/10",   border: "border-primary/20" },
  orange: { icon: "text-accent",    bg: "bg-accent/10",    border: "border-accent/20" },
  yellow: { icon: "text-yellow-500",bg: "bg-yellow-50",    border: "border-yellow-200" },
  green:  { icon: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
  blue:   { icon: "text-blue-500",  bg: "bg-blue-50",      border: "border-blue-200" },
  teal:   { icon: "text-teal-600",  bg: "bg-teal-50",      border: "border-teal-200" },
  amber:  { icon: "text-amber-500", bg: "bg-amber-50",     border: "border-amber-200" },
};

export default function HomePage() {
  const corePrograms = programs.filter((p) => ["playgroup","nursery","jrkg","srkg"].includes(p.id));

  return (
    <div className="flex flex-col gap-20 pb-20">

      {/* ── HERO ── */}
      <section className="relative pt-12 pb-32 lg:pt-24 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-teal-50" />
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(43,96%,58%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(11,80%,75%) 0%, transparent 50%)" }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-secondary font-bold text-sm mb-6 border border-accent/30">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span>Now Enrolling — {site.rating.score}★ on Google ({site.rating.count} reviews)</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold text-secondary leading-tight mb-6">
                Where Little Minds{" "}
                <span className="text-primary relative inline-block">
                  Grow Big Dreams
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent opacity-70" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="3" fill="transparent" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Welcome to EVERGREEN — a warm and nurturing environment in Electronic City, Bengaluru, where play-based learning sparks curiosity, creativity, and lifelong friendships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/contact"
                  className="bg-primary text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all text-center flex items-center justify-center gap-2">
                  Enroll Your Child <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/about"
                  className="bg-white text-secondary font-bold text-lg px-8 py-4 rounded-full shadow-md border border-border hover:bg-muted/50 hover:-translate-y-1 transition-all text-center">
                  Learn More
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
                <div>
                  <h4 className="font-display font-bold text-3xl text-secondary">123+</h4>
                  <p className="text-sm text-muted-foreground font-medium">Happy Families</p>
                </div>
                <div>
                  <h4 className="font-display font-bold text-3xl text-secondary">1:4</h4>
                  <p className="text-sm text-muted-foreground font-medium">Best Ratio</p>
                </div>
                <div>
                  <h4 className="font-display font-bold text-3xl text-secondary">4.8★</h4>
                  <p className="text-sm text-muted-foreground font-medium">Google Rating</p>
                </div>
              </div>
            </div>

            {/* Right: blob image */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                <Image
                  src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80"
                  alt="Happy children at Evergreen Preschool"
                  fill priority
                  className="blob-shape object-cover shadow-2xl border-8 border-white"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 float-badge">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-accent fill-accent" />
                  </div>
                  <p className="font-bold text-secondary leading-tight">Loving<br/>Environment</p>
                </div>
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 float-badge-2">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-bold text-secondary leading-tight">Safe &<br/>Secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="block w-full h-16 text-background fill-current">
            <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ── PROGRAMS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-primary font-bold tracking-wider uppercase text-sm mb-2">Our Curriculum</p>
          <h2 className="text-4xl font-display font-bold text-secondary mb-4">Programs for Every Age</h2>
          <p className="text-muted-foreground">Tailored programmes designed to meet the developmental needs of children at every stage.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {corePrograms.map((prog) => {
            const c = programColors[prog.color] ?? programColors.green;
            return (
              <div key={prog.id} className="bg-card border border-border rounded-3xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all text-center group cursor-pointer">
                <div className={`w-20 h-20 mx-auto rounded-full ${c.bg} flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform`}>
                  {programIcons[prog.id]}
                </div>
                <h4 className="text-2xl font-display font-bold text-foreground mb-2">{prog.title}</h4>
                <span className="inline-block bg-muted px-3 py-1 rounded-full text-sm font-semibold text-muted-foreground mb-4">{prog.ageRange}</span>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{prog.description.slice(0, 80)}…</p>
                <Link href="/programs" className={`font-bold ${c.icon} inline-flex items-center gap-2 hover:gap-3 transition-all`}>
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center">
          <Link href="/daycare"
            className="inline-flex items-center gap-2 bg-secondary text-white font-bold px-8 py-4 rounded-full shadow-lg hover:bg-secondary/90 hover:-translate-y-1 transition-all">
            Also: Daycare · After-School · Holiday Camps <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── WHY EVERGREEN ── */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-primary font-bold tracking-wider uppercase text-sm mb-2">Why Choose Us</p>
            <h2 className="text-4xl font-display font-bold text-secondary mb-4">More Than Just a School</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: "🎓", title: "Quality Education", desc: "Age-appropriate curriculum fostering holistic development." },
              { icon: "❤️", title: "Caring Environment", desc: "Dedicated staff committed to a nurturing atmosphere." },
              { icon: "🛡️", title: "Safe Facilities", desc: "CCTV, controlled access and modern safety measures." },
              { icon: "👥", title: "Small Class Sizes", desc: "Low ratios ensuring personalised attention for every child." },
            ].map((v) => (
              <div key={v.title} className="bg-card p-8 rounded-3xl shadow-sm border border-border text-center hover:-translate-y-2 transition-transform">
                <div className="text-5xl mb-5">{v.icon}</div>
                <h4 className="font-display font-bold text-xl text-foreground mb-3">{v.title}</h4>
                <p className="text-muted-foreground text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOOGLE REVIEWS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-accent font-bold tracking-wider uppercase text-sm mb-2">Parent Reviews</p>
          <h2 className="text-4xl font-display font-bold text-secondary mb-4">Loved by Families</h2>
          <div className="flex items-center justify-center gap-2">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-accent text-accent" />)}
            <span className="font-bold text-secondary ml-2">{site.rating.score}</span>
            <span className="text-muted-foreground">· {site.rating.count} Google reviews</span>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((t) => (
            <div key={t.id} className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < t.rating ? "fill-accent text-accent" : "text-border"}`} />
                ))}
              </div>
              <p className="text-foreground italic mb-6 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-bold text-secondary text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.program} · {t.timeAgo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href={site.googleReviewsUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-secondary text-secondary font-bold px-8 py-3 rounded-full hover:bg-secondary hover:text-white transition-all">
            See All Reviews on Google <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ── UPCOMING EVENTS BAND ── */}
      <section className="bg-secondary text-secondary-foreground py-20 relative overflow-hidden rounded-t-[3rem] lg:rounded-t-[5rem]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <p className="text-accent font-bold tracking-wider uppercase text-sm mb-2">Community</p>
              <h2 className="text-4xl font-display font-bold text-white mb-4">Our Community</h2>
              <p className="text-secondary-foreground/80">Resources and portals for parents, teachers, students and administrators.</p>
            </div>
            <Link href="/contact" className="bg-white text-secondary font-bold px-6 py-3 rounded-full hover:bg-white/90 transition-colors shrink-0">
              Enroll Now
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { icon: "👨‍👩‍👧", title: "For Parents", cta: "Parent Portal" },
              { icon: "👩‍🏫", title: "For Teachers", cta: "Resources" },
              { icon: "🧒",     title: "For Students", cta: "Student Corner" },
              { icon: "🏫",     title: "For Admins", cta: "Admin Login" },
              { icon: "💼",     title: "Consultants", cta: "Hub" },
            ].map((s) => (
              <div key={s.title} className="bg-white/10 border border-white/20 p-5 rounded-2xl text-center hover:bg-white/15 transition-colors">
                <div className="text-4xl mb-3">{s.icon}</div>
                <h4 className="font-display font-bold text-white mb-2">{s.title}</h4>
                <span className="text-xs font-semibold text-secondary-foreground/60 bg-white/10 px-3 py-1 rounded-full">{s.cta}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto px-4 text-center py-8">
        <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-3xl p-12 border border-border">
          <h2 className="text-4xl font-display font-bold text-secondary mb-4">Give Your Child the Best Start in Life</h2>
          <p className="text-muted-foreground text-lg mb-8">Enrol now for the upcoming academic year · Limited seats available</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact"
              className="bg-primary text-white font-bold px-8 py-4 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
              Contact Us Today <ArrowRight className="w-5 h-5" />
            </Link>
            <a href={`tel:${site.phone}`}
              className="bg-white text-secondary font-bold px-8 py-4 rounded-full shadow-md border border-border hover:bg-muted/50 hover:-translate-y-1 transition-all">
              📞 {site.phone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
