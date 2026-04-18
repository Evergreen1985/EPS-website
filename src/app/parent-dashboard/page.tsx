"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, ChevronRight, BookOpen, Calendar, Bell, Star, Clock, Baby } from "lucide-react";

// ── Indian festivals & school events ─────────────────────
const FESTIVALS: Record<string, { name: string; icon: string; color: string }[]> = {
  "01": [{ name:"New Year", icon:"🎊", color:"#E8694A" }, { name:"Pongal / Sankranti", icon:"🌾", color:"#F5B829" }, { name:"Republic Day", icon:"🇮🇳", color:"#178F78" }],
  "02": [{ name:"Valentine's Day", icon:"❤️", color:"#EC4899" }],
  "03": [{ name:"Holi", icon:"🌈", color:"#E8694A" }, { name:"Women's Day", icon:"💜", color:"#8957E5" }, { name:"Ugadi / Gudi Padwa", icon:"🌺", color:"#F5B829" }],
  "04": [{ name:"Ugadi / Tamil New Year", icon:"🌸", color:"#EC4899" }, { name:"Ambedkar Jayanti", icon:"🏛️", color:"#178F78" }, { name:"Earth Day", icon:"🌍", color:"#178F78" }],
  "05": [{ name:"Labour Day", icon:"⚒️", color:"#6366F1" }, { name:"Mother's Day", icon:"💐", color:"#EC4899" }],
  "06": [{ name:"Yoga Day", icon:"🧘", color:"#178F78" }, { name:"Father's Day", icon:"👔", color:"#6366F1" }],
  "07": [{ name:"Muharram", icon:"🌙", color:"#1A2F4A" }, { name:"Kargil Victory Day", icon:"🇮🇳", color:"#E8694A" }],
  "08": [{ name:"Independence Day", icon:"🇮🇳", color:"#178F78" }, { name:"Raksha Bandhan", icon:"🪢", color:"#F5B829" }, { name:"Krishna Janmashtami", icon:"🦚", color:"#8957E5" }, { name:"Onam", icon:"🌸", color:"#178F78" }],
  "09": [{ name:"Ganesh Chaturthi", icon:"🐘", color:"#F5B829" }, { name:"Navratri begins", icon:"💃", color:"#E8694A" }, { name:"Teacher's Day", icon:"👩‍🏫", color:"#178F78" }],
  "10": [{ name:"Gandhi Jayanti", icon:"🕊️", color:"#178F78" }, { name:"Navratri", icon:"💃", color:"#E8694A" }, { name:"Dasara / Dussehra", icon:"🏹", color:"#F5B829" }, { name:"Children's Day Prep", icon:"🧒", color:"#EC4899" }],
  "11": [{ name:"Diwali", icon:"🪔", color:"#F5B829" }, { name:"Children's Day", icon:"🧒", color:"#E8694A" }, { name:"Kannada Rajyotsava", icon:"🏁", color:"#F5B829" }],
  "12": [{ name:"Christmas", icon:"🎄", color:"#178F78" }, { name:"Year End Celebration", icon:"🎊", color:"#E8694A" }],
};

const PROGRAMS: Record<string, { label: string; icon: string; color: string; schedule: string; highlights: string[] }> = {
  "infant":     { label:"Infant Care",    icon:"🍼", color:"#EC4899", schedule:"9:00 AM – 3:30 PM", highlights:["Sensory play daily","Primary caregiver assigned","Feeding & sleep schedule maintained","Daily parent updates"] },
  "playgroup":  { label:"Playgroup",      icon:"🎈", color:"#E8694A", schedule:"9:00 AM – 3:30 PM", highlights:["Language development","Motor skill activities","Music & movement","Creative play"] },
  "nursery":    { label:"Nursery",        icon:"🌸", color:"#F5B829", schedule:"9:00 AM – 3:30 PM", highlights:["Pre-literacy & numeracy","Cooperative play","Arts & self-expression","Science exploration"] },
  "jrkg":       { label:"Junior KG",      icon:"📚", color:"#6366F1", schedule:"9:00 AM – 3:30 PM", highlights:["Phonics & reading","Basic maths concepts","Science awareness","Critical thinking"] },
  "srkg":       { label:"Senior KG",      icon:"🎓", color:"#178F78", schedule:"9:00 AM – 3:30 PM", highlights:["Reading & writing","Advanced numeracy","School readiness","Social skills"] },
  "daycare":    { label:"Full-Day Daycare",icon:"🏡", color:"#0F766E", schedule:"7:00 AM – 7:00 PM", highlights:["Meals provided","Rest periods","Educational activities","Extended care"] },
  "afterschool":{ label:"After-School",   icon:"🚌", color:"#7C3AED", schedule:"3:00 PM – 7:00 PM", highlights:["Homework help","Enrichment activities","Snacks provided","Supervised play"] },
};

