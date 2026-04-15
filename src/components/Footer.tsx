import Link from "next/link";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import site from "@/content/site.json";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground pt-16 pb-8 relative mt-20">
      {/* Wave divider */}
      <div className="wave-divider text-secondary rotate-180" style={{top:0}}>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,119.34,196.48,105.14Z" className="fill-current" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="bg-white p-2 rounded-xl">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xs">EP</div>
              </div>
              <span className="font-display font-bold text-2xl text-white">EVERGREEN</span>
            </Link>
            <p className="text-secondary-foreground/80 mb-6 leading-relaxed text-sm">
              Nurturing young minds through play-based learning in a safe, loving, and joyful environment since our founding.
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl text-white mb-6">Programs</h4>
            <ul className="space-y-3 text-sm">
              {["Playgroup (2–3 yrs)", "Nursery (3–4 yrs)", "Junior KG (4–5 yrs)", "Senior KG (5–6 yrs)", "Full-Day Daycare", "After-School Program", "Holiday Camps"].map(p => (
                <li key={p}><Link href="/programs" className="text-secondary-foreground/75 hover:text-white transition-colors">{p}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl text-white mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {[["About Us","/about"],["Daycare","/daycare"],["Gallery","/gallery"],["Contact","/contact"],["Enroll Now","/contact"]].map(([l,h]) => (
                <li key={h}><Link href={h} className="text-secondary-foreground/75 hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-xl text-white mb-6">Contact Info</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-secondary-foreground/75">1427, 13th Cross, Ananthnagar Phase 2, Bengaluru 560100</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/75">{site.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-secondary-foreground/75">{site.email}</span>
              </li>
              <li className="text-secondary-foreground/60 text-xs">
                Mon–Fri: {site.hours.weekdays}<br />
                Saturday: {site.hours.saturday}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/50">
          <p>© {new Date().getFullYear()} EVERGREEN Preschool & Daycare. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
