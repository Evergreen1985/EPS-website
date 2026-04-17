"use client";
import { useState } from "react";
import { CheckCircle2, ChevronDown, Phone, Mail } from "lucide-react";
import site from "@/content/site.json";

const programs = [
  { id:"infant",      label:"Infant Care",         age:"9 months – 2 years" },
  { id:"playgroup",   label:"Playgroup",            age:"2–3 years" },
  { id:"nursery",     label:"Nursery",              age:"3–4 years" },
  { id:"jrkg",        label:"Junior KG",            age:"4–5 years" },
  { id:"srkg",        label:"Senior KG",            age:"5–6 years" },
  { id:"daycare",     label:"Full-Day Daycare",     age:"2–6 years" },
  { id:"afterschool", label:"After-School Program", age:"5–12 years" },
  { id:"holidaycamp", label:"Holiday Camp",         age:"3–12 years" },
];

const steps = [
  { icon:"📋", title:"Fill the Form",     desc:"Complete the online admission form below with your child's details." },
  { icon:"📞", title:"We Call You",       desc:"Our admissions team will call you within 1 business day." },
  { icon:"🏫", title:"Campus Visit",      desc:"Schedule a free visit to tour our facilities and meet the teachers." },
  { icon:"✅", title:"Confirm Admission", desc:"Submit documents, pay the registration fee and secure your child's seat." },
];

const docs = [
  "Child's birth certificate (original + photocopy)",
  "Child's recent passport-size photographs (4 copies)",
  "Immunisation / vaccination records",
  "Parent's / guardian's photo ID proof",
  "Parent's / guardian's address proof",
  "Previous school records (if applicable)",
];

const faqs = [
  { q:"When does admission open for the new academic year?",  a:"Admissions for the new academic year (June) open in January. We recommend applying early as seats fill up quickly, especially for Infant Care and Playgroup." },
  { q:"Is there a registration fee?",                         a:"Yes, a one-time non-refundable registration fee of ₹2,000 is payable to confirm your child's seat. This is separate from the monthly tuition fees." },
  { q:"Can I visit the school before applying?",              a:"Absolutely! We encourage all prospective parents to visit our campus. Call us or fill the form below to schedule a free guided tour." },
  { q:"Do you offer sibling discounts?",                      a:"Yes! Families enrolling a second child receive a 10% discount on monthly tuition fees for the second child." },
  { q:"Is there a waiting list if seats are full?",           a:"Yes, we maintain a waiting list. Fill the admission form and we will contact you as soon as a seat becomes available." },
];

type Status = "idle"|"sending"|"success";