const MONTHLY_ACTIVITIES: Record<string, string[]> = {
  "01": ["Art & Craft: Snowflake patterns","Story time: New beginnings","Number recognition games","Music & movement sessions"],
  "02": ["Valentine's card making","Friendship theme week","Color mixing (Red + White)","Love & sharing activities"],
  "03": ["Holi color learning","Spring garden activity","Nature walk","Science: Plants & seeds"],
  "04": ["Earth Day project","Vegetable planting","Water conservation","Bird watching"],
  "05": ["Mother's Day craft","Garden theme","Butterfly life cycle","Outdoor sports day"],
  "06": ["Summer splash day","Yoga & mindfulness","Father's Day activity","Color mixing experiments"],
  "07": ["Monsoon theme","Rainwater science","Story: The rainy season","Clay modeling"],
  "08": ["Independence Day craft","Tricolor activities","National heroes theme","Flag making"],
  "09": ["Ganesh theme art","Festival of lights prep","Science fair","Show & tell"],
  "10": ["Navratri dance","Dasara celebration","Pumpkin painting","Cultural heritage theme"],
  "11": ["Diwali lamp making","Fireworks safety","Children's Day celebration","Thank you cards"],
  "12": ["Christmas craft","Year-end show","Gift wrapping","Memories & growth showcase"],
};

