"use client";
import { useState } from "react";
import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2, ChevronDown } from "lucide-react";
import site from "@/content/site.json";

type Status = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", childAge: "", program: "", message: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("success");
  };

  const inputClass =
    "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-100 transition-all";

  return (
    <>
      {/* Header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#74C69D" }}>Get in Touch</p>
          <h1 className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Contact Us
          </h1>
          <p className="text-white/65 text-lg">
            Reach out for admissions, programme details, or to schedule a campus visit. We reply within one business day.
          </p>
        </div>
      </div>

      {/* Info cards row */}
      <section className="py-14 bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <MapPin className="w-5 h-5" />,
                title: "Our Location",
                lines: [site.address],
              },
              {
                icon: <Phone className="w-5 h-5" />,
                title: "Phone Number",
                lines: [site.phone],
                href: `tel:${site.phone}`,
              },
              {
                icon: <Mail className="w-5 h-5" />,
                title: "Email Address",
                lines: [site.email],
                href: `mailto:${site.email}`,
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: "Hours of Operation",
                lines: [
                  `Mon – Fri: ${site.hours.weekdays}`,
                  `Saturday: ${site.hours.saturday}`,
                  `Sunday: ${site.hours.sunday}`,
                ],
              },
            ].map((card) => (
              <div key={card.title} className="card">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4"
                  style={{ background: "var(--forest)" }}
                >
                  {card.icon}
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">{card.title}</h3>
                {card.lines.map((l) =>
                  card.href ? (
                    <a key={l} href={card.href} className="block text-sm text-stone-500 hover:text-forest transition-colors leading-relaxed" style={{ color: "inherit" }}>
                      {l}
                    </a>
                  ) : (
                    <p key={l} className="text-sm text-stone-500 leading-relaxed">{l}</p>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl border border-stone-100 p-8">
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                      style={{ background: "var(--leaf)" }}
                    >
                      <CheckCircle2 className="w-8 h-8" style={{ color: "var(--forest)" }} />
                    </div>
                    <h3 className="text-2xl font-normal text-stone-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                      Message Sent!
                    </h3>
                    <p className="text-stone-500 max-w-sm text-sm">
                      Thank you for reaching out. Our team will get back to you within one business day.
                    </p>
                    <button
                      onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", childAge: "", program: "", message: "" }); }}
                      className="btn-primary mt-6"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-2xl font-normal text-stone-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
                        Send Us a Message
                      </h2>
                      <p className="text-stone-400 text-sm">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                        <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email Address *</label>
                        <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Phone Number *</label>
                        <input type="tel" name="phone" required value={form.phone} onChange={handleChange} placeholder="Your mobile number" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Child&apos;s Age</label>
                        <select name="childAge" value={form.childAge} onChange={handleChange} className={inputClass}>
                          <option value="">Select age range</option>
                          <option value="2-3">2–3 years (Playgroup)</option>
                          <option value="3-4">3–4 years (Nursery)</option>
                          <option value="4-5">4–5 years (Jr. KG)</option>
                          <option value="5-6">5–6 years (Sr. KG)</option>
                          <option value="6+">6+ years (After-School)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Interested Programme</label>
                      <select name="program" value={form.program} onChange={handleChange} className={inputClass}>
                        <option value="">Select a programme</option>
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
                      <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Message *</label>
                      <textarea
                        name="message" required value={form.message} onChange={handleChange} rows={4}
                        placeholder="Tell us about your child, your schedule, or anything else you'd like to know…"
                        className={inputClass}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "sending" ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Sending…
                        </span>
                      ) : (
                        <><Send className="w-4 h-4" /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              {/* Quick call card */}
              <div className="rounded-2xl p-6 text-white" style={{ background: "var(--forest)" }}>
                <h3 className="text-lg font-normal mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  Prefer to Call?
                </h3>
                <p className="text-white/65 text-sm mb-4">
                  Speak directly with our admissions team during working hours.
                </p>
                <a
                  href={`tel:${site.phone}`}
                  className="btn-amber w-full justify-center"
                >
                  <Phone className="w-4 h-4" /> {site.phone}
                </a>
              </div>

              {/* Getting here */}
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h3 className="text-base font-semibold text-stone-900 mb-3">Getting Here</h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-3">
                  We are conveniently located in Ananthnagar Phase 2, easily accessible by public transport with ample parking for parents.
                </p>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Nearby Landmarks</p>
                <ul className="space-y-1 text-sm text-stone-500">
                  <li>• Ananthnagar Park (500m)</li>
                  <li>• City Hospital (1km)</li>
                  <li>• Central Bus Station (1.5km)</li>
                </ul>
              </div>

              {/* Hours */}
              <div
                className="rounded-2xl border p-6"
                style={{ background: "var(--leaf)", borderColor: "var(--leaf2)" }}
              >
                <h3 className="text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--forest)" }} />
                  Hours of Operation
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { day: "Monday – Friday", hours: site.hours.weekdays },
                    { day: "Saturday", hours: site.hours.saturday },
                    { day: "Sunday", hours: site.hours.sunday },
                  ].map((h) => (
                    <div key={h.day} className="flex justify-between">
                      <span className="text-stone-500">{h.day}</span>
                      <span className="font-semibold text-stone-800">{h.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <div className="h-72 bg-stone-200">
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&output=embed`}
          className="w-full h-full border-0"
          loading="lazy"
          title="Evergreen Preschool location map"
        />
      </div>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Frequently Asked Questions</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="space-y-3">
            {site.faq.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-100 bg-white overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-stone-900 text-sm pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-stone-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-stone-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Ready to Give Your Child the Best Start?
          </h2>
          <p className="text-white/65 mb-8">Schedule a visit to our campus today.</p>
          <a href={`tel:${site.phone}`} className="btn-amber">
            <Phone className="w-4 h-4" /> Call Us Now
          </a>
        </div>
      </section>
    </>
  );
}
