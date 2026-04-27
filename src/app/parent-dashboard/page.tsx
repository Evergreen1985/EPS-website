"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _sb: SupabaseClient | null = null;
async function getSb() {
  if (_sb) return _sb;
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) {
    const cfg = await fetch("/api/config").then(r => r.json());
    url = cfg.supabaseUrl; key = cfg.supabaseKey;
  }
  _sb = createClient(url, key);
  return _sb;
}

const PROGRAMS: Record<string, { label:string; icon:string; color:string; schedule:string; highlights:string[] }> = {
  "infant":     { label:"Infant Care",     icon:"🍼", color:"#EC4899", schedule:"9:00 AM – 3:30 PM", highlights:["Sensory play daily","Primary caregiver assigned","Feeding & sleep schedule maintained","Daily parent updates"] },
  "playgroup":  { label:"Playgroup",        icon:"🎈", color:"#E8694A", schedule:"9:00 AM – 3:30 PM", highlights:["Language development","Motor skill activities","Music & movement","Creative play"] },
  "nursery":    { label:"Nursery",          icon:"🌸", color:"#F5B829", schedule:"9:00 AM – 3:30 PM", highlights:["Pre-literacy & numeracy","Cooperative play","Arts & self-expression","Science exploration"] },
  "jrkg":       { label:"Junior KG",        icon:"📚", color:"#6366F1", schedule:"9:00 AM – 3:30 PM", highlights:["Phonics & reading","Basic maths concepts","Science awareness","Critical thinking"] },
  "srkg":       { label:"Senior KG",        icon:"🎓", color:"#178F78", schedule:"9:00 AM – 3:30 PM", highlights:["Reading & writing","Advanced numeracy","School readiness","Social skills"] },
  "daycare":    { label:"Full-Day Daycare", icon:"🏡", color:"#0F766E", schedule:"7:00 AM – 7:00 PM", highlights:["Meals provided","Rest periods","Educational activities","Extended care"] },
  "afterschool":{ label:"After-School",     icon:"🚌", color:"#7C3AED", schedule:"3:00 PM – 7:00 PM", highlights:["Homework help","Enrichment activities","Snacks provided","Supervised play"] },
};

const EVENT_TYPE_COLORS: Record<string,string> = { holiday:"#E8694A", festival:"#F5B829", activity:"#178F78", exam:"#6366F1", ptm:"#EC4899", sports:"#0F766E" };

