"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

const images = [
  { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",  caption: "Building tall towers!", cat: "Learning" },
  { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop", caption: "Finger painting fun", cat: "Art" },
  { url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=800&auto=format&fit=crop",  caption: "Infant exploration", cat: "Infant Care" },
  { url: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop",  caption: "Circle time together", cat: "Learning" },
  { url: "https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=800&auto=format&fit=crop",  caption: "Outdoor adventures", cat: "Outdoor" },
  { url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800&auto=format&fit=crop",  caption: "Helping hands", cat: "Social" },
  { url: "https://images.unsplash.com/photo-1536337005238-94b997371b40?q=80&w=800&auto=format&fit=crop",  caption: "Science experiments", cat: "STEM" },
  { url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=800&auto=format&fit=crop",  caption: "Story time magic", cat: "Learning" },
  { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop",  caption: "Music and movement", cat: "Art" },
  { url: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=800&auto=format&fit=crop",  caption: "Creative art class", cat: "Art" },
  { url: "https://images.unsplash.com/photo-1551966775-a4ddc8df052b?q=80&w=800&auto=format&fit=crop",     caption: "Garden learning", cat: "Outdoor" },
  { url: "https://images.unsplash.com/photo-1605711285791-0219e80e43a3?q=80&w=800&auto=format&fit=crop",  caption: "Water play STEM", cat: "STEM" },
];

const categories = ["All", "Learning", "Art", "Outdoor", "STEM", "Social", "Infant Care"];

export default function GalleryPage() {
  const [active, setActive]   = useState("All");
  const [lightbox, setLightbox] = useState<typeof images[0] | null>(null);

  const filtered = active === "All" ? images : images.filter(i => i.cat === active);

  return (
    <div className="pb-24" style={{ fontFamily: "'Quicksand', sans-serif" }}>

      {/* Hero */}
      <div className="py-16 md:py-24 border-b border-stone-100" style={{ background: "rgba(23,143,120,0.08)" }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-5" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Photo Gallery
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto">
            A glimpse into the daily joy, discovery, and magic at EVERGREEN.
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-0 z-20 bg-white border-b border-stone-100 shadow-sm py-3 px-4">
        <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              className="shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background:  active === cat ? "#E8694A" : "#FAF0E8",
                color:       active === cat ? "white"   : "#6B7A99",
              }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {filtered.map((img, i) => (
            <div key={i}
              className="break-inside-avoid relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => setLightbox(img)}>
              <Image src={img.url} alt={img.caption} width={800} height={600}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                <span className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#F5B829" }}>{img.cat}</span>
                <p className="text-white font-bold text-base">{img.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-3xl w-full rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <Image src={lightbox.url} alt={lightbox.caption} width={1200} height={800}
              className="w-full h-auto max-h-[75vh] object-contain" />
            <div className="bg-stone-900 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#F5B829" }}>{lightbox.cat}</span>
              <p className="text-white font-semibold mt-0.5">{lightbox.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center py-10 px-4">
        <div className="max-w-2xl mx-auto rounded-3xl p-10"
          style={{ background: "linear-gradient(135deg, rgba(232,105,74,0.08), rgba(245,184,41,0.08), rgba(23,143,120,0.08))", border: "1.5px solid #EDE8DF" }}>
          <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Want to See It In Person?
          </h2>
          <p className="text-stone-500 mb-6">Come for a campus tour and feel the Evergreen difference.</p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-4 rounded-full transition-all hover:-translate-y-0.5"
            style={{ background: "#E8694A", boxShadow: "0 8px 24px rgba(232,105,74,0.3)" }}>
            Book a Free Visit →
          </Link>
        </div>
      </div>
    </div>
  );
}
