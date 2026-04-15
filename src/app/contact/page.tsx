"use client";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, ChevronDown } from "lucide-react";
import site from "@/content/site.json";

type Status = "idle" | "sending" | "success";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", childAge: "", program: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise(r => setTimeout(r, 1400));
    setStatus("success");
  };

  const inp = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-teal-400 focus:bg-white focus:outline-none transition-all";

  return (
    <div className="min-h-screen pb-20" style={{ background: "#FEFCF8", fontFamily: "'Quicksand', sans-serif" }}>

      {/* ── COMPACT HEADER ── */}
      <div className="pt-24 pb-8 px-4" style={{ background: "#FEFCF8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-6 rounded-full" style={{ background: "#E8694A" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E8694A" }}>Get in Touch</span>
          </div>
          <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Contact Us
          </h1>
          <p className="text-stone-500 text-sm">
            Reach out for admissions, programme details, or to schedule a campus visit.
          </p>
        </div>
      </div>

      {/* ── 4 INFO CHIPS ── */}
      <div className="max-w-5xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <MapPin className="w-4 h-4" />, label: "Location", value: "1427, 13th Cross, Ananthnagar Phase 2, Electronic City, Bengaluru 560100" },
            { icon: <Phone className="w-4 h-4" />, label: "Phone",    value: site.phone,  href: `tel:${site.phone}` },
            { icon: <Mail className="w-4 h-4" />,  label: "Email",    value: site.email,  href: `mailto:${site.email}` },
            { icon: <Clock className="w-4 h-4" />, label: "Hours",    value: `Mon–Fri: ${site.hours.weekdays}\nSat: ${site.hours.saturday}` },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-white"
                style={{ background: "#E8694A" }}>
                {card.icon}
              </div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{card.label}</div>
              {card.href ? (
                <a href={card.href} className="text-xs text-stone-700 font-semibold hover:text-teal-600 transition-colors leading-relaxed block">
                  {card.value}
                </a>
              ) : (
                <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{card.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM + SIDEBAR ── */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-100 shadow-sm p-7">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(23,143,120,0.1)" }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#178F78" }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                  Message Sent!
                </h3>
                <p className="text-stone-500 text-sm max-w-xs">
                  Thank you! Our team will get back to you within one business day.
                </p>
                <button onClick={() => { setStatus("idle"); setForm({ name:"",email:"",phone:"",childAge:"",program:"",message:"" }); }}
                  className="mt-5 px-6 py-2.5 rounded-full text-white text-sm font-bold transition-all hover:-translate-y-0.5"
                  style={{ background: "#E8694A" }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
                    Send Us a Message
                  </h2>
                  <p className="text-stone-400 text-xs">We reply within one business day.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Full Name *</label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Email *</label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inp} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Phone *</label>
                    <input type="tel" name="phone" required value={form.phone} onChange={handleChange} placeholder="Mobile number" className={inp} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Child&apos;s Age</label>
                    <select name="childAge" value={form.childAge} onChange={handleChange} className={inp}>
                      <option value="">Select age</option>
                      <option>9 mo – 2 yrs (Infant Care)</option>
                      <option>2–3 yrs (Playgroup)</option>
                      <option>3–4 yrs (Nursery)</option>
                      <option>4–5 yrs (Jr. KG)</option>
                      <option>5–6 yrs (Sr. KG)</option>
                      <option>6+ yrs (After-School)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Interested Programme</label>
                  <select name="program" value={form.program} onChange={handleChange} className={inp}>
                    <option value="">Select a programme</option>
                    <option>Infant Care</option>
                    <option>Playgroup</option>
                    <option>Nursery</option>
                    <option>Junior KG</option>
                    <option>Senior KG</option>
                    <option>Full-Day Daycare</option>
                    <option>After-School Program</option>
                    <option>Holiday Camp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">Message *</label>
                  <textarea name="message" required value={form.message} onChange={handleChange} rows={3}
                    placeholder="Tell us about your child or anything you'd like to know…"
                    className={inp + " resize-none"} />
                </div>

                <button type="submit" disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: "#E8694A", boxShadow: "0 6px 20px rgba(232,105,74,0.3)" }}>
                  {status === "sending" ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-4">

            {/* Call card */}
            <div className="rounded-2xl p-5 text-white" style={{ background: "#178F78" }}>
              <h3 className="font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px" }}>
                Prefer to Call?
              </h3>
              <p className="text-white/70 text-xs mb-4">Speak with our admissions team during working hours.</p>
              <a href={`tel:${site.phone}`}
                className="flex items-center justify-center gap-2 bg-white rounded-full py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ color: "#178F78" }}>
                <Phone className="w-4 h-4" /> {site.phone}
              </a>
            </div>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4" style={{ color: "#E8694A" }} />
                <span className="font-bold text-stone-800 text-sm">Opening Hours</span>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { day: "Monday – Friday", hrs: site.hours.weekdays },
                  { day: "Saturday",        hrs: site.hours.saturday },
                  { day: "Sunday",          hrs: site.hours.sunday },
                ].map(h => (
                  <div key={h.day} className="flex justify-between text-xs">
                    <span className="text-stone-400">{h.day}</span>
                    <span className="font-semibold text-stone-700">{h.hrs}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Getting here */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <h3 className="font-bold text-stone-800 text-sm mb-2">📍 Getting Here</h3>
              <p className="text-xs text-stone-500 leading-relaxed mb-3">
                Located in Ananthnagar Phase 2, Electronic City. Easily accessible by public transport with ample parking.
              </p>
              <ul className="text-xs text-stone-500 space-y-1">
                <li>• Ananthnagar Park (500m)</li>
                <li>• City Hospital (1km)</li>
                <li>• Central Bus Station (1.5km)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="rounded-2xl overflow-hidden border border-stone-100 h-52">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
            title="Evergreen Preschool location"
          />
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-3xl mx-auto px-4 mt-10">
        <h2 className="text-2xl font-bold text-center mb-6" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {site.faq.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-semibold text-stone-800 text-sm pr-4">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-xs text-stone-500 leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center">
        <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(232,105,74,0.08), rgba(245,184,41,0.08), rgba(23,143,120,0.08))", border: "1.5px solid #EDE8DF" }}>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Fredoka', sans-serif", color: "#178F78" }}>
            Ready to Give Your Child the Best Start?
          </h2>
          <p className="text-stone-500 text-sm mb-5">Schedule a visit to our campus in Electronic City, Bengaluru.</p>
          <a href={`tel:${site.phone}`}
            className="inline-flex items-center gap-2 text-white font-bold px-7 py-3 rounded-full transition-all hover:-translate-y-0.5"
            style={{ background: "#E8694A", boxShadow: "0 6px 20px rgba(232,105,74,0.3)" }}>
            <Phone className="w-4 h-4" /> Call Us: {site.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