export default function ParentDashboardPage() {
  const router = useRouter();
  const [session, setSession]        = useState<any>(null);
  const [children, setChildren]      = useState<any[]>([]);
  const [selectedChild, setSelected] = useState<any>(null);
  const [calendarEvents, setCalEvts] = useState<any[]>([]);
  const [announcements, setAnnounce] = useState<any[]>([]);
  const [homework, setHomework]      = useState<any[]>([]);
  const [photos, setPhotos]          = useState<any[]>([]);
  const [loading, setLoading]        = useState(true);
  const [tab, setTab]                = useState<"home"|"homework"|"calendar"|"profile"|"photos">("home");
  const [profileUploading, setProfileUploading] = useState(false);
  const [profileError, setProfileError]         = useState("");

  const now      = new Date();
  const monthKey = String(now.getMonth()+1).padStart(2,"0");
  const monthName= now.toLocaleString("default", { month:"long" });
  const year     = now.getFullYear();
  const month    = `${year}-${monthKey}`;

  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() }; // 0-indexed
  });

  const viewMonthStr  = `${viewMonth.year}-${String(viewMonth.month+1).padStart(2,"0")}`;
  const viewMonthName = new Date(viewMonth.year, viewMonth.month, 1).toLocaleString("default", { month:"long" });
  const [calEventsView, setCalEventsView] = useState<any[]>([]);

  // Fetch events when viewMonth changes
  useEffect(() => {
    if (!session?.phone) return;
    fetch(`/api/admin/calendar?month=${viewMonthStr}`)
      .then(r => r.json())
      .then(d => setCalEventsView(d.events || []));
  }, [session, viewMonthStr]);

  const prevMonth = () => setViewMonth(p => {
    const d = new Date(p.year, p.month - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const nextMonth = () => setViewMonth(p => {
    const d = new Date(p.year, p.month + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const goToday   = () => { const n = new Date(); setViewMonth({ year: n.getFullYear(), month: n.getMonth() }); };

  // ── Load session ─────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("ep_parent_session");
    if (!stored) { router.replace("/parent-login"); return; }
    const s = JSON.parse(stored);
    if (Date.now() - s.loginTime > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("ep_parent_session");
      router.replace("/parent-login"); return;
    }
    setSession(s);
  }, [router]);

  // ── Load dashboard data ──────────────────────────────
  useEffect(() => {
    if (!session?.phone) return;
    fetch(`/api/parent/dashboard?phone=${encodeURIComponent(session.phone)}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        setChildren(data.enquiries || []);
        setCalEvts(data.calendarEvents || []);
        setAnnounce(data.announcements || []);
        setHomework(data.homework || []);
        setPhotos(data.photos || []);
        if (data.enquiries?.length === 1) setSelected(data.enquiries[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session, month]);

  const logout = () => { localStorage.removeItem("ep_parent_session"); router.replace("/parent-login"); };

  const prog     = selectedChild ? PROGRAMS[selectedChild.program_id] || PROGRAMS["nursery"] : null;
  const holidays = calendarEvents.filter(e => e.is_holiday);
  const festivals= calendarEvents.filter(e => e.event_type === "festival" || e.event_type === "holiday");
  const activities= calendarEvents.filter(e => e.event_type === "activity" || e.event_type === "sports" || e.event_type === "ptm" || e.event_type === "exam");
  const hasSection = !!selectedChild?.section_id;

  // Calendar grid
  const daysInMonth = new Date(year, now.getMonth()+1, 0).getDate();
  const firstDay    = new Date(year, now.getMonth(), 1).getDay();

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#FEFCF8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Quicksand',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"40px", height:"40px", border:"3px solid #EDE8DF", borderTopColor:"#178F78", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
        <div style={{ color:"#6B7A99", fontSize:"13px" }}>Loading your dashboard…</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#FEFCF8", fontFamily:"'Quicksand',sans-serif" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#178F78,#0f6b5a)", padding:"16px 20px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"white" }}>
              👋 Welcome{session?.childName ? `, ${session.childName}'s Parent` : ""}!
            </div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", marginTop:"2px" }}>{session?.phone}</div>
          </div>
          <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"20px", padding:"6px 14px", color:"white", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            <LogOut style={{ width:"14px", height:"14px" }} /> Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"16px" }}>

        {/* Child selector */}
        {children.length > 0 && (
          <div style={{ marginBottom:"16px" }}>
            {children.length > 1 && <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>Select Child</div>}
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {children.map(child => (
                <button key={child.id} onClick={() => { setSelected(child); setTab("home"); }}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 16px", borderRadius:"16px", border:`2px solid ${selectedChild?.id===child.id ? "#178F78" : "#EDE8DF"}`, background:selectedChild?.id===child.id ? "rgba(23,143,120,0.08)" : "white", cursor:"pointer", transition:"all 0.2s" }}>
                  {child.photo_url ? (
                    <img src={child.photo_url} alt={child.child_name}
                      style={{ width:"40px", height:"40px", borderRadius:"50%", objectFit:"cover", border:"2px solid #EDE8DF", flexShrink:0 }} />
                  ) : (
                    <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>
                      {PROGRAMS[child.program_id]?.icon || "🧒"}
                    </div>
                  )}
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{child.child_name}</div>
                    <div style={{ fontSize:"10px", color:"#6B7A99" }}>
                      {child.program_label}
                      {child.section_name && <span style={{ color:"#178F78", fontWeight:700 }}> · {child.section_name}</span>}
                    </div>
                  </div>
                  {selectedChild?.id===child.id && <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#178F78", marginLeft:"4px" }} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {children.length === 0 && (
          <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"32px", textAlign:"center", marginBottom:"16px" }}>
            <div style={{ fontSize:"36px", marginBottom:"10px" }}>📋</div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", color:"#178F78", marginBottom:"6px" }}>No children enrolled yet</div>
            <Link href="/enquiry" style={{ background:"#E8694A", color:"white", borderRadius:"20px", padding:"9px 22px", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Submit Enquiry →</Link>
          </div>
        )}

        {/* Tabs */}
        {selectedChild && (
          <>
            <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:"white", borderRadius:"16px", padding:"4px", border:"1px solid #EDE8DF" }}>
              {[
                { key:"home",     icon:"🏠", label:"Home" },
                { key:"homework", icon:"📚", label:"Homework" },
                { key:"calendar", icon:"📅", label:"Calendar" },
                { key:"photos",   icon:"📸", label:"Photos" },
                { key:"profile",  icon:"👶", label:"Profile" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  style={{ flex:1, padding:"8px 4px", borderRadius:"12px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", transition:"all 0.2s",
                    background:tab===t.key ? "#178F78" : "transparent",
                    color:tab===t.key ? "white" : "#6B7A99" }}>
                  <span style={{ fontSize:"16px" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* HOME TAB */}
            {tab === "home" && (
              <div>
                {prog && (
                  <div style={{ background:"white", borderRadius:"20px", border:`2px solid ${prog.color}33`, padding:"16px", marginBottom:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px" }}>
                      <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`${prog.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>{prog.icon}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:prog.color }}>{prog.label}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>⏰ {prog.schedule}</div>
                        {selectedChild.section_name && <div style={{ fontSize:"11px", color:"#178F78", fontWeight:700 }}>📚 {selectedChild.section_name}</div>}
                      </div>
                      <div style={{ background:`${prog.color}12`, borderRadius:"12px", padding:"6px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#6B7A99" }}>Status</div>
                        <div style={{ fontSize:"11px", fontWeight:700, color:prog.color, textTransform:"capitalize" }}>{selectedChild.status || "Enquired"}</div>
                      </div>
                    </div>
                    {!hasSection && (
                      <div style={{ background:"rgba(245,184,41,0.08)", border:"1px solid rgba(245,184,41,0.25)", borderRadius:"12px", padding:"9px 12px", fontSize:"11px", color:"#B08000" }}>
                        ⏳ Section not yet assigned. Homework and class photos will appear once admin assigns your child to a section.
                      </div>
                    )}
                  </div>
                )}

                {/* This month from DB */}
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"12px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                    <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78" }}>🗓️ {monthName} {year}</div>
                    <span style={{ fontSize:"10px", color:"#6B7A99", background:"#FAF0E8", borderRadius:"20px", padding:"3px 10px" }}>{calendarEvents.length} events</span>
                  </div>

                  {calendarEvents.length === 0 ? (
                    <div style={{ fontSize:"12px", color:"#6B7A99", textAlign:"center", padding:"12px 0" }}>
                      No events this month. Admin can add events from the admin panel.
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                      {calendarEvents.map(ev => (
                        <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 12px", borderRadius:"12px", background:ev.is_holiday ? `${ev.color}0d` : "#FAF0E8", border:`1px solid ${ev.color}25` }}>
                          <span style={{ fontSize:"18px", flexShrink:0 }}>{ev.icon}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:"12px", fontWeight:700, color:"#1A2F4A" }}>{ev.title}</div>
                            <div style={{ fontSize:"10px", color:"#6B7A99" }}>
                              {new Date(ev.event_date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}
                              {ev.description && ` · ${ev.description}`}
                            </div>
                          </div>
                          {ev.is_holiday
                            ? <span style={{ fontSize:"9px", fontWeight:700, color:"#E8694A", background:"rgba(232,105,74,0.12)", borderRadius:"20px", padding:"2px 8px", whiteSpace:"nowrap" }}>HOLIDAY</span>
                            : <span style={{ fontSize:"9px", fontWeight:700, color:ev.color, background:`${ev.color}15`, borderRadius:"20px", padding:"2px 8px", whiteSpace:"nowrap", textTransform:"uppercase" }}>{ev.event_type}</span>
                          }
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Announcements */}
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px" }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"10px" }}>📢 Announcements</div>
                  {announcements.length === 0 ? (
                    <div style={{ textAlign:"center", color:"#6B7A99", fontSize:"12px", padding:"12px" }}>No announcements yet. Check back soon!</div>
                  ) : announcements.map((a:any) => (
                    <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid #EDE8DF" }}>
                      <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A", marginBottom:"3px" }}>{a.title}</div>
                      <div style={{ fontSize:"11px", color:"#6B7A99" }}>{a.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HOMEWORK TAB */}
            {tab === "homework" && (
              <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px" }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#178F78", marginBottom:"14px" }}>📚 Homework — {monthName}</div>
                {!hasSection ? (
                  <div style={{ background:"rgba(245,184,41,0.08)", border:"1px solid rgba(245,184,41,0.25)", borderRadius:"16px", padding:"20px", textAlign:"center" }}>
                    <div style={{ fontSize:"28px", marginBottom:"8px" }}>⏳</div>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#B08000", marginBottom:"4px" }}>Section not assigned yet</div>
                    <div style={{ fontSize:"12px", color:"#6B7A99" }}>Homework will appear here once admin assigns your child to a class section.</div>
                  </div>
                ) : homework.length === 0 ? (
                  <div style={{ background:"rgba(23,143,120,0.06)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"14px", padding:"20px", textAlign:"center" }}>
                    <div style={{ fontSize:"28px", marginBottom:"8px" }}>🎉</div>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78" }}>No pending homework!</div>
                  </div>
                ) : homework.map((hw:any) => (
                  <div key={hw.id} style={{ border:"1px solid #EDE8DF", borderRadius:"14px", padding:"14px", marginBottom:"10px" }}>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A", marginBottom:"4px" }}>{hw.title}</div>
                    <div style={{ fontSize:"11px", color:"#6B7A99", marginBottom:"6px" }}>{hw.description}</div>
                    <div style={{ fontSize:"11px", color:"#E8694A", fontWeight:700 }}>Due: {new Date(hw.due_date).toLocaleDateString("en-IN")}</div>
                  </div>
                ))}
              </div>
            )}

            {/* CALENDAR TAB */}
            {tab === "calendar" && (
              <div>
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"12px" }}>
                  {/* Month navigation */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
                    <button onClick={prevMonth}
                      style={{ width:"34px", height:"34px", borderRadius:"50%", border:"1px solid #EDE8DF", background:"#FAF0E8", fontSize:"16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#178F78", fontWeight:700 }}>‹</button>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#178F78" }}>
                        {viewMonthName} {viewMonth.year}
                      </div>
                      {viewMonthStr !== `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}` && (
                        <button onClick={goToday} style={{ fontSize:"10px", color:"#E8694A", background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>Back to today</button>
                      )}
                    </div>
                    <button onClick={nextMonth}
                      style={{ width:"34px", height:"34px", borderRadius:"50%", border:"1px solid #EDE8DF", background:"#FAF0E8", fontSize:"16px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#178F78", fontWeight:700 }}>›</button>
                  </div>

                  {/* Calendar grid */}
                  {(() => {
                    const dIM = new Date(viewMonth.year, viewMonth.month+1, 0).getDate();
                    const fD  = new Date(viewMonth.year, viewMonth.month, 1).getDay();
                    const mStr = viewMonthStr;
                    return (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"12px" }}>
                        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                          <div key={d} style={{ textAlign:"center", fontSize:"10px", fontWeight:700, color:"#6B7A99", padding:"4px 0" }}>{d}</div>
                        ))}
                        {Array.from({ length: fD }).map((_,i) => <div key={`e${i}`} />)}
                        {Array.from({ length: dIM }).map((_,i) => {
                          const day = i+1;
                          const date = `${mStr}-${String(day).padStart(2,"0")}`;
                          const dayEvents = calEventsView.filter(ev => ev.event_date === date);
                          const isToday  = viewMonth.year === now.getFullYear() && viewMonth.month === now.getMonth() && day === now.getDate();
                          const isHoliday= dayEvents.some(ev => ev.is_holiday);
                          const isSun    = (fD+i)%7===0;
                          return (
                            <div key={day} title={dayEvents.map(ev=>ev.title).join(", ")}
                              style={{ textAlign:"center", padding:"5px 2px", borderRadius:"8px", fontSize:"12px", fontWeight:isToday?700:400, position:"relative",
                                background:isToday?"#178F78":isHoliday?"rgba(232,105,74,0.08)":"transparent",
                                color:isToday?"white":isHoliday?"#E8694A":isSun?"#E8694A":"#1A2F4A" }}>
                              {day}
                              {dayEvents.length > 0 && !isToday && <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:dayEvents[0].color, margin:"1px auto 0" }} />}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Events list for view month */}
                {calEventsView.length > 0 ? (
                  <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px" }}>
                    <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"12px" }}>Events in {viewMonthName}</div>
                    {calEventsView.map(ev => (
                      <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"9px 0", borderBottom:"1px solid #EDE8DF" }}>
                        <span style={{ fontSize:"20px" }}>{ev.icon}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{ev.title}
                            {ev.is_holiday && <span style={{ marginLeft:"6px", background:"rgba(232,105,74,0.1)", color:"#E8694A", borderRadius:"20px", padding:"1px 7px", fontSize:"9px", fontWeight:700 }}>HOLIDAY</span>}
                          </div>
                          <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                            {new Date(ev.event_date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })}
                            {ev.description && ` · ${ev.description}`}
                          </div>
                        </div>
                        <span style={{ fontSize:"10px", fontWeight:700, color:EVENT_TYPE_COLORS[ev.event_type]||"#6B7A99", background:`${EVENT_TYPE_COLORS[ev.event_type]||"#6B7A99"}15`, borderRadius:"20px", padding:"2px 8px", textTransform:"capitalize", whiteSpace:"nowrap" }}>{ev.event_type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px", textAlign:"center", color:"#6B7A99", fontSize:"13px" }}>
                    No events for {viewMonthName} {viewMonth.year}
                  </div>
                )}
              </div>
            )}

            {/* PHOTOS TAB */}
            {tab === "photos" && (
              <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px" }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#178F78", marginBottom:"14px" }}>📸 Class Photos</div>
                {!hasSection ? (
                  <div style={{ background:"rgba(245,184,41,0.08)", border:"1px solid rgba(245,184,41,0.25)", borderRadius:"16px", padding:"24px", textAlign:"center" }}>
                    <div style={{ fontSize:"32px", marginBottom:"8px" }}>📸</div>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#B08000", marginBottom:"4px" }}>Section not assigned yet</div>
                    <div style={{ fontSize:"12px", color:"#6B7A99" }}>Class photos will appear here once admin assigns your child to a section.</div>
                  </div>
                ) : photos.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"24px", color:"#6B7A99" }}>
                    <div style={{ fontSize:"32px", marginBottom:"8px" }}>🌿</div>
                    <div style={{ fontSize:"13px" }}>No photos uploaded yet for {selectedChild.section_name}.</div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:"10px" }}>
                    {photos.map((p:any) => (
                      <div key={p.id} style={{ borderRadius:"14px", overflow:"hidden", border:"1px solid #EDE8DF" }}>
                        <img src={p.photo_url} alt={p.title || "Class photo"} style={{ width:"100%", height:"130px", objectFit:"cover", display:"block" }} />
                        {p.title && <div style={{ padding:"6px 8px", fontSize:"10px", color:"#6B7A99", fontWeight:600 }}>{p.title}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {tab === "profile" && (
              <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px" }}>
                {/* Profile photo */}
                <div style={{ textAlign:"center", marginBottom:"20px" }}>
                  <div style={{ position:"relative", width:"90px", margin:"0 auto 10px" }}>
                    {selectedChild.photo_url ? (
                      <img src={selectedChild.photo_url} alt={selectedChild.child_name}
                        style={{ width:"90px", height:"90px", borderRadius:"50%", objectFit:"cover", border:"3px solid #178F78" }} />
                    ) : (
                      <div style={{ width:"90px", height:"90px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px", border:"3px solid #EDE8DF" }}>
                        {prog?.icon || "🧒"}
                      </div>
                    )}
                    {profileUploading && (
                      <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ width:"24px", height:"24px", border:"3px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
                      </div>
                    )}
                    <label htmlFor="profile-photo-input" style={{ position:"absolute", bottom:0, right:0, width:"28px", height:"28px", borderRadius:"50%", background:profileUploading?"#ccc":"#178F78", border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center", cursor:profileUploading?"not-allowed":"pointer", fontSize:"14px" }}>
                      📷
                    </label>
                    <input id="profile-photo-input" type="file" accept="image/*" style={{ display:"none" }}
                      disabled={profileUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setProfileUploading(true);
                        setProfileError("");
                        try {
                          const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                          const fileName = `profiles/${selectedChild.id}.${ext}`;

                          const sb = await getSb();
                          const { error: storageErr } = await sb.storage
                            .from("school-photos")
                            .upload(fileName, file, { contentType: file.type, upsert: true });

                          if (storageErr) { setProfileError(storageErr.message); setProfileUploading(false); return; }

                          const { data: urlData } = sb.storage.from("school-photos").getPublicUrl(fileName);
                          const photoUrl = urlData.publicUrl + `?t=${Date.now()}`;

                          // Save URL to DB via API
                          const res  = await fetch("/api/photos/profile", {
                            method:"POST", headers:{"Content-Type":"application/json"},
                            body: JSON.stringify({ enquiryId: selectedChild.id, photoUrl }),
                          });
                          const data = await res.json();
                          if (data.error) { setProfileError(data.error); } else {
                            setChildren(prev => prev.map(c => c.id === selectedChild.id ? { ...c, photo_url: photoUrl } : c));
                            setSelected((p: any) => ({ ...p, photo_url: photoUrl }));
                          }
                        } catch (err: any) {
                          setProfileError(err?.message || "Upload failed");
                        }
                        setProfileUploading(false);
                        e.target.value = "";
                      }} />
                  </div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#178F78" }}>{selectedChild.child_name}</div>
                  <div style={{ fontSize:"12px", color:"#6B7A99" }}>{selectedChild.program_label}{selectedChild.section_name && ` · ${selectedChild.section_name}`}</div>
                  <div style={{ fontSize:"10px", color:profileUploading?"#F5B829":"#178F78", marginTop:"4px" }}>
                    {profileUploading ? "⏳ Uploading photo…" : "📷 Tap camera icon to update photo"}
                  </div>
                  {profileError && (
                    <div style={{ marginTop:"8px", background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", color:"#DC2626" }}>
                      ❌ {profileError}
                    </div>
                  )}
                </div>

                {/* Info grid */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {[
                    ["🎂","Date of Birth", selectedChild.child_dob ? new Date(selectedChild.child_dob).toLocaleDateString("en-IN") : "—"],
                    ["📏","Age", selectedChild.child_age_months ? `${Math.floor(selectedChild.child_age_months/12)} yr ${selectedChild.child_age_months%12} mo` : "—"],
                    ["📚","Programme", selectedChild.program_label || "—"],
                    ["🏫","Section", selectedChild.section_name || "Not assigned yet"],
                    ["📊","Status", selectedChild.status || "Enquired"],
                    ["📞","Parent Phone", session?.phone || "—"],
                  ].map(([icon, label, value]) => (
                    <div key={label} style={{ background:"#FAF0E8", borderRadius:"14px", padding:"12px" }}>
                      <div style={{ fontSize:"16px", marginBottom:"4px" }}>{icon}</div>
                      <div style={{ fontSize:"10px", color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
                      <div style={{ fontSize:"13px", fontWeight:700, color:"#1A2F4A", marginTop:"2px", textTransform:"capitalize" }}>{value}</div>
                    </div>
                  ))}
                </div>

                <button onClick={logout} style={{ width:"100%", marginTop:"20px", padding:"11px", borderRadius:"20px", background:"rgba(220,38,38,0.08)", border:"1px solid rgba(220,38,38,0.2)", color:"#DC2626", fontWeight:700, fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                  <LogOut style={{ width:"16px", height:"16px" }} /> Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