export default function AdmissionsPage() {
  const [form, setForm] = useState({ parentName:"",phone:"",email:"",childName:"",childDob:"",program:"",message:"",heardFrom:"" });
  const [status, setStatus] = useState<Status>("idle");
  const [openFaq, setOpenFaq] = useState<number|null>(null);

  const set = (k:string,v:string) => setForm(p=>({...p,[k]:v}));
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault(); setStatus("sending");
    await new Promise(r=>setTimeout(r,1500)); setStatus("success");
  };

  const inp = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-teal-400 focus:bg-white focus:outline-none transition-all";
  const lbl = "block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen pb-20" style={{background:"#FEFCF8",fontFamily:"'Quicksand',sans-serif"}}>

      {/* Hero */}
      <div className="relative py-20 overflow-hidden" style={{background:"#178F78"}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-2 mb-5 text-white text-sm font-semibold">
            🎓 Now Enrolling — 2025–26 Academic Year
          </div>
          <h1 className="text-5xl font-bold text-white mb-4" style={{fontFamily:"'Fredoka',sans-serif"}}>Admission to Evergreen</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">Give your child the best start in life. Apply online in minutes — our team guides you every step.</p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <a href="#apply" className="font-bold px-8 py-3.5 rounded-full text-stone-900 transition-all hover:-translate-y-0.5"
              style={{background:"#F5B829",boxShadow:"0 8px 24px rgba(245,184,41,0.35)"}}>Apply Now ↓</a>
            <a href={`tel:${site.phone}`} className="font-bold px-8 py-3.5 rounded-full text-white border-2 border-white/40 hover:bg-white/10 transition-all">
              📞 Call Us
            </a>
          </div>
        </div>
      </div>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>How Admission Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s,i)=>(
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm"
                style={{background:i%2===0?"rgba(232,105,74,0.1)":"rgba(23,143,120,0.1)"}}>
                {s.icon}
              </div>
              <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mx-auto mb-2"
                style={{background:"#E8694A"}}>{i+1}</div>
              <h3 className="font-bold text-stone-800 mb-1" style={{fontFamily:"'Fredoka',sans-serif"}}>{s.title}</h3>
              <p className="text-stone-500 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programme selector */}
      <section style={{background:"#FAF0E8"}}>
        <div className="max-w-5xl mx-auto px-4 py-14">
          <h2 className="text-3xl font-bold text-center mb-8" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>Choose a Programme</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map(p=>(
              <div key={p.id} className="bg-white rounded-2xl border border-stone-100 p-5 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
                onClick={()=>{set("program",p.label);document.getElementById("apply")?.scrollIntoView({behavior:"smooth"});}}>
                <div className="font-bold text-stone-800 mb-1" style={{fontFamily:"'Fredoka',sans-serif"}}>{p.label}</div>
                <div className="text-xs text-stone-400 mb-2">{p.age}</div>
                <div className="text-xs font-semibold px-3 py-1 rounded-full inline-block" style={{background:"rgba(23,143,120,0.1)",color:"#178F78"}}>
                  Select →
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + sidebar */}
      <section id="apply" className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
              {status==="success" ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold mb-3" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>Application Received!</h3>
                  <p className="text-stone-500 mb-6">Our admissions team will call you within 1 business day.</p>
                  <div className="bg-stone-50 rounded-2xl p-5 text-left text-sm text-stone-600 space-y-2">
                    <p>📞 Urgent queries: <strong>{site.phone}</strong></p>
                    <p>✉️ Email: <strong>{site.email}</strong></p>
                    <p>🕐 Mon–Fri: {site.hours.weekdays}</p>
                  </div>
                  <button onClick={()=>setStatus("idle")} className="mt-5 font-bold px-6 py-2.5 rounded-full text-white" style={{background:"#E8694A"}}>
                    Submit Another
                  </button>
                </div>
              ):(
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>Online Admission Form</h2>
                    <p className="text-stone-400 text-xs">All fields marked * are required.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                    📋 Bring: Birth certificate, photos, immunisation records, parent ID when you visit.
                  </div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider pb-1 border-b border-stone-100">Parent / Guardian Details</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Parent Name *</label><input required className={inp} placeholder="Full name" value={form.parentName} onChange={e=>set("parentName",e.target.value)}/></div>
                    <div><label className={lbl}>Mobile (WhatsApp) *</label><input required className={inp} type="tel" placeholder="Phone number" value={form.phone} onChange={e=>set("phone",e.target.value)}/></div>
                  </div>
                  <div><label className={lbl}>Email Address *</label><input required className={inp} type="email" placeholder="your@email.com" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider pb-1 border-b border-stone-100 pt-2">Child Details</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className={lbl}>Child&apos;s Full Name *</label><input required className={inp} placeholder="Child's name" value={form.childName} onChange={e=>set("childName",e.target.value)}/></div>
                    <div><label className={lbl}>Date of Birth *</label><input required className={inp} type="date" value={form.childDob} onChange={e=>set("childDob",e.target.value)}/></div>
                  </div>
                  <div><label className={lbl}>Programme *</label>
                    <select required className={inp} value={form.program} onChange={e=>set("program",e.target.value)}>
                      <option value="">Select a programme</option>
                      {programs.map(p=><option key={p.id} value={p.label}>{p.label} ({p.age})</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>How did you hear about us?</label>
                    <select className={inp} value={form.heardFrom} onChange={e=>set("heardFrom",e.target.value)}>
                      <option value="">Select...</option>
                      {["Google Search","Google Maps","Friend / Family Referral","Facebook / Instagram","Near our school","Other"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className={lbl}>Questions or special requirements</label>
                    <textarea className={inp+" resize-none"} rows={3} placeholder="Ask about fees, transport, special needs..." value={form.message} onChange={e=>set("message",e.target.value)}/>
                  </div>
                  <button type="submit" disabled={status==="sending"}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-60"
                    style={{background:"#E8694A",boxShadow:"0 6px 20px rgba(232,105,74,0.3)"}}>
                    {status==="sending"
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Submitting…</>
                      : <>📋 Submit Application</>}
                  </button>
                  <p className="text-center text-xs text-stone-400">We will call you within 1 business day · No spam, ever</p>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
              <h3 className="font-bold text-stone-800 mb-4" style={{fontFamily:"'Fredoka',sans-serif"}}>📄 Documents Required</h3>
              <ul className="space-y-2">
                {docs.map((d,i)=>(
                  <li key={i} className="flex items-start gap-2 text-xs text-stone-500">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{color:"#178F78"}}/> {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{background:"#178F78"}}>
              <h3 className="font-bold mb-2" style={{fontFamily:"'Fredoka',sans-serif"}}>Prefer to Talk?</h3>
              <p className="text-white/70 text-xs mb-4">Our team is happy to answer your questions.</p>
              <a href={`tel:${site.phone}`} className="flex items-center justify-center gap-2 bg-white rounded-full py-2.5 text-sm font-bold hover:-translate-y-0.5 transition-all mb-2" style={{color:"#178F78"}}>
                <Phone className="w-4 h-4"/> {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 rounded-full py-2.5 text-sm font-semibold hover:bg-white/20 transition-all text-white">
                <Mail className="w-4 h-4"/> Email Us
              </a>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="text-2xl mb-2">🎁</div>
              <h3 className="font-bold text-amber-800 mb-1" style={{fontFamily:"'Fredoka',sans-serif"}}>Sibling Discount</h3>
              <p className="text-xs text-amber-700 leading-relaxed">Enroll a second child and get <strong>10% off monthly fees</strong>. Mention it during your call!</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 mb-10">
        <h2 className="text-3xl font-bold text-center mb-8" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>Admission FAQs</h2>
        <div className="space-y-3">
          {faqs.map((f,i)=>(
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              <button onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="font-semibold text-stone-800 text-sm pr-4">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${openFaq===i?"rotate-180":""}`}/>
              </button>
              {openFaq===i && <div className="px-5 pb-4 text-xs text-stone-500 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
