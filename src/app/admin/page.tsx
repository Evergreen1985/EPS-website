"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2, Edit2, Save, X, Search } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";

type AdminTab = "enquiries" | "sections" | "calendar" | "photos";

const STATUS_OPTIONS   = ["new","called","visited","enrolled","not-interested"];
const PROGRAM_OPTIONS  = [
  { id:"infant",      label:"Infant Care" },
  { id:"playgroup",   label:"Playgroup" },
  { id:"nursery",     label:"Nursery" },
  { id:"jrkg",        label:"Junior KG" },
  { id:"srkg",        label:"Senior KG" },
  { id:"daycare",     label:"Full-Day Daycare" },
  { id:"afterschool", label:"After-School" },
];
const EVENT_TYPES = ["holiday","festival","activity","exam","ptm","sports"];
const EVENT_COLORS = { holiday:"#E8694A", festival:"#F5B829", activity:"#178F78", exam:"#6366F1", ptm:"#EC4899", sports:"#0F766E" };
const STATUS_COLORS: Record<string,string> = { new:"#6366F1", called:"#F5B829", visited:"#0F766E", enrolled:"#178F78", "not-interested":"#6B7A99" };

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession]       = useState<any>(null);
  const [tab, setTab]               = useState<AdminTab>("enquiries");

  // Enquiries state
  const [enquiries, setEnquiries]   = useState<any[]>([]);
  const [sections, setSections]     = useState<any[]>([]);
  const [events, setEvents]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");

  // Edit states
  const [editingEnquiry, setEditEnq]= useState<any>(null);
  const [editingSection, setEditSec]= useState<any>(null);
  const [editingEvent, setEditEvt]  = useState<any>(null);
  const [newSection, setNewSec]     = useState(false);
  const [newEvent, setNewEvt]       = useState(false);
  const [calMonth, setCalMonth]     = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
  });

  // ── Auth check ─────────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("ep_admin_session");
    if (!s) { router.replace("/admin-login"); return; }
    const parsed = JSON.parse(s);
    if (Date.now() - parsed.loginTime > 8 * 60 * 60 * 1000) {
      localStorage.removeItem("ep_admin_session"); router.replace("/admin-login"); return;
    }
    setSession(parsed);
  }, [router]);

  // ── Load data ───────────────────────────────────────────
  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/enquiries");
    const d = await r.json();
    setEnquiries(d.enquiries || []);
    setLoading(false);
  }, []);

  const loadSections = useCallback(async () => {
    const r = await fetch("/api/admin/sections");
    const d = await r.json();
    setSections(d.sections || []);
  }, []);

  const loadEvents = useCallback(async () => {
    const r = await fetch(`/api/admin/calendar?month=${calMonth}`);
    const d = await r.json();
    setEvents(d.events || []);
  }, [calMonth]);

  useEffect(() => { if (session) { loadEnquiries(); loadSections(); } }, [session, loadEnquiries, loadSections]);
  useEffect(() => { if (session && tab === "calendar") loadEvents(); }, [session, tab, calMonth, loadEvents]);

  const logout = () => { localStorage.removeItem("ep_admin_session"); router.push("/admin-login"); };

  // ── Update enquiry ─────────────────────────────────────
  const saveEnquiry = async (id: string, updates: any) => {
    await fetch("/api/admin/enquiries", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id, ...updates }) });
    loadEnquiries();
    setEditEnq(null);
  };

  // ── Sections CRUD ──────────────────────────────────────
  const saveSection = async (data: any) => {
    if (data.id) {
      await fetch("/api/admin/sections", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    } else {
      await fetch("/api/admin/sections", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    }
    loadSections(); setEditSec(null); setNewSec(false);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Delete this section? Children in this section will be unassigned.")) return;
    await fetch("/api/admin/sections", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id }) });
    loadSections();
  };

  // ── Calendar CRUD ──────────────────────────────────────
  const saveEvent = async (data: any) => {
    if (data.id) {
      await fetch("/api/admin/calendar", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    } else {
      await fetch("/api/admin/calendar", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    }
    loadEvents(); setEditEvt(null); setNewEvt(false);
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await fetch("/api/admin/calendar", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id }) });
    loadEvents();
  };

  // ── Filtered enquiries ─────────────────────────────────
  const filtered = enquiries.filter(e => {
    const matchS = filterStatus === "all" || e.status === filterStatus;
    const matchQ = !search || e.child_name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search);
    return matchS && matchQ;
  });

  const inp = (style: any = {}) => ({
    border:"1px solid #EDE8DF", borderRadius:"10px", padding:"8px 12px", fontSize:"12px", outline:"none",
    background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"100%", boxSizing:"border-box" as const, ...style,
  });

  if (!session) return null;

  return (
    <div style={{ minHeight:"100vh", background:"#F0F4F8", fontFamily:"'Quicksand',sans-serif" }}>

      {/* Header */}
      <div style={{ background:"#1A2F4A", padding:"0 24px", display:"flex", alignItems:"center", gap:"16px", height:"56px" }}>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"white", flex:1 }}>🌿 Evergreen Admin</div>
        <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>Welcome, {session.name}</div>
        <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"20px", padding:"5px 12px", color:"white", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
          <LogOut style={{ width:"13px", height:"13px" }} /> Logout
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background:"white", borderBottom:"1px solid #EDE8DF", padding:"0 24px", display:"flex", gap:"0" }}>
        {([
          { key:"enquiries", label:"📋 Enquiries", count: enquiries.length },
          { key:"sections",  label:"🏫 Sections",  count: sections.length },
          { key:"calendar",  label:"📅 Calendar",  count: events.length },
          { key:"photos",    label:"📸 Photos",    count: 0 },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"14px 20px", border:"none", borderBottom:`3px solid ${tab===t.key ? "#178F78" : "transparent"}`, background:"transparent", fontWeight:700, fontSize:"13px", color:tab===t.key ? "#178F78" : "#6B7A99", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
            {t.label}
            <span style={{ background:tab===t.key ? "#178F78" : "#EDE8DF", color:tab===t.key ? "white" : "#6B7A99", borderRadius:"20px", padding:"1px 7px", fontSize:"10px" }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>

        {/* ══ ENQUIRIES TAB ══ */}
        {tab === "enquiries" && (
          <div>
            {/* Filters */}
            <div style={{ display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
                <Search style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", width:"14px", height:"14px", color:"#6B7A99" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
                  style={{ ...inp(), paddingLeft:"32px" }} />
              </div>
              <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={inp({ width:"auto" })}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              <div style={{ background:"rgba(23,143,120,0.1)", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:700, color:"#178F78" }}>
                {filtered.length} records
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"10px", marginBottom:"16px" }}>
              {STATUS_OPTIONS.map(s => {
                const count = enquiries.filter(e => e.status === s).length;
                return (
                  <div key={s} onClick={() => setFilter(f => f===s ? "all" : s)}
                    style={{ background:"white", borderRadius:"14px", padding:"12px", textAlign:"center", cursor:"pointer", border:`2px solid ${filterStatus===s ? STATUS_COLORS[s] : "#EDE8DF"}`, transition:"all 0.2s" }}>
                    <div style={{ fontSize:"20px", fontWeight:700, color:STATUS_COLORS[s] }}>{count}</div>
                    <div style={{ fontSize:"10px", color:"#6B7A99", textTransform:"capitalize", marginTop:"2px" }}>{s}</div>
                  </div>
                );
              })}
            </div>

            {/* Enquiry list */}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {filtered.map(e => (
                <div key={e.id} style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", padding:"14px 16px" }}>
                  {editingEnquiry?.id === e.id ? (
                    /* Edit mode */
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"10px", alignItems:"end" }}>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>STATUS</label>
                        <select value={editingEnquiry.status} onChange={ev => setEditEnq((p:any) => ({ ...p, status: ev.target.value }))} style={inp()}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>SECTION</label>
                        <select value={editingEnquiry.section_id || ""} onChange={ev => {
                          const sec = sections.find(s => s.id === ev.target.value);
                          setEditEnq((p:any) => ({ ...p, section_id: ev.target.value || null, section_name: sec?.name || null }));
                        }} style={inp()}>
                          <option value="">— No section —</option>
                          {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.program_label})</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>NOTES</label>
                        <input value={editingEnquiry.notes || ""} onChange={ev => setEditEnq((p:any) => ({ ...p, notes: ev.target.value }))} style={inp()} placeholder="Add notes..." />
                      </div>
                      <div style={{ display:"flex", gap:"6px" }}>
                        <button onClick={() => saveEnquiry(e.id, { status: editingEnquiry.status, section_id: editingEnquiry.section_id, section_name: editingEnquiry.section_name, notes: editingEnquiry.notes })}
                          style={{ background:"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                          <Save style={{ width:"12px", height:"12px" }} /> Save
                        </button>
                        <button onClick={() => setEditEnq(null)} style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"8px 10px", fontSize:"12px", cursor:"pointer" }}>
                          <X style={{ width:"12px", height:"12px" }} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                      {/* Profile photo */}
                      <div style={{ position:"relative", flexShrink:0 }}>
                        {e.photo_url ? (
                          <img src={e.photo_url} alt={e.child_name}
                            style={{ width:"44px", height:"44px", borderRadius:"50%", objectFit:"cover", border:"2px solid #EDE8DF" }} />
                        ) : (
                          <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(232,105,74,0.15),rgba(23,143,120,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🧒</div>
                        )}
                        <label htmlFor={`photo-${e.id}`} style={{ position:"absolute", bottom:-2, right:-2, width:"18px", height:"18px", borderRadius:"50%", background:"#178F78", border:"1.5px solid white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"9px" }}>📷</label>
                        <input id={`photo-${e.id}`} type="file" accept="image/*" style={{ display:"none" }}
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("file", file);
                            fd.append("enquiryId", e.id);
                            fd.append("childName", e.child_name);
                            await fetch("/api/photos/profile", { method:"POST", body: fd });
                            loadEnquiries();
                          }} />
                      </div>
                      <div style={{ flex:1, minWidth:"150px" }}>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{e.child_name}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>📞 {e.phone} · {e.program_label || "No programme"}</div>
                      </div>
                      <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                        {e.child_dob ? `Age: ${Math.floor((e.child_age_months||0)/12)}y ${(e.child_age_months||0)%12}m` : "DOB not provided"}
                      </div>
                      {e.section_name && (
                        <span style={{ background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:700 }}>📚 {e.section_name}</span>
                      )}
                      {e.notes && <div style={{ fontSize:"10px", color:"#6B7A99", fontStyle:"italic" }}>"{e.notes}"</div>}
                      <span style={{ background:`${STATUS_COLORS[e.status]||"#6B7A99"}15`, color:STATUS_COLORS[e.status]||"#6B7A99", border:`1px solid ${STATUS_COLORS[e.status]||"#6B7A99"}40`, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:700, textTransform:"capitalize" }}>
                        {e.status}
                      </span>
                      <div style={{ fontSize:"10px", color:"#6B7A99" }}>{new Date(e.created_at).toLocaleDateString("en-IN")}</div>
                      <button onClick={() => setEditEnq({ ...e })} style={{ background:"rgba(23,143,120,0.08)", border:"none", borderRadius:"10px", padding:"6px 12px", fontSize:"11px", fontWeight:700, color:"#178F78", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                        <Edit2 style={{ width:"12px", height:"12px" }} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                  No enquiries found{filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SECTIONS TAB ══ */}
        {tab === "sections" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>Class Sections</div>
              <button onClick={() => { setNewSec(true); setEditSec({ name:"", program_id:"nursery", program_label:"Nursery", class_teacher:"", strength:20, academic_year:"2025-26" }); }}
                style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                <Plus style={{ width:"14px", height:"14px" }} /> Add Section
              </button>
            </div>

            {/* Add / edit section form */}
            {(newSection || editingSection) && editingSection && (
              <div style={{ background:"white", borderRadius:"16px", border:"2px solid #178F78", padding:"18px", marginBottom:"14px" }}>
                <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78", marginBottom:"14px" }}>{newSection ? "Add New Section" : "Edit Section"}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px", marginBottom:"12px" }}>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>SECTION NAME</label>
                    <input value={editingSection.name} onChange={e => setEditSec((p:any) => ({ ...p, name: e.target.value }))} style={inp()} placeholder="e.g. Nursery-A" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>PROGRAMME</label>
                    <select value={editingSection.program_id} onChange={e => {
                      const prog = PROGRAM_OPTIONS.find(p => p.id === e.target.value);
                      setEditSec((p:any) => ({ ...p, program_id: e.target.value, program_label: prog?.label || "" }));
                    }} style={inp()}>
                      {PROGRAM_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>CLASS TEACHER</label>
                    <input value={editingSection.class_teacher || ""} onChange={e => setEditSec((p:any) => ({ ...p, class_teacher: e.target.value }))} style={inp()} placeholder="Ms. Priya" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>STRENGTH</label>
                    <input type="number" value={editingSection.strength || 20} onChange={e => setEditSec((p:any) => ({ ...p, strength: parseInt(e.target.value) }))} style={inp()} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => saveSection(editingSection)}
                    style={{ background:"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"8px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                    {newSection ? "Create Section" : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditSec(null); setNewSec(false); }}
                    style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Sections grid by programme */}
            {PROGRAM_OPTIONS.map(prog => {
              const progSections = sections.filter(s => s.program_id === prog.id);
              if (progSections.length === 0) return null;
              return (
                <div key={prog.id} style={{ marginBottom:"16px" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>{prog.label}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"10px" }}>
                    {progSections.map(s => {
                      const childCount = enquiries.filter(e => e.section_id === s.id).length;
                      return (
                        <div key={s.id} style={{ background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"14px" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                            <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{s.name}</div>
                            <div style={{ display:"flex", gap:"4px" }}>
                              <button onClick={() => { setEditSec({ ...s }); setNewSec(false); }}
                                style={{ background:"rgba(23,143,120,0.08)", border:"none", borderRadius:"8px", padding:"5px", cursor:"pointer", color:"#178F78" }}>
                                <Edit2 style={{ width:"12px", height:"12px" }} />
                              </button>
                              <button onClick={() => deleteSection(s.id)}
                                style={{ background:"rgba(220,38,38,0.08)", border:"none", borderRadius:"8px", padding:"5px", cursor:"pointer", color:"#DC2626" }}>
                                <Trash2 style={{ width:"12px", height:"12px" }} />
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize:"11px", color:"#6B7A99" }}>👩‍🏫 {s.class_teacher || "No teacher assigned"}</div>
                          <div style={{ fontSize:"11px", color:"#6B7A99" }}>👶 {childCount} children · Max {s.strength}</div>
                          <div style={{ marginTop:"8px", background:"#FAF0E8", borderRadius:"8px", height:"4px", overflow:"hidden" }}>
                            <div style={{ background:"#178F78", height:"100%", width:`${Math.min(100, (childCount/s.strength)*100)}%`, borderRadius:"8px", transition:"width 0.3s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CALENDAR TAB ══ */}
        {tab === "calendar" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>Calendar & Events</div>
              <div style={{ display:"flex", gap:"10px" }}>
                <input type="month" value={calMonth} onChange={e => setCalMonth(e.target.value)}
                  style={{ ...inp({ width:"auto" }), padding:"7px 12px" }} />
                <button onClick={() => { setNewEvt(true); setEditEvt({ title:"", event_date: `${calMonth}-01`, event_type:"activity", icon:"📅", color:"#178F78", is_holiday:false, description:"", affects:"all" }); }}
                  style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                  <Plus style={{ width:"14px", height:"14px" }} /> Add Event
                </button>
              </div>
            </div>

            {/* Add/Edit event form */}
            {(newEvent || editingEvent) && editingEvent && (
              <div style={{ background:"white", borderRadius:"16px", border:"2px solid #178F78", padding:"18px", marginBottom:"14px" }}>
                <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78", marginBottom:"14px" }}>{newEvent ? "Add Event" : "Edit Event"}</div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>EVENT TITLE</label>
                    <input value={editingEvent.title} onChange={e => setEditEvt((p:any) => ({ ...p, title: e.target.value }))} style={inp()} placeholder="e.g. Diwali Celebration" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>DATE</label>
                    <input type="date" value={editingEvent.event_date} onChange={e => setEditEvt((p:any) => ({ ...p, event_date: e.target.value }))} style={inp()} />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>TYPE</label>
                    <select value={editingEvent.event_type} onChange={e => {
                      const color = EVENT_COLORS[e.target.value as keyof typeof EVENT_COLORS] || "#178F78";
                      setEditEvt((p:any) => ({ ...p, event_type: e.target.value, color }));
                    }} style={inp()}>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>ICON</label>
                    <input value={editingEvent.icon} onChange={e => setEditEvt((p:any) => ({ ...p, icon: e.target.value }))} style={inp()} placeholder="🎉" />
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr 1fr", gap:"10px", marginBottom:"12px" }}>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>DESCRIPTION (optional)</label>
                    <input value={editingEvent.description || ""} onChange={e => setEditEvt((p:any) => ({ ...p, description: e.target.value }))} style={inp()} placeholder="Brief description..." />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>AFFECTS</label>
                    <select value={editingEvent.affects || "all"} onChange={e => setEditEvt((p:any) => ({ ...p, affects: e.target.value }))} style={inp()}>
                      <option value="all">All Classes</option>
                      {PROGRAM_OPTIONS.map(p => <option key={p.id} value={`program:${p.id}`}>{p.label} only</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:"2px" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", fontSize:"12px", fontWeight:700, color:"#E8694A" }}>
                      <input type="checkbox" checked={editingEvent.is_holiday} onChange={e => setEditEvt((p:any) => ({ ...p, is_holiday: e.target.checked })) } />
                      School Holiday
                    </label>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={() => saveEvent(editingEvent)}
                    style={{ background:"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"8px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                    {newEvent ? "Add Event" : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditEvt(null); setNewEvt(false); }}
                    style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Events list */}
            {events.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                No events for {calMonth}. Click "Add Event" to add one!
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {events.map(ev => (
                  <div key={ev.id} style={{ background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"12px 16px", display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:`${ev.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>{ev.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{ev.title}
                        {ev.is_holiday && <span style={{ marginLeft:"6px", background:"rgba(232,105,74,0.1)", color:"#E8694A", borderRadius:"20px", padding:"1px 7px", fontSize:"9px", fontWeight:700 }}>HOLIDAY</span>}
                      </div>
                      <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                        {new Date(ev.event_date).toLocaleDateString("en-IN", { weekday:"short", day:"numeric", month:"short" })} · <span style={{ color:ev.color, fontWeight:600, textTransform:"capitalize" }}>{ev.event_type}</span>
                        {ev.description && ` · ${ev.description}`}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => { setEditEvt({ ...ev }); setNewEvt(false); }}
                        style={{ background:"rgba(23,143,120,0.08)", border:"none", borderRadius:"8px", padding:"6px", cursor:"pointer", color:"#178F78" }}>
                        <Edit2 style={{ width:"13px", height:"13px" }} />
                      </button>
                      <button onClick={() => deleteEvent(ev.id)}
                        style={{ background:"rgba(220,38,38,0.08)", border:"none", borderRadius:"8px", padding:"6px", cursor:"pointer", color:"#DC2626" }}>
                        <Trash2 style={{ width:"13px", height:"13px" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ══ PHOTOS TAB ══ */}
        {tab === "photos" && (
          <div>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A", marginBottom:"16px" }}>📸 Upload Class Photos</div>
            <div style={{ marginBottom:"14px" }}>
              <label style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", textTransform:"uppercase", display:"block", marginBottom:"6px" }}>Select Section to Upload For</label>
              <select onChange={e => {
                const sec = sections.find(s => s.id === e.target.value);
                if (sec) setEditSec(sec); else setEditSec(null);
              }} style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"280px" }}>
                <option value="">— Choose section —</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name} ({s.program_label})</option>)}
              </select>
            </div>
            {editingSection && (
              <PhotoUploader
                sectionId={editingSection.id}
                sectionName={editingSection.name}
                uploadedBy="Admin"
                uploadedByRole="admin"
                children={enquiries.filter(e => e.section_id === editingSection.id).map(e => ({ id: e.id, child_name: e.child_name }))}
              />
            )}
            {!editingSection && (
              <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
                Select a section above to upload photos for that class.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
