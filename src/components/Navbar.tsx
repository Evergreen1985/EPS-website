"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import site from "@/content/site.json";

const tabs = [
  { label:"Home",          idx:0,  href:null },
  { label:"Programs",      idx:1,  href:null },
  { label:"About Us",      idx:2,  href:null },
  { label:"Daycare",       idx:3,  href:null },
  { label:"Gallery",       idx:4,  href:null },
  { label:"AI Tools ✨",   idx:5,  href:null },
  { label:"Parent Portal", idx:6,  href:null },
  { label:"Contact",       idx:7,  href:null },
];

// We broadcast the active section index globally so Navbar can read it
// from the homepage scroll, even though Navbar is in layout
let _onJump: ((idx: number) => void) | null = null;
export function registerJump(fn: (idx: number) => void) { _onJump = fn; }
export function callJump(idx: number) { if (_onJump) _onJump(idx); }

export default function Navbar() {
  const [open, setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(0);
  const pathname            = usePathname();
  const router              = useRouter();
  const isHome              = pathname === "/";

  // Listen for active section broadcasts from the page
  useEffect(() => {
    const handler = (e: Event) => setActive((e as CustomEvent).detail);
    window.addEventListener("ep-section", handler);
    return () => window.removeEventListener("ep-section", handler);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleTab = useCallback((tab: typeof tabs[0]) => {
    setOpen(false);
    if (tab.href) { router.push(tab.href); return; }
    if (isHome) {
      // dispatch jump event to page
      window.dispatchEvent(new CustomEvent("ep-jump", { detail: tab.idx }));
    } else {
      // navigate home then jump
      router.push("/");
      setTimeout(() => window.dispatchEvent(new CustomEvent("ep-jump", { detail: tab.idx })), 400);
    }
  }, [isHome, router]);

  return (
    <>
      {/* Top info bar */}
      <div className="hidden sm:flex items-center justify-between px-5 py-1.5 text-xs"
        style={{ background:"#178F78", color:"rgba(255,255,255,0.8)", fontFamily:"'Quicksand',sans-serif" }}>
        <div className="flex items-center gap-5">
          <a href={`tel:${site.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3 h-3"/>{site.phone}
          </a>
          <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Mail className="w-3 h-3"/>{site.email}
          </a>
        </div>
        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/>{site.addressShort}</span>
      </div>

      {/* Main nav */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-md py-1.5" : "py-2"
      }`} style={{ background:"white", borderBottom:"1px solid #EDE8DF" }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => handleTab(tabs[0])} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform"
              style={{ background:"#E8694A", fontFamily:"'Fredoka',sans-serif" }}>EP</div>
            <span className="font-bold text-xl" style={{ fontFamily:"'Fredoka',sans-serif", color:"#178F78" }}>EVERGREEN</span>
          </button>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center">
            {tabs.map(tab => {
              const isActive = isHome ? active === tab.idx : (tab.href && pathname.startsWith(tab.href));
              return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-xs font-semibold px-3 py-2 transition-all border-b-2"
                  style={{
                    fontFamily:"'Quicksand',sans-serif",
                    color: isActive ? "#E8694A" : "#6B7A99",
                    borderBottomColor: isActive ? "#E8694A" : "transparent",
                    height:"48px",
                  }}>
                  {tab.label}
                </button>
              );
            })}
            <button onClick={() => handleTab(tabs[7])}
              className="ml-3 font-bold px-5 py-2 rounded-full text-white text-xs transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background:"#E8694A", boxShadow:"0 4px 12px rgba(232,105,74,0.3)", fontFamily:"'Quicksand',sans-serif" }}>
              Enroll Now
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg" onClick={() => setOpen(!open)}
            style={{ color:"#1A2F4A" }}>
            {open ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t shadow-xl z-50 p-4 flex flex-col gap-1"
            style={{ borderColor:"#EDE8DF" }}>
            {tabs.map(tab => (
              <button key={tab.label} onClick={() => handleTab(tab)}
                className="text-left font-semibold text-sm p-3 rounded-xl transition-colors"
                style={{
                  fontFamily:"'Quicksand',sans-serif",
                  color: (isHome && active === tab.idx) ? "#E8694A" : "#1A2F4A",
                  background: (isHome && active === tab.idx) ? "rgba(232,105,74,0.08)" : "transparent",
                }}>
                {tab.label}
              </button>
            ))}
            <button onClick={() => { handleTab(tabs[7]); }}
              className="font-bold text-center py-3 rounded-xl text-white mt-1"
              style={{ background:"#E8694A", fontFamily:"'Quicksand',sans-serif" }}>
              Enroll Now
            </button>
          </div>
        )}
      </header>
    </>
  );
}
