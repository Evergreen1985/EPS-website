"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";

interface SchoolPublic {
  name: string; shortName: string; branding: { logoUrl: string };
  contact: { phone: string; email: string };
  address: { short: string };
  theme: { primaryColor: string; secondaryColor: string };
}

const DEFAULT: SchoolPublic = {
  name: "Evergreen Preschool & Daycare", shortName: "Evergreen",
  branding: { logoUrl: "/logo.png" },
  contact: { phone: "7411574504", email: "developer@intelliverify.ai" },
  address: { short: "Electronic City, Bengaluru – 560100" },
  theme: { primaryColor: "#178F78", secondaryColor: "#E8694A" },
};

const tabs = [
  { label: "Home",       idx: 0,  href: null },
  { label: "Programs",   idx: 1,  href: null },
  { label: "About Us",   idx: 2,  href: null },
  { label: "Daycare",    idx: 3,  href: null },
  { label: "Gallery",    idx: 4,  href: null },
  { label: "AI Tools ✨",idx: 5,  href: null },
  { label: "Contact",    idx: 6,  href: null },
  { label: "Parent",     idx: -1, href: "/parent-login" },
  { label: "Staff",      idx: -1, href: "/teacher-login" },
];

let _onJump: ((idx: number) => void) | null = null;
export function registerJump(fn: (idx: number) => void) { _onJump = fn; }
export function callJump(idx: number) { if (_onJump) _onJump(idx); }

export default function Navbar() {
  const [open,     setOpen]    = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active,   setActive]  = useState(0);
  const [school,   setSchool]  = useState<SchoolPublic>(DEFAULT);
  const pathname = usePathname();
  const router   = useRouter();
  const isHome   = pathname === "/";

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(d => { if (d.school) setSchool(d.school); }).catch(() => {});
  }, []);

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
      window.dispatchEvent(new CustomEvent("ep-jump", { detail: tab.idx }));
    } else {
      router.push("/");
      setTimeout(() => window.dispatchEvent(new CustomEvent("ep-jump", { detail: tab.idx })), 400);
    }
  }, [isHome, router]);

  const primary   = school.theme.primaryColor;
  const secondary = school.theme.secondaryColor;

  return (
    <div className="sticky top-0 z-50">
      {/* Top info bar */}
      <div className="hidden sm:block"
        style={{ background: primary, color: "rgba(255,255,255,0.85)", fontFamily: "var(--font-body, 'Quicksand',sans-serif)" }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between py-1.5 text-xs">
          <div className="flex items-center gap-5">
            <a href={`tel:${school.contact.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold">
              <Phone className="w-3 h-3" />{school.contact.phone}
            </a>
            <a href={`mailto:${school.contact.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold">
              <Mail className="w-3 h-3" />{school.contact.email}
            </a>
          </div>
          <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
            <MapPin className="w-3 h-3 flex-shrink-0" />{school.address.short}
          </span>
        </div>
      </div>

      {/* Main nav */}
      <header style={{ background: "white", borderBottom: "1px solid #EDE8DF", height: "64px", display: "flex", alignItems: "center", boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none" }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between w-full">
          {/* Logo + Name */}
          <button onClick={() => handleTab(tabs[0])} className="flex items-center gap-3 group flex-shrink-0">
            <img src={school.branding.logoUrl} alt={`${school.name} Logo`}
              className="group-hover:scale-105 transition-transform"
              style={{ height: "52px", width: "auto", objectFit: "contain" }} />
            <div className="hidden md:block text-left">
              <div style={{ fontFamily: "var(--font-heading, 'Fredoka',sans-serif)", fontSize: "16px", fontWeight: 700, color: primary, lineHeight: 1.15 }}>{school.shortName.toUpperCase()}</div>
              <div style={{ fontFamily: "var(--font-body, 'Quicksand',sans-serif)", fontSize: "10px", fontWeight: 600, color: secondary, lineHeight: 1.3 }}>Preschool & Daycare</div>
            </div>
          </button>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-0">
            {tabs.map(tab => {
              const isActive = isHome ? active === tab.idx : (tab.href && pathname.startsWith(tab.href));

              if (tab.label === "Parent") return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all hover:opacity-90 ml-2"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", background: "#8957E5", color: "white", boxShadow: "0 3px 10px rgba(137,87,229,0.35)" }}>
                  👨‍👩‍👧 Parent
                </button>
              );

              if (tab.label === "Staff") return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all hover:opacity-90 ml-1.5"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", background: primary, color: "white", boxShadow: `0 3px 10px ${primary}55` }}>
                  👩‍🏫 Staff
                </button>
              );

              return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-xs font-semibold px-2.5 py-2 transition-all border-b-2"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", color: isActive ? secondary : "#6B7A99", borderBottomColor: isActive ? secondary : "transparent", height: "52px" }}>
                  {tab.label}
                </button>
              );
            })}
            <button onClick={() => handleTab({ label: "Enquiry", idx: -1, href: "/enquiry" })}
              className="ml-2 font-bold px-4 py-1.5 rounded-full text-white text-xs transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: primary, boxShadow: `0 4px 12px ${primary}50`, fontFamily: "var(--font-body,'Quicksand',sans-serif)" }}>
              Enquiry
            </button>
            <button onClick={() => handleTab({ label: "Admissions", idx: -1, href: "/admissions" })}
              className="ml-1.5 font-bold px-4 py-1.5 rounded-full text-white text-xs transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: secondary, boxShadow: `0 4px 12px ${secondary}50`, fontFamily: "var(--font-body,'Quicksand',sans-serif)" }}>
              Enroll Now
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg" onClick={() => setOpen(!open)}
            style={{ color: "#1A2F4A" }}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t shadow-xl z-50 p-4 flex flex-col gap-1"
            style={{ borderColor: "#EDE8DF" }}>
            {tabs.map(tab => {
              if (tab.label === "Parent") return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-left font-bold text-sm p-3 rounded-xl"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", color: "#8957E5", background: "rgba(137,87,229,0.08)" }}>
                  👨‍👩‍👧 Parent
                </button>
              );
              if (tab.label === "Staff") return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-left font-bold text-sm p-3 rounded-xl"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", color: primary, background: `${primary}15` }}>
                  👩‍🏫 Staff
                </button>
              );
              return (
                <button key={tab.label} onClick={() => handleTab(tab)}
                  className="text-left font-semibold text-sm p-3 rounded-xl transition-colors"
                  style={{ fontFamily: "var(--font-body,'Quicksand',sans-serif)", color: (isHome && active === tab.idx) ? secondary : "#1A2F4A", background: (isHome && active === tab.idx) ? `${secondary}15` : "transparent" }}>
                  {tab.label}
                </button>
              );
            })}
            <button onClick={() => { handleTab(tabs.find(t => t.label === "Contact")!); }}
              className="font-bold text-center py-3 rounded-xl text-white mt-1"
              style={{ background: secondary, fontFamily: "var(--font-body,'Quicksand',sans-serif)" }}>
              Enroll Now
            </button>
          </div>
        )}
      </header>
    </div>
  );
}
