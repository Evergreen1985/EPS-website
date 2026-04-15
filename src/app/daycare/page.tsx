import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, CheckCircle2, Phone } from "lucide-react";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: "Daycare & After-School",
  description: "Full-day daycare (7 AM–7 PM), after-school program and holiday camps at Evergreen Preschool, Electronic City, Bengaluru.",
};

const daycareSchedule = [
  { time: "7:00 AM – 8:30 AM", activity: "Arrival & Free Play" },
  { time: "8:30 AM – 9:00 AM", activity: "Breakfast" },
  { time: "9:00 AM – 11:30 AM", activity: "Educational Activities (aligned with age group)" },
  { time: "11:30 AM – 12:30 PM", activity: "Outdoor Play" },
  { time: "12:30 PM – 1:15 PM", activity: "Lunch" },
  { time: "1:15 PM – 3:00 PM", activity: "Rest / Quiet Activities for Older Children" },
  { time: "3:00 PM – 3:30 PM", activity: "Afternoon Snack" },
  { time: "3:30 PM – 5:00 PM", activity: "Enrichment Activities & Indoor Play" },
  { time: "5:00 PM – 7:00 PM", activity: "Free Play & Departure" },
];

const afterSchoolSchedule = [
  { time: "3:00 PM – 3:30 PM", activity: "Arrival & Snack" },
  { time: "3:30 PM – 4:30 PM", activity: "Homework Time" },
  { time: "4:30 PM – 5:30 PM", activity: "Enrichment Activities / Special Interest Clubs" },
  { time: "5:30 PM – 6:30 PM", activity: "Outdoor Play / Indoor Games" },
  { time: "6:30 PM – 7:00 PM", activity: "Free Play & Departure" },
];