export default function ParentDashboardPage() {
  const router = useRouter();
  const [session, setSession]         = useState<any>(null);
  const [children, setChildren]       = useState<any[]>([]);
  const [selectedChild, setSelected]  = useState<any>(null);
  const [announcements, setAnnounce]  = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"home"|"homework"|"calendar"|"profile">("home");

  const now     = new Date();
  const monthKey = String(now.getMonth() + 1).padStart(2, "0");
  const monthName = now.toLocaleString("default", { month: "long" });
  const year    = now.getFullYear();

  // ── Load session from localStorage ───────────────────
  useEffect(() => {
    const stored = localStorage.getItem("ep_parent_session");
    if (!stored) { router.replace("/parent-login"); return; }
    const s = JSON.parse(stored);
    // Check if session is expired (7 days)
    if (Date.now() - s.loginTime > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem("ep_parent_session");
      router.replace("/parent-login");
      return;
    }
    setSession(s);
  }, [router]);

  // ── Load dashboard data ───────────────────────────────
  useEffect(() => {
    if (!session?.phone) return;
    fetch(`/api/parent/dashboard?phone=${encodeURIComponent(session.phone)}`)
      .then(r => r.json())
      .then(data => {
        setChildren(data.enquiries || []);
        setAnnounce(data.announcements || []);
        if (data.enquiries?.length === 1) setSelected(data.enquiries[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const logout = () => {
    localStorage.removeItem("ep_parent_session");
    router.replace("/parent-login");
  };

  const prog = selectedChild ? PROGRAMS[selectedChild.program_id] || PROGRAMS["nursery"] : null;
  const festivals = FESTIVALS[monthKey] || [];
  const activities = MONTHLY_ACTIVITIES[monthKey] || [];

  // Calendar grid for current month
  const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
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

      {/* Top header */}
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

        {/* Child profile selector */}
        {children.length > 0 && (
          <div style={{ marginBottom:"16px" }}>
            {children.length > 1 && (
              <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>Select Child</div>
            )}
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {children.map((child) => (
                <button key={child.id} onClick={() => setSelected(child)}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 16px", borderRadius:"16px", border:`2px solid ${selectedChild?.id===child.id ? "#178F78" : "#EDE8DF"}`, background:selectedChild?.id===child.id ? "rgba(23,143,120,0.08)" : "white", cursor:"pointer", transition:"all 0.2s" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>
                    {PROGRAMS[child.program_id]?.icon || "🧒"}
                  </div>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{child.child_name}</div>
                    <div style={{ fontSize:"10px", color:"#6B7A99" }}>{child.program_label || "Enquired"}</div>
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
            <p style={{ fontSize:"12px", color:"#6B7A99", marginBottom:"16px" }}>Submit an enquiry to get started</p>
            <Link href="/enquiry" style={{ background:"#E8694A", color:"white", borderRadius:"20px", padding:"9px 22px", fontWeight:700, fontSize:"13px", textDecoration:"none" }}>Submit Enquiry →</Link>
          </div>
        )}

        {/* Tab navigation */}
        {selectedChild && (
          <>
            <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:"white", borderRadius:"16px", padding:"4px", border:"1px solid #EDE8DF" }}>
              {[
                { key:"home",     icon:"🏠", label:"Home" },
                { key:"homework", icon:"📚", label:"Homework" },
                { key:"calendar", icon:"📅", label:"Calendar" },
                { key:"profile",  icon:"👶", label:"Profile" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  style={{ flex:1, padding:"8px 4px", borderRadius:"12px", border:"none", cursor:"pointer", fontSize:"11px", fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", transition:"all 0.2s",
                    background: tab===t.key ? "#178F78" : "transparent",
                    color: tab===t.key ? "white" : "#6B7A99",
                  }}>
                  <span style={{ fontSize:"16px" }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* HOME TAB */}
            {tab === "home" && (
              <div>
                {/* Programme card */}
                {prog && (
                  <div style={{ background:"white", borderRadius:"20px", border:`2px solid ${prog.color}33`, padding:"16px", marginBottom:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
                      <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`${prog.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>{prog.icon}</div>
                      <div>
                        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:prog.color }}>{prog.label}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>⏰ {prog.schedule}</div>
                      </div>
                      <div style={{ marginLeft:"auto", background:`${prog.color}12`, borderRadius:"12px", padding:"6px 12px", textAlign:"center" }}>
                        <div style={{ fontSize:"10px", color:"#6B7A99" }}>Status</div>
                        <div style={{ fontSize:"11px", fontWeight:700, color:prog.color, textTransform:"capitalize" }}>{selectedChild.status || "Enquired"}</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                      {prog.highlights.map((h: string) => (
                        <div key={h} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"11px", color:"#6B7A99" }}>
                          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:prog.color, flexShrink:0 }} />{h}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* This month highlights */}
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"12px" }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"10px" }}>
                    🗓️ {monthName} Highlights
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
                    {festivals.map(f => (
                      <div key={f.name} style={{ display:"flex", alignItems:"center", gap:"5px", background:`${f.color}12`, border:`1px solid ${f.color}33`, borderRadius:"20px", padding:"4px 10px" }}>
                        <span style={{ fontSize:"14px" }}>{f.icon}</span>
                        <span style={{ fontSize:"10px", fontWeight:600, color:f.color }}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:"1px solid #EDE8DF", paddingTop:"10px" }}>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"7px" }}>Monthly Activities</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"5px" }}>
                      {activities.map((a: string) => (
                        <div key={a} style={{ display:"flex", alignItems:"flex-start", gap:"6px", fontSize:"11px", color:"#6B7A99" }}>
                          <span style={{ color:"#F5B829", flexShrink:0 }}>★</span>{a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Announcements */}
                {announcements.length > 0 && (
                  <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px" }}>
                    <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"10px" }}>📢 Announcements</div>
                    {announcements.map((a: any) => (
                      <div key={a.id} style={{ padding:"10px 0", borderBottom:"1px solid #EDE8DF" }}>
                        <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A", marginBottom:"3px" }}>{a.title}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>{a.body}</div>
                      </div>
                    ))}
                  </div>
                )}
                {announcements.length === 0 && (
                  <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px", textAlign:"center" }}>
                    <div style={{ fontSize:"28px", marginBottom:"6px" }}>📢</div>
                    <div style={{ fontSize:"13px", color:"#6B7A99" }}>No announcements yet. Check back soon!</div>
                  </div>
                )}
              </div>
            )}

            {/* HOMEWORK TAB */}
            {tab === "homework" && (
              <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px" }}>
                <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#178F78", marginBottom:"14px" }}>📚 Homework & Assignments</div>
                <div style={{ background:"rgba(23,143,120,0.06)", border:"1px solid rgba(23,143,120,0.2)", borderRadius:"14px", padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:"28px", marginBottom:"8px" }}>🎉</div>
                  <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78", marginBottom:"4px" }}>No pending homework!</div>
                  <div style={{ fontSize:"12px", color:"#6B7A99" }}>Your child's homework will appear here once the teacher assigns it. You can submit completed work directly from this page.</div>
                </div>
                <div style={{ marginTop:"14px", background:"rgba(245,184,41,0.08)", borderRadius:"14px", padding:"12px 14px" }}>
                  <div style={{ fontSize:"11px", fontWeight:700, color:"#B08000", marginBottom:"6px" }}>💡 How Homework Works</div>
                  <div style={{ fontSize:"11px", color:"#6B7A99", lineHeight:1.6 }}>
                    1. Teacher assigns homework here<br/>
                    2. You take a photo of completed work<br/>
                    3. Upload it directly from this page<br/>
                    4. Teacher reviews and adds corrections<br/>
                    5. You see the corrected work here
                  </div>
                </div>
              </div>
            )}

            {/* CALENDAR TAB */}
            {tab === "calendar" && (
              <div>
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"12px" }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#178F78", marginBottom:"14px", textAlign:"center" }}>
                    📅 {monthName} {year}
                  </div>
                  {/* Calendar grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"8px" }}>
                    {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                      <div key={d} style={{ textAlign:"center", fontSize:"10px", fontWeight:700, color:"#6B7A99", padding:"4px 0" }}>{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isToday = day === now.getDate();
                      const isSun   = (firstDay + i) % 7 === 0;
                      const isSat   = (firstDay + i) % 7 === 6;
                      return (
                        <div key={day} style={{ textAlign:"center", padding:"5px 2px", borderRadius:"8px", fontSize:"12px", fontWeight: isToday ? 700 : 400,
                          background: isToday ? "#178F78" : "transparent",
                          color: isToday ? "white" : isSun || isSat ? "#E8694A" : "#1A2F4A",
                        }}>{day}</div>
                      );
                    })}
                  </div>
                </div>

                {/* Festivals this month */}
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"12px" }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"12px" }}>🎊 Festivals & Special Days</div>
                  {festivals.length === 0 ? (
                    <div style={{ textAlign:"center", color:"#6B7A99", fontSize:"12px", padding:"12px" }}>No major festivals this month</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                      {festivals.map(f => (
                        <div key={f.name} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"14px", background:`${f.color}0d`, border:`1px solid ${f.color}25` }}>
                          <span style={{ fontSize:"22px" }}>{f.icon}</span>
                          <span style={{ fontWeight:600, fontSize:"13px", color:f.color }}>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Monthly activities */}
                <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"16px" }}>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"12px" }}>⭐ Activities This Month</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {activities.map((a: string, i: number) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"9px 12px", borderRadius:"12px", background:"#FAF0E8", border:"1px solid #EDE8DF" }}>
                        <div style={{ width:"26px", height:"26px", borderRadius:"8px", background:"#178F78", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"11px", fontWeight:700, flexShrink:0 }}>{i+1}</div>
                        <span style={{ fontSize:"12px", color:"#1A2F4A" }}>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {tab === "profile" && (
              <div style={{ background:"white", borderRadius:"20px", border:"1px solid #EDE8DF", padding:"20px" }}>
                <div style={{ textAlign:"center", marginBottom:"20px" }}>
                  <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", margin:"0 auto 10px" }}>
                    {prog?.icon || "🧒"}
                  </div>
                  <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#178F78" }}>{selectedChild.child_name}</div>
                  <div style={{ fontSize:"12px", color:"#6B7A99" }}>{selectedChild.program_label}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {[
                    ["🎂","Date of Birth", selectedChild.child_dob ? new Date(selectedChild.child_dob).toLocaleDateString("en-IN") : "—"],
                    ["📏","Age", selectedChild.child_age_months ? `${Math.floor(selectedChild.child_age_months/12)} yr ${selectedChild.child_age_months%12} mo` : "—"],
                    ["📚","Programme", selectedChild.program_label || "—"],
                    ["📊","Enquiry Status", selectedChild.status || "new"],
                    ["📅","Enquired On", new Date(selectedChild.created_at).toLocaleDateString("en-IN")],
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
