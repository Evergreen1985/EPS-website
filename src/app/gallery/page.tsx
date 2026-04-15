"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import gallery from "@/content/gallery.json";

const categories = ["All", ...Array.from(new Set(gallery.map((g) => g.category)))];

const categoryColors: Record<string, string> = {
  "Art & Creativity": "#FDF2F8",
  "Outdoor Play": "#F0FDF4",
  "Learning": "#EFF6FF",
  "STEM": "#F0FDFA",
  "Arts": "#FEFCE8",
  "Events": "#FFF7ED",
  "Daily Life": "#F5F3FF",
};

const categoryEmoji: Record<string, string> = {
  "Art & Creativity": "🎨",
  "Outdoor Play": "🌳",
  "Learning": "📚",
  "STEM": "🔬",
  "Arts": "🎵",
  "Events": "🎉",
  "Daily Life": "☀️",
};

type GalleryItem = (typeof gallery)[0] & { lightboxOpen?: boolean };

export default function GalleryPage() {
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  const filtered = active === "All" ? gallery : gallery.filter((g) => g.category === active);

  return (
    <>
      {/* Header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#74C69D" }}>Gallery</p>
          <h1 className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            A Peek Inside Our World
          </h1>
          <p className="text-white/65 text-lg">
            Real moments from our classrooms, playground, and community events.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className="shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all"
                style={
                  active === cat
                    ? { background: "var(--forest)", color: "white" }
                    : { background: "#f5f5f4", color: "#57534e" }
                }
              >
                {cat !== "All" && categoryEmoji[cat] ? `${categoryEmoji[cat]} ` : ""}{cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="py-16" style={{ background: "var(--warm50)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((item) => {
              const bg = categoryColors[item.category] ?? "#F5F5F4";
              const emoji = categoryEmoji[item.category] ?? "📸";
              return (
                <div
                  key={item.id}
                  className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ background: bg, border: "1px solid #e7e5e4" }}
                  onClick={() => setLightbox(item)}
                >
                  {/* Colour block placeholder — replace with <Image> when real photos are available */}
                  <div
                    className="w-full flex items-center justify-center py-12"
                    style={{ background: bg, minHeight: item.id % 3 === 0 ? "200px" : "160px" }}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-2 opacity-60">{emoji}</div>
                      <div className="text-xs font-medium text-stone-400">{item.category}</div>
                    </div>
                  </div>
                  {/* Caption bar */}
                  <div className="px-4 py-3 bg-white/80">
                    <p className="text-sm font-medium text-stone-800 leading-tight">{item.caption}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{item.category}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24 text-stone-400">
              <div className="text-5xl mb-4">📷</div>
              <p>No photos in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-center py-24"
              style={{ background: categoryColors[lightbox.category] ?? "#f5f5f4" }}
            >
              <div className="text-center">
                <div className="text-8xl mb-3">{categoryEmoji[lightbox.category] ?? "📸"}</div>
                <div className="text-sm font-medium text-stone-500">{lightbox.category}</div>
              </div>
            </div>
            <div className="bg-white px-6 py-4">
              <p className="font-semibold text-stone-900">{lightbox.caption}</p>
              <p className="text-sm text-stone-400 mt-1">{lightbox.alt}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload note */}
      <section className="py-12 bg-white border-t border-stone-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-3xl mb-3">📸</div>
          <h3 className="text-lg font-semibold text-stone-900 mb-2">Want to contribute photos?</h3>
          <p className="text-stone-500 text-sm">
            Parents can share photos from school events through our Parent Portal or by sending them to{" "}
            <a href="mailto:info@evergreenpreschool.com" className="font-medium" style={{ color: "var(--forest)" }}>
              info@evergreenpreschool.com
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Want to See It In Person?
          </h2>
          <p className="text-white/65 mb-8">Photos don&apos;t do justice. Come for a campus tour and feel the Evergreen difference.</p>
          <Link href="/contact" className="btn-amber">
            Book a Free Visit <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
