"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2 } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import FaceAutoTagger from "@/components/FaceAutoTagger";

type TeacherTab = "attendance" | "homework" | "students" | "photos";

const ATT_STATUS = [
  { key:"present", label:"Present", color:"#178F78", bg:"rgba(23,143,120,0.1)", icon:"✅" },
  { key:"absent",  label:"Absent",  color:"#E8694A", bg:"rgba(232,105,74,0.1)",  icon:"❌" },
  { key:"late",    label:"Late",    color:"#F5B829", bg:"rgba(245,184,41,0.12)", icon:"⏰" },
];
export default function TeacherDashboardPage() {
  const router = useRouter();
  const [session, setSession]     = useState<any>(null);
  const [tab, setTab]             = useState<TeacherTab>("attendance");
  const [children, setChildren]   = useState<any[]>([]);
  const [attendance, setAtt]      = useState<Record<string, string>>({});
  const [homework, setHomework]   = useState<any[]>([]);
  const [photos, setPhotos]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<string | null>(null);
  const [attSaved, setAttSaved]   = useState(false);

  // New homework form
  const [showHWForm, setShowHWForm] = useState(false);
  const [hwForm, setHWForm] = useState({ title:"", subject:"", description:"", dueDate:"" });
  const [hwSaving, setHWSaving]   = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayFmt = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("ep_teacher_session");
    if (!s) { router.replace("/teacher-login"); return; }
    const parsed = JSON.parse(s);
    if (Date.now() - parsed.loginTime > 12 * 60 * 60 * 1000) {
      localStorage.removeItem("ep_teacher_session"); router.replace("/teacher-login"); return;
    }
    setSession(parsed);
  }, [router]);

  // ── Load data ─────────────────────────────────────────
  const loadData = useCallback(async (sectionId: string) => {
    setLoading(true);
    const r = await fetch(`/api/teacher/dashboard?sectionId=${sectionId}`);
    const d = await r.json();
    setChildren(d.children || []);
    setHomework(d.homework  || []);
    setPhotos(d.photos      || []);
    // Build attendance map from today's records
    const attMap: Record<string, string> = {};
    (d.attendance || []).forEach((a: any) => { attMap[a.student_id] = a.status; });
    setAtt(attMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session?.sectionId) loadData(session.sectionId);
  }, [session, loadData]);

  const logout = () => { localStorage.removeItem("ep_teacher_session"); router.push("/teacher-login"); };

  // ── Mark attendance ───────────────────────────────────
  const markAtt = async (childId: string, status: string) => {
    setSaving(childId);
    setAtt(p => ({ ...p, [childId]: status }));
    await fetch("/api/teacher/attendance", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: childId, date: today, status }),
    });
    setSaving(null);
  };

  const saveAllAttendance = async () => {
    setSaving("all");
    for (const child of children) {
      if (!attendance[child.id]) {
        await fetch("/api/teacher/attendance", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: child.id, date: today, status: "present" }),
        });
      }
    }
    setAttSaved(true);
    setSaving(null);
    setTimeout(() => setAttSaved(false), 3000);
  };

  // ── Assign homework ───────────────────────────────────
  const assignHW = async () => {
    if (!hwForm.title || !hwForm.dueDate) return;
    setHWSaving(true);
    await fetch("/api/teacher/homework", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId:   session.sectionId,
        sectionName: session.sectionName,
        title:       hwForm.title,
        subject:     hwForm.subject,
        description: hwForm.description,
        dueDate:     hwForm.dueDate,
        assignedBy:  session.name,
      }),
    });
    setHWForm({ title:"", subject:"", description:"", dueDate:"" });
    setShowHWForm(false);
    setHWSaving(false);
    loadData(session.sectionId);
  };

  const deleteHW = async (id: string) => {
    if (!confirm("Delete this homework?")) return;
    await fetch("/api/teacher/homework", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData(session.sectionId);
  };

  const inp = { border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", outline:"none", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"100%", boxSizing:"border-box" as const };

  const presentCount = Object.values(attendance).filter(s => s === "present").length;
  const absentCount  = Object.values(attendance).filter(s => s === "absent").length;
  const markedCount  = Object.values(attendance).length;

  if (!session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1A2F4A,#0f6b5a)", padding:"14px 20px" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"white" }}>
              👩‍🏫 {session.name}
            </div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>
              {session.sectionName} · {session.programLabel} · {todayFmt}
            </div>
          </div>
          <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"20px", padding:"6px 14px", color:"white", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            <LogOut style={{ width:"13px", height:"13px" }} /> Logout
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ background:"white", borderBottom:"1px solid #EDE8DF" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", padding:"12px 20px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
          {[
            { icon:"👶", label:"Total Students", value:children.length, color:"#178F78" },
            { icon:"✅", label:"Present Today",  value:presentCount,     color:"#178F78" },
            { icon:"❌", label:"Absent Today",   value:absentCount,      color:"#E8694A" },
            { icon:"📚", label:"Homework Active",value:homework.length,  color:"#6366F1" },
          ].map(s => (
            <div key={s.label} style={{ textAlign:"center", padding:"10px", background:"#FAF0E8", borderRadius:"14px" }}>
              <div style={{ fontSize:"18px", marginBottom:"2px" }}>{s.icon}</div>
              <div style={{ fontSize:"20px", fontWeight:700, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"10px", color:"#6B7A99" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"white", borderBottom:"1px solid #EDE8DF" }}>
        <div style={{ maxWidth:"900px", margin:"0 auto", display:"flex" }}>
          {([
            { key:"attendance", icon:"📅", label:"Attendance" },
            { key:"homework",   icon:"📚", label:"Homework" },
            { key:"students",   icon:"👶", label:"Students" },
            { key:"photos",     icon:"📸", label:"Photos" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"13px 8px", border:"none", borderBottom:`3px solid ${tab===t.key?"#178F78":"transparent"}`, background:"transparent", fontWeight:700, fontSize:"12px", color:tab===t.key?"#178F78":"#6B7A99", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"5px" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:"900px", margin:"0 auto", padding:"16px" }}>

        {/* ══ ATTENDANCE TAB ══ */}
        {tab === "attendance" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"#1A2F4A" }}>
                Today's Attendance
              </div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <span style={{ fontSize:"11px", color:"#6B7A99" }}>{markedCount}/{children.length} marked</span>
                <button onClick={saveAllAttendance} disabled={saving==="all"}
                  style={{ background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"7px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"5px" }}>
                  {saving==="all" ? "Saving…" : attSaved ? "✅ Saved!" : "Mark All Present"}
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99" }}>Loading students…</div>
            ) : children.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>👶</div>
                No students assigned to {session.sectionName} yet.<br/>Admin needs to assign children to this section.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {children.map(child => {
                  const attStatus = attendance[child.id];
                  return (
                    <div key={child.id} style={{ background:"white", borderRadius:"16px", border:`2px solid ${attStatus==="present"?"rgba(23,143,120,0.25)":attStatus==="absent"?"rgba(232,105,74,0.25)":attStatus==="late"?"rgba(245,184,41,0.25)":"#EDE8DF"}`, padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(23,143,120,0.15),rgba(232,105,74,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>🧒</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{child.child_name}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                          {child.child_age_months ? `${Math.floor(child.child_age_months/12)}y ${child.child_age_months%12}m` : ""} · 📞 {child.phone}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        {ATT_STATUS.map(s => (
                          <button key={s.key} onClick={() => markAtt(child.id, s.key)}
                            disabled={saving===child.id}
                            style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 10px", borderRadius:"20px", border:`1.5px solid ${attStatus===s.key?s.color:"#EDE8DF"}`, background:attStatus===s.key?s.bg:"white", color:attStatus===s.key?s.color:"#6B7A99", fontSize:"11px", fontWeight:attStatus===s.key?700:400, cursor:"pointer", transition:"all 0.15s" }}>
                            <span>{s.icon}</span> {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ HOMEWORK TAB ══ */}
        {tab === "homework" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"#1A2F4A" }}>Homework — {session.sectionName}</div>
              <button onClick={() => setShowHWForm(!showHWForm)}
                style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"7px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                <Plus style={{ width:"13px", height:"13px" }} /> Assign Homework
              </button>
            </div>

            {/* Homework form */}
            {showHWForm && (
              <div style={{ background:"white", borderRadius:"16px", border:"2px solid #178F78", padding:"18px", marginBottom:"14px" }}>
                <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78", marginBottom:"14px" }}>New Homework</div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>TITLE *</label>
                    <input value={hwForm.title} onChange={e => setHWForm(p=>({...p,title:e.target.value}))} style={inp} placeholder="e.g. Draw your family" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>SUBJECT</label>
                    <input value={hwForm.subject} onChange={e => setHWForm(p=>({...p,subject:e.target.value}))} style={inp} placeholder="Art, Math, English…" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>DUE DATE *</label>
                    <input type="date" value={hwForm.dueDate} onChange={e => setHWForm(p=>({...p,dueDate:e.target.value}))} style={inp} min={today} />
                  </div>
                </div>
                <div style={{ marginBottom:"12px" }}>
                  <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>DESCRIPTION (optional)</label>
                  <input value={hwForm.description} onChange={e => setHWForm(p=>({...p,description:e.target.value}))} style={inp} placeholder="Add details or instructions…" />
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={assignHW} disabled={hwSaving||!hwForm.title||!hwForm.dueDate}
                    style={{ background:"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"8px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                    {hwSaving ? "Saving…" : "Assign to Class"}
                  </button>
                  <button onClick={() => setShowHWForm(false)} style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {homework.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>📚</div>
                No homework assigned yet. Click "Assign Homework" to add one.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {homework.map(hw => {
                  const isPast = new Date(hw.due_date) < new Date();
                  return (
                    <div key={hw.id} style={{ background:"white", borderRadius:"14px", border:`1px solid ${isPast?"rgba(232,105,74,0.25)":"#EDE8DF"}`, padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                      <div style={{ width:"42px", height:"42px", borderRadius:"12px", background:isPast?"rgba(232,105,74,0.1)":"rgba(99,102,241,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>📝</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{hw.title}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                          {hw.subject && <span style={{ marginRight:"8px" }}>📖 {hw.subject}</span>}
                          Due: <span style={{ color:isPast?"#E8694A":"#178F78", fontWeight:600 }}>{new Date(hw.due_date).toLocaleDateString("en-IN")}</span>
                          {isPast && <span style={{ marginLeft:"6px", background:"rgba(232,105,74,0.1)", color:"#E8694A", borderRadius:"20px", padding:"1px 7px", fontSize:"9px", fontWeight:700 }}>PAST DUE</span>}
                        </div>
                        {hw.description && <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px" }}>{hw.description}</div>}
                      </div>
                      <button onClick={() => deleteHW(hw.id)} style={{ background:"rgba(220,38,38,0.08)", border:"none", borderRadius:"8px", padding:"7px", cursor:"pointer", color:"#DC2626" }}>
                        <Trash2 style={{ width:"14px", height:"14px" }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ STUDENTS TAB ══ */}
        {tab === "students" && (
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"#1A2F4A", marginBottom:"14px" }}>
              Students — {session.sectionName} ({children.length})
            </div>
            {children.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>👶</div>
                No students assigned yet.
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"10px" }}>
                {children.map(child => {
                  const attToday = attendance[child.id];
                  return (
                    <div key={child.id} style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", padding:"14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                        <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.2),rgba(23,143,120,0.2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🧒</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{child.child_name}</div>
                          <div style={{ fontSize:"10px", color:"#6B7A99" }}>
                            {child.child_age_months ? `${Math.floor(child.child_age_months/12)}y ${child.child_age_months%12}m` : "Age not set"}
                          </div>
                        </div>
                        {attToday && (
                          <div style={{ marginLeft:"auto", fontSize:"18px" }}>
                            {attToday==="present"?"✅":attToday==="absent"?"❌":"⏰"}
                          </div>
                        )}
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                        <div style={{ background:"#FAF0E8", borderRadius:"10px", padding:"7px 10px" }}>
                          <div style={{ fontSize:"9px", color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.05em" }}>Phone</div>
                          <div style={{ fontSize:"11px", fontWeight:700, color:"#1A2F4A" }}>{child.phone}</div>
                        </div>
                        <div style={{ background:"#FAF0E8", borderRadius:"10px", padding:"7px 10px" }}>
                          <div style={{ fontSize:"9px", color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.05em" }}>Status</div>
                          <div style={{ fontSize:"11px", fontWeight:700, color:"#178F78", textTransform:"capitalize" }}>{child.status || "Enquired"}</div>
                        </div>
                      </div>
                      <a href={`https://wa.me/91${child.phone}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", marginTop:"8px", background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", borderRadius:"10px", padding:"7px", color:"#128C7E", fontSize:"11px", fontWeight:700, textDecoration:"none" }}>
                        💬 Message Parent
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ PHOTOS TAB ══ */}
        {tab === "photos" && (
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"17px", fontWeight:700, color:"#1A2F4A", marginBottom:"14px" }}>📸 Class Photos — {session.sectionName}</div>

            <PhotoUploader
              sectionId={session.sectionId}
              sectionName={session.sectionName}
              uploadedBy={session.name}
              uploadedByRole="teacher"
              children={children}
              onUploaded={() => loadData(session.sectionId)}
            />

            <div style={{ marginTop:"16px" }}>
              {photos.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                  <div style={{ fontSize:"28px", marginBottom:"6px" }}>📷</div>
                  No photos yet. Upload above!
                </div>
              ) : (
                <div>
                  {photos.map((p: any) => (
                    <FaceAutoTagger key={p.id} photo={p} sectionId={session.sectionId}
                      children={children} onSaved={() => loadData(session.sectionId)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
