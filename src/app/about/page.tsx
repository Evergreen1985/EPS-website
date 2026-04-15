import { Heart, Sun, Leaf, Palette } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import site from "@/content/site.json";

const values = [
  { icon: Heart,   title: "Love First",          desc: "Every child is treated with warmth, respect, and unconditional care." },
  { icon: Sun,     title: "Joyful Learning",      desc: "We believe learning happens best when children are having fun." },
  { icon: Leaf,    title: "Growth Mindset",       desc: "Encouraging curiosity, resilience, and a love for discovery." },
  { icon: Palette, title: "Creative Expression",  desc: "Celebrating every child's unique imagination and creativity." },
];

const team = [
  { name: "Ms. Praveena", role: "Principal",             bio: "With over 7 years in early childhood education, Ms Praveena leads our team with passion and a big heart.", img: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=400&auto=format&fit=crop", fact: "Loves teaching through storytelling!" },
  { name: "Ms. Bhagaylakshmi",   role: "Programme Coordinator", bio: "Mr. Patel brings science to life through hands-on experiments and nature walks with the children.",          img: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=400&auto=format&fit=crop", fact: "Speaks 5 languages! " },
  { name: "Ms. Vaishnavi",   role: "Senior Techer",          bio: "Ms. Vaishnavi's patience and warm approach make our school a safe, home-like space every child loves.",        img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop", fact: "Passionate about STEM education." },
];

export default function AboutPage() {
  return (
    <div className="pb-24" style={{ fontFamily: "'Quicksand', sans-serif" }}>

      {/* Hero */}
      <div className="relative py-20 lg:py-32 overflow-hidden" style={{ background: "#178F78" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Our Story
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            {site.about.story}
          </p>
        </div>
      </div>

      {/* Mission / Philosophy */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
              <Image
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop"
                alt="Kids learning together"
                fill className="object-cover"
              />
            </div>
            <div>
              <p className="font-bold tracking-wider uppercase text-sm mb-2" style={{ color: "#E8694A" }}>Our Philosophy</p>
              <h2 className="text-4xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                Play is the Highest Form of Research
              </h2>
              <p className="text-lg text-stone-500 mb-5 leading-relaxed">
                At EVERGREEN, we follow a play-based curriculum inspired by Reggio Emilia and Montessori philosophies. We believe that children are naturally curious and capable learners.
              </p>
              <p className="text-lg text-stone-500 leading-relaxed">
                Our classrooms are designed as &ldquo;the third teacher&rdquo; — carefully arranged to provoke wonder, creativity, and collaboration. Through hands-on activities, art, music, and outdoor exploration, we nurture the whole child.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ background: "#FAF0E8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
              Our Core Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-7 rounded-3xl shadow-sm border border-stone-100 text-center hover:-translate-y-2 transition-transform">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(232,105,74,0.1)" }}>
                  <v.icon className="w-8 h-8" style={{ color: "#E8694A" }} />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-3" style={{ fontFamily: "'Fredoka', sans-serif" }}>{v.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-3xl p-8 border-l-4" style={{ background: "rgba(23,143,120,0.06)", borderColor: "#178F78" }}>
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>Our Mission</h3>
              <p className="text-stone-500 leading-relaxed italic">&ldquo;{site.about.mission}&rdquo;</p>
            </div>
            <div className="rounded-3xl p-8 border-l-4" style={{ background: "rgba(245,184,41,0.08)", borderColor: "#F5B829" }}>
              <div className="text-3xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>Our Vision</h3>
              <p className="text-stone-500 leading-relaxed italic">&ldquo;{site.about.vision}&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20" style={{ background: "#FAF0E8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="font-bold tracking-wider uppercase text-sm mb-2" style={{ color: "#F5B829" }}>Meet The Educators</p>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>Our Loving Staff</h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              Every teacher at EVERGREEN is trained, background-checked, and passionate about early childhood education.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((m, i) => (
              <div key={i} className="group">
                <div className="relative rounded-3xl overflow-hidden mb-5 aspect-[4/5] shadow-lg">
                  <Image src={m.img} alt={m.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                    <p className="font-bold text-sm mb-1" style={{ color: "#F5B829" }}>Fun Fact:</p>
                    <p className="text-white text-sm">{m.fact}</p>
                  </div>
                </div>
                <h4 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>{m.name}</h4>
                <p className="font-bold text-xs uppercase tracking-wider mb-2" style={{ color: "#E8694A" }}>{m.role}</p>
                <p className="text-stone-500 text-sm leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "#178F78" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Experience the Evergreen Difference
          </h2>
          <p className="text-white/70 mb-7">Schedule a visit to our campus and see our facilities firsthand.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-stone-900 transition-all hover:-translate-y-0.5"
            style={{ background: "#F5B829", boxShadow: "0 8px 24px rgba(245,184,41,0.35)" }}>
            Contact Us Today →
          </Link>
        </div>
      </section>
    </div>
  );
}