export default function DaycarePage() {
  return (
    <>
      {/* Header */}
      <div
        className="pt-36 pb-20 text-center"
        style={{ background: "linear-gradient(135deg, #0D2E1A 0%, #1A4D2E 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#74C69D" }}>
            Childcare Solutions
          </p>
          <h1 className="text-4xl md:text-5xl font-normal text-white mb-5 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Daycare & After-School Programs
          </h1>
          <p className="text-white/65 text-lg leading-relaxed max-w-2xl mx-auto">
            Flexible childcare solutions for working parents. Extended hours from early morning to evening — so your child is always in safe, caring hands.
          </p>
        </div>
      </div>

      {/* Three programs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title mb-2">Our Daycare Services</h2>
            <div className="w-10 h-0.5 rounded-full mt-4" style={{ background: "var(--amber)" }} />
          </div>

          <div className="space-y-10">
            {/* Full-Day Daycare */}
            <div className="rounded-3xl border border-stone-100 overflow-hidden">
              <div className="h-2" style={{ background: "#BFDBFE" }} />
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">🏡</span>
                    <div>
                      <h3 className="text-2xl font-normal" style={{ fontFamily: "var(--font-display)" }}>
                        Full-Day Daycare
                      </h3>
                      <p className="text-sm text-stone-400">Ages 2–6 · 7:00 AM – 7:00 PM</p>
                    </div>
                  </div>
                  <p className="text-stone-600 leading-relaxed mb-6">
                    Our comprehensive daycare programme provides all-day care combining educational activities with play, rest, and meals in a structured daily routine.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Programme Features</p>
                      <ul className="space-y-2">
                        {["Extended hours 7 AM – 7 PM", "Nutritious breakfast, lunch & snacks", "Age-appropriate educational activities", "Supervised indoor & outdoor play", "Quiet time & rest periods", "Regular parent updates"].map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--forest2)" }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Schedule Options</p>
                      <ul className="space-y-2 text-sm text-stone-600">
                        <li>• Full-week (Monday to Friday)</li>
                        <li>• Part-week (2–3 days per week)</li>
                        <li>• Flexible drop-in (subject to availability)</li>
                      </ul>
                    </div>
                  </div>
                  <Link href="/contact" className="btn-primary">
                    Enquire About Daycare <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div
                  className="lg:flex items-center justify-center p-10 hidden"
                  style={{ background: "#EFF6FF" }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏡</div>
                    <div className="text-3xl font-bold" style={{ color: "var(--forest)", fontFamily: "var(--font-display)" }}>
                      7 AM – 7 PM
                    </div>
                    <div className="text-stone-500 mt-2 text-sm">Mon to Friday</div>
                  </div>
                </div>
              </div>
            </div>

            {/* After-School */}
            <div className="rounded-3xl border border-stone-100 overflow-hidden">
              <div className="h-2" style={{ background: "#99F6E4" }} />
              <div className="grid lg:grid-cols-2 gap-0">
                <div
                  className="lg:flex items-center justify-center p-10 hidden order-last lg:order-first"
                  style={{ background: "#F0FDFA" }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚌</div>
                    <div className="text-3xl font-bold" style={{ color: "#0F766E", fontFamily: "var(--font-display)" }}>
                      3 PM – 7 PM
                    </div>
                    <div className="text-stone-500 mt-2 text-sm">Weekdays</div>
                  </div>
                </div>
                <div className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">🚌</span>
                    <div>
                      <h3 className="text-2xl font-normal" style={{ fontFamily: "var(--font-display)" }}>
                        After-School Program
                      </h3>
                      <p className="text-sm text-stone-400">Ages 5–12 · 3:00 PM – 7:00 PM</p>
                    </div>
                  </div>
                  <p className="text-stone-600 leading-relaxed mb-6">
                    A supportive environment for school-aged children to complete homework, engage in enrichment activities, and enjoy supervised recreation after school.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {["School pickup from selected nearby schools", "Supervised homework completion time", "Nutritious afternoon snacks", "Enrichment activities — arts, crafts, music", "Indoor and outdoor games", "Special interest clubs and activities"].map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#0F766E" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact" className="btn-primary">
                    Enquire About After-School <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Holiday Camps */}
            <div className="rounded-3xl border border-stone-100 overflow-hidden">
              <div className="h-2" style={{ background: "#FDE68A" }} />
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">⛺</span>
                    <div>
                      <h3 className="text-2xl font-normal" style={{ fontFamily: "var(--font-display)" }}>
                        Holiday Camps
                      </h3>
                      <p className="text-sm text-stone-400">Ages 3–12 · 8:00 AM – 5:30 PM</p>
                    </div>
                  </div>
                  <p className="text-stone-600 leading-relaxed mb-6">
                    During school holidays, we offer special camp programmes filled with fun activities, field trips, and themed projects to keep children engaged and learning.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Camp Features</p>
                      <ul className="space-y-2">
                        {["Weekly themes & special projects", "Arts, crafts & creative activities", "Sports & outdoor adventures", "Educational workshops", "Local field trips", "Special guests"].map(f => (
                          <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--forest2)" }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Available During</p>
                      <ul className="space-y-1.5 text-sm text-stone-600">
                        <li>• Summer vacation</li>
                        <li>• Diwali break</li>
                        <li>• Winter holidays</li>
                        <li>• Other school holidays</li>
                      </ul>
                    </div>
                  </div>
                  <Link href="/contact" className="btn-primary">
                    Enquire About Holiday Camps <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div
                  className="lg:flex items-center justify-center p-10 hidden"
                  style={{ background: "#FFFBEB" }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">⛺</div>
                    <div className="text-3xl font-bold" style={{ color: "#92400E", fontFamily: "var(--font-display)" }}>
                      8 AM – 5:30 PM
                    </div>
                    <div className="text-stone-500 mt-2 text-sm">School holidays</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily schedules */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Sample Daily Schedule</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Full-day schedule */}
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100" style={{ background: "var(--leaf)" }}>
                <h3 className="font-semibold text-stone-900">Full-Day Daycare</h3>
              </div>
              <div className="divide-y divide-stone-50">
                {daycareSchedule.map((row, i) => (
                  <div key={i} className={`flex gap-4 px-6 py-3 ${i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}`}>
                    <span className="text-xs font-semibold text-stone-400 shrink-0 w-32">{row.time}</span>
                    <span className="text-sm text-stone-700">{row.activity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After-school schedule */}
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100" style={{ background: "#F0FDFA" }}>
                <h3 className="font-semibold text-stone-900">After-School Program</h3>
              </div>
              <div className="divide-y divide-stone-50">
                {afterSchoolSchedule.map((row, i) => (
                  <div key={i} className={`flex gap-4 px-6 py-3 ${i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}`}>
                    <span className="text-xs font-semibold text-stone-400 shrink-0 w-32">{row.time}</span>
                    <span className="text-sm text-stone-700">{row.activity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-stone-400 mt-5">
            Schedules are flexible and may be adjusted based on children&apos;s needs, weather, and special activities.
          </p>
        </div>
      </section>

      {/* Meals section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="section-title mb-4">Nutrition & Meals</h2>
              <div className="w-10 h-0.5 rounded-full mb-6" style={{ background: "var(--amber)" }} />
              <p className="text-stone-600 leading-relaxed mb-5">
                We provide nutritious, balanced meals and snacks prepared fresh daily. Our menu meets children&apos;s nutritional needs while introducing them to a variety of healthy foods.
              </p>
              <ul className="space-y-2">
                {["Balanced meals with age-appropriate portions", "Fresh fruits and vegetables served daily", "Limited sugar and processed foods", "Accommodation for food allergies", "Weekly menu shared with parents in advance"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--forest2)" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl p-8 text-center" style={{ background: "var(--leaf)" }}>
              <div className="text-6xl mb-4">🥗</div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Home-style Meals</h3>
              <p className="text-sm text-stone-500">
                Parents are also welcome to provide meals from home, especially for children with specific dietary preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enrollment info */}
      <section className="py-20" style={{ background: "var(--warm50)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-2">Enrollment Information</h2>
            <div className="w-10 h-0.5 rounded-full mx-auto mt-4" style={{ background: "var(--amber)" }} />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-3xl mb-4">📋</div>
              <h3 className="font-semibold text-stone-900 mb-3">Registration Process</h3>
              <ol className="space-y-2 text-sm text-stone-600 list-decimal list-inside">
                <li>Contact us to check availability</li>
                <li>Schedule a visit to tour our facility</li>
                <li>Complete registration forms</li>
                <li>Submit required documentation</li>
                <li>Pay registration fee and first month's tuition</li>
              </ol>
            </div>
            <div className="card">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="font-semibold text-stone-900 mb-3">Required Documents</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li>• Completed application form</li>
                <li>• Child&apos;s birth certificate</li>
                <li>• Immunisation records</li>
                <li>• Medical information & emergency contacts</li>
                <li>• Pickup authorisation form</li>
              </ul>
            </div>
            <div className="card">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-semibold text-stone-900 mb-3">Fee Structure</h3>
              <p className="text-sm text-stone-600 mb-3">
                Fees vary by programme and schedule. Please contact us for current rates and payment options.
              </p>
              <ul className="space-y-1.5 text-sm text-stone-600">
                <li>• Monthly payment plans</li>
                <li>• Sibling discounts available</li>
                <li>• Annual payment options</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link href="/contact" className="btn-primary">
              Contact Us for Enrollment <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center" style={{ background: "var(--forest)" }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-normal text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Reliable Childcare When You Need It
          </h2>
          <p className="text-white/65 mb-8">Contact us today to learn more about our daycare and after-school programmes.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contact" className="btn-amber">Get in Touch <ArrowRight className="w-4 h-4" /></Link>
            <a href={`tel:${site.phone}`} className="btn-white"><Phone className="w-4 h-4" /> {site.phone}</a>
          </div>
        </div>
      </section>
    </>
  );
}
