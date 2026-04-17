"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import site from "@/content/site.json";

const links = [
  { label: "Home",          href: "/",              section: "home" },
  { label: "Programs",      href: "/#programs",     section: "programs" },
  { label: "About Us",      href: "/about",         section: null },
  { label: "Daycare",       href: "/daycare",       section: null },
  { label: "Gallery",       href: "/gallery",       section: null },
  { label: "AI Tools ✨",   href: "/ai-tools",      section: null },
  { label: "Parent Portal", href: "/parent-portal", section: null },
  { label: "Contact",       href: "/contact",       section: null },
];

export default function Navbar() {
  const [open, setOpen]           = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [activeSection, setActive] = useState("home");
  const pathname                  = usePathname();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      // Highlight nav based on scroll position (homepage only)
      if (pathname !== "/") return;
      const sections = ["home","programs","why","reviews","community"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActive(id); break;
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const handleNav = (href: string, section: string | null) => {
    setOpen(false);
    if (section && pathname === "/") {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="hidden sm:block text-xs py-1.5 px-4" style={{ background: "#178F78", color: "rgba(255,255,255,0.8)" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-5">
            <a href={`tel:${site.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Phone className="w-3 h-3" /> {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail className="w-3 h-3" /> {site.email}
            </a>
          </div>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> {site.addressShort}
          </span>
        </div>
      </div>

      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-md py-2" : "bg-white py-3"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform"
              style={{ background: "#E8694A" }}>EP</div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
              EVERGREEN
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-5">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                onClick={() => handleNav(l.href, l.section)}
                className="font-semibold text-xs transition-colors hover:text-primary"
                style={{
                  color: pathname === "/" && l.section && activeSection === l.section ? "#E8694A"
                       : pathname === l.href && !l.section ? "#E8694A"
                       : "#1A2F4A",
                  fontFamily: "'Quicksand', sans-serif"
                }}>
                {l.label}
              </Link>
            ))}
            <Link href="/admissions"
              className="font-bold px-5 py-2 rounded-full text-white text-xs transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "#E8694A", boxShadow: "0 4px 14px rgba(232,105,74,0.3)" }}>
              Enroll Now
            </Link>
          </nav>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-stone-100 p-4 flex flex-col gap-2 z-40">
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => handleNav(l.href, l.section)}
                className="font-semibold text-sm p-2.5 rounded-xl transition-colors"
                style={{ fontFamily: "'Quicksand', sans-serif", color: "#1A2F4A" }}>
                {l.label}
              </Link>
            ))}
            <Link href="/admissions" onClick={() => setOpen(false)}
              className="font-bold text-center py-2.5 rounded-xl text-white mt-1"
              style={{ background: "#E8694A" }}>
              Enroll Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
