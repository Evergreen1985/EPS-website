"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import site from "@/content/site.json";

const links = [
  { label: "Home",      href: "/" },
  { label: "Programs",  href: "/programs" },
  { label: "About Us",  href: "/about" },
  { label: "Events",    href: "/community" },
  { label: "Gallery",   href: "/gallery" },
  { label: "AI Tools ✨", href: "/ai-tools" },
  { label: "Contact",   href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname              = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div className="hidden sm:block text-sm py-2 px-4" style={{ background: "#178F78", color: "rgba(255,255,255,0.8)" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href={`tel:${site.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5" /> {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5" /> {site.email}
            </a>
          </div>
          <span className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> {site.addressShort}
          </span>
        </div>
      </div>

      {/* Main nav */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-3" : "bg-white py-4"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform"
              style={{ background: "#E8694A" }}>
              EP
            </div>
            <span className="font-bold text-2xl tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
              EVERGREEN
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="font-semibold text-sm transition-colors hover:text-primary"
                style={{ color: pathname === l.href ? "#E8694A" : "#1A2F4A",
                         fontFamily: "'Quicksand', sans-serif" }}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact"
              className="font-bold px-6 py-2.5 rounded-full text-white text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "#E8694A", boxShadow: "0 4px 14px rgba(232,105,74,0.3)" }}>
              Enroll Now
            </Link>
          </nav>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-stone-100 p-4 flex flex-col gap-2 z-40">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="font-semibold text-base p-3 rounded-xl transition-colors"
                style={{
                  fontFamily: "'Quicksand', sans-serif",
                  color: pathname === l.href ? "#E8694A" : "#1A2F4A",
                  background: pathname === l.href ? "rgba(232,105,74,0.08)" : "transparent",
                }}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)}
              className="font-bold text-center py-3 rounded-xl text-white mt-2"
              style={{ background: "#E8694A" }}>
              Enroll Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
