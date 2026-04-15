"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import site from "@/content/site.json";

const links = [
  { label: "Home", href: "/" },
  { label: "Programs", href: "/programs" },
  { label: "About Us", href: "/about" },
  { label: "Daycare", href: "/daycare" },
  { label: "Gallery", href: "/gallery" },
  { label: "AI Tools ✨", href: "/ai-tools" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top info bar */}
      <div className="bg-secondary text-secondary-foreground text-sm py-2 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {site.phone}</span>
            <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {site.email}</span>
          </div>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {site.addressShort}</span>
        </div>
      </div>

      {/* Main nav */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-md py-3" : "bg-white py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">EP</div>
            <span className="font-display font-bold text-2xl text-secondary tracking-tight">EVERGREEN</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`font-semibold transition-colors hover:text-primary ${pathname === l.href ? "text-primary" : "text-foreground"}`}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact"
              className="bg-primary text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Enroll Now
            </Link>
          </nav>

          <button className="lg:hidden p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-xl border-t border-border flex flex-col p-4 gap-3 z-40">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className={`font-semibold text-lg p-2 rounded-xl ${pathname === l.href ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"}`}>
                {l.label}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setOpen(false)}
              className="bg-primary text-white font-bold text-center px-6 py-3 rounded-xl mt-2 shadow-md">
              Enroll Now
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
