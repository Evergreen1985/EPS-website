import Link from "next/link";
import { ExternalLink } from "lucide-react";
import site from "@/content/site.json";

const tools = [
  {
    icon:"📸",
    title:"Class Photo Gallery",
    color:"#E8694A",
    bg:"rgba(232,105,74,0.08)",
    badge:"Google Photos",
    badgeBg:"rgba(232,105,74,0.12)",
    badgeColor:"#993C1D",
    desc:"View daily photos and videos of your child's activities, events, and milestones uploaded by teachers.",
    features:["Daily classroom photos","Special event videos","Private — only shared parents can view","Download any photo anytime"],
    steps:["1. Click the link shared by your child's teacher on WhatsApp","2. Sign in with any Google account (Gmail)","3. Browse photos by date — newest first","4. Download or share with family"],
    cta:"Access Photo Gallery",
    href:"#",
    note:"Your class-specific link will be shared by your child's teacher via WhatsApp."
  },
  {
    icon:"📚",
    title:"Homework & Assignments",
    color:"#178F78",
    bg:"rgba(23,143,120,0.08)",
    badge:"Google Classroom",
    badgeBg:"rgba(23,143,120,0.12)",
    badgeColor:"#0F6E56",
    desc:"View homework, assignments and learning activities. Submit completed work as a photo directly from your phone.",
    features:["Daily homework tasks","Assignment submission by photo","Teacher feedback on submissions","Class announcements & notices"],
    steps:["1. Ask your child's teacher for the Google Classroom join code","2. Go to classroom.google.com or install the free app","3. Enter the join code to access your child's class","4. View and submit assignments anytime"],
    cta:"Open Google Classroom",
    href:"https://classroom.google.com",
    note:"You need a Gmail account. Ask your teacher for the class join code."
  },
  {
    icon:"🎥",
    title:"Live Classes & Parent Meetings",
    color:"#8957E5",
    bg:"rgba(137,87,229,0.08)",
    badge:"Google Meet",
    badgeBg:"rgba(137,87,229,0.12)",
    badgeColor:"#534AB7",
    desc:"Join live online classes, parent-teacher meetings, and school events from the comfort of your home.",
    features:["Online parent-teacher meetings","Holiday online classes","School event livestreams","One-on-one teacher consultations"],
    steps:["1. Click the meeting link shared by the school on WhatsApp","2. No app download needed — works in your browser","3. Join on your phone, tablet or laptop","4. Meetings are scheduled 24 hours in advance"],
    cta:"Download Google Meet App",
    href:"https://meet.google.com",
    note:"Meeting links are shared via WhatsApp before each session."
  },
  {
    icon:"📝",
    title:"Digital Report Cards",
    color:"#F5B829",
    bg:"rgba(245,184,41,0.08)",
    badge:"Google Drive",
    badgeBg:"rgba(245,184,41,0.15)",
    badgeColor:"#854F0B",
    desc:"Receive beautifully designed progress reports for your child at the end of each term as a downloadable PDF.",
    features:["Term-wise progress reports","Detailed teacher observations","Development milestone tracking","Downloadable PDF — share with family"],
    steps:["1. Report cards are sent as PDF links via WhatsApp","2. Click the link to view in your browser","3. Download or print anytime","4. Keep a digital record of all reports"],
    cta:"View Sample Report Card",
    href:"/ai-tools",
    note:"Report cards are issued at the end of each term (3 times per year)."
  },
];

const updates = [
  { icon:"📅", title:"School Calendar 2025–26", desc:"Term dates, holidays, exam schedule and events.", href:"#" },
  { icon:"📋", title:"Fee Payment Portal",       desc:"Pay monthly fees securely online via UPI or card.", href:"#" },
  { icon:"🍱", title:"Monthly Menu",              desc:"This month's lunch and snack menu for all programmes.", href:"#" },
  { icon:"📞", title:"Contact Teacher",           desc:"WhatsApp your child's class teacher directly.", href:`https://wa.me/91${site.phone}` },
];

export default function ParentPortalPage() {
  return (
    <div className="min-h-screen pb-20" style={{background:"#FEFCF8",fontFamily:"'Quicksand',sans-serif"}}>

      {/* Hero */}
      <div className="relative py-20 overflow-hidden" style={{background:"linear-gradient(135deg,#178F78,#0f6b5a)"}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle,white 1px,transparent 1px)",backgroundSize:"28px 28px"}}/>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl font-bold text-white mb-4" style={{fontFamily:"'Fredoka',sans-serif"}}>Parent Portal</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Everything you need to stay connected with your child&apos;s learning journey at Evergreen — all in one place.
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {updates.map(u=>(
            <a key={u.title} href={u.href} target={u.href.startsWith("http")?"_blank":"_self"}
              className="bg-white rounded-2xl border border-stone-100 p-5 hover:-translate-y-1 hover:shadow-md transition-all text-center">
              <div className="text-3xl mb-3">{u.icon}</div>
              <div className="font-bold text-stone-800 text-sm mb-1" style={{fontFamily:"'Fredoka',sans-serif"}}>{u.title}</div>
              <div className="text-xs text-stone-400 leading-relaxed">{u.desc}</div>
            </a>
          ))}
        </div>

        {/* Main tools */}
        <h2 className="text-3xl font-bold text-center mb-10" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>
          Your Learning Tools
        </h2>
        <div className="space-y-8">
          {tools.map((t,i)=>(
            <div key={i} className={`bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden`}>
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left */}
                  <div className="md:w-2/5">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                        style={{background:t.bg}}>{t.icon}</div>
                      <div>
                        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{background:t.badgeBg,color:t.badgeColor}}>
                          {t.badge}
                        </span>
                        <h3 className="text-xl font-bold mt-1" style={{fontFamily:"'Fredoka',sans-serif",color:t.color}}>{t.title}</h3>
                      </div>
                    </div>
                    <p className="text-stone-500 text-sm leading-relaxed mb-5">{t.desc}</p>
                    <ul className="space-y-2 mb-5">
                      {t.features.map((f,fi)=>(
                        <li key={fi} className="flex items-center gap-2 text-xs text-stone-600">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:t.color}}/>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a href={t.href} target={t.href.startsWith("http")?"_blank":"_self"}
                      className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-full text-white text-sm transition-all hover:-translate-y-0.5"
                      style={{background:t.color,boxShadow:`0 6px 20px ${t.color}40`}}>
                      {t.cta} <ExternalLink className="w-3.5 h-3.5"/>
                    </a>
                  </div>

                  {/* Right — how to use */}
                  <div className="md:w-3/5">
                    <div className="rounded-2xl p-5 h-full" style={{background:t.bg}}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{color:t.color}}>How to get started</p>
                      <ol className="space-y-3">
                        {t.steps.map((s,si)=>(
                          <li key={si} className="flex items-start gap-3 text-sm text-stone-700">
                            <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{background:t.color}}>{si+1}</span>
                            {s.replace(/^\d+\. /,"")}
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 pt-4 border-t" style={{borderColor:t.color+"20"}}>
                        <p className="text-xs text-stone-500 italic">💡 {t.note}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="max-w-3xl mx-auto px-4 mt-4">
        <div className="rounded-3xl p-8 text-center" style={{background:"linear-gradient(135deg,rgba(37,211,102,0.08),rgba(37,211,102,0.15))",border:"1.5px solid rgba(37,211,102,0.3)"}}>
          <div className="text-4xl mb-4">💬</div>
          <h2 className="text-2xl font-bold mb-3" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>
            Join Your Class WhatsApp Group
          </h2>
          <p className="text-stone-500 text-sm mb-5">
            All daily updates, photo links, homework reminders, and school notices are shared via WhatsApp. Ask your child&apos;s teacher to add you to the class group.
          </p>
          <a href={`https://wa.me/91${site.phone}?text=Hi! Please add me to my child's class WhatsApp group.`}
            target="_blank"
            className="inline-flex items-center gap-2 font-bold px-8 py-4 rounded-full text-white transition-all hover:-translate-y-0.5"
            style={{background:"#25D366",boxShadow:"0 8px 24px rgba(37,211,102,0.3)"}}>
            💬 Message Us on WhatsApp
          </a>
        </div>
      </div>

      {/* Need help */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <div className="bg-white rounded-3xl border border-stone-100 p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold mb-2" style={{fontFamily:"'Fredoka',sans-serif",color:"#178F78"}}>Need Help Accessing Any Tool?</h3>
          <p className="text-stone-500 text-sm mb-5">Our staff is always happy to help. Call or WhatsApp us anytime during school hours.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href={`tel:${site.phone}`} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full text-white"
              style={{background:"#E8694A"}}>📞 {site.phone}</a>
            <Link href="/contact" className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full border-2 transition-all hover:-translate-y-0.5"
              style={{borderColor:"#178F78",color:"#178F78"}}>Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
