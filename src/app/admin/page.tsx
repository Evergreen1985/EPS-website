"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Trash2, Edit2, Save, X, Search } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import FeesTab from "@/components/FeesTab";
import SchoolSettingsTab from "@/components/SchoolSettingsTab";
import StaffTab          from "@/components/StaffTab";
import ChildEditModal      from "@/components/ChildEditModal";
import AcademicYearTab    from "@/components/AcademicYearTab";
import ExcelImport        from "@/components/ExcelImport";
import KitBulkManager     from "@/components/KitBulkManager";
import AttendanceReport   from "@/components/AttendanceReport";
import SitePhotosManager  from "@/components/SitePhotosManager";
import TransportStaffView from "@/components/TransportStaffView";
import ChildMedicalTab from "@/components/ChildMedicalTab";
import PayrollTab from "@/components/PayrollTab";
import PTMScheduler from "@/components/PTMScheduler";
import BlogManager from "@/components/BlogManager";
import ReferralTab from "@/components/ReferralTab";
import LeadFollowUpTab from "@/components/LeadFollowUpTab";
import BirthdayPanel from "@/components/BirthdayPanel";
import TestimonialsManager from "@/components/TestimonialsManager";
import IncidentLog from "@/components/IncidentLog";

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

type AdminTab = "enquiries" | "sections" | "calendar" | "photos" | "fees" | "staff" | "settings" | "import" | "kit" | "announcements" | "expenses" | "reports" | "transport" | "medical" | "pickup" | "payroll" | "ptm" | "blog" | "referrals" | "followups" | "birthdays" | "testimonials" | "incidents";

const STATUS_OPTIONS   = ["new","called","visited","enrolled","not-interested"];
const EVENT_TYPES = ["holiday","festival","activity","exam","ptm","sports"];
const EVENT_COLORS = { holiday:"#E8694A", festival:"#F5B829", activity:"#178F78", exam:"#6366F1", ptm:"#EC4899", sports:"#0F766E" };
const STATUS_COLORS: Record<string,string> = { new:"#6366F1", called:"#F5B829", visited:"#0F766E", enrolled:"#178F78", "not-interested":"#6B7A99" };

// ── Admin Pickup Authorization Panel ─────────────────────────
function AdminPickupPanel() {
  const [records, setRecords]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pickup?all=true")
      .then(r => r.json())
      .then(d => setRecords(Array.isArray(d) ? d : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  // Group by enquiry_id
  const grouped = records.reduce((acc: Record<string, any>, r) => {
    const key = r.enquiry_id;
    if (!acc[key]) acc[key] = { child: r.enquiries || {}, childName: r.child_name, auths: [] };
    acc[key].auths.push(r);
    return acc;
  }, {});

  const entries = Object.entries(grouped).filter(([, g]: [string, any]) => {
    const q = search.toLowerCase();
    return !q || (g.childName || "").toLowerCase().includes(q) || (g.child.phone || "").includes(q);
  });

  return (
    <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#178F78" }}>🚗 Pickup Authorizations</div>
          <div style={{ fontSize:"12px", color:"#6B7A99" }}>{entries.length} children with pickup records</div>
        </div>
        <div style={{ position:"relative" }}>
          <Search style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", width:"15px", height:"15px", color:"#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
            style={{ paddingLeft:"32px", paddingRight:"12px", height:"36px", border:"1px solid #EDE8DF", borderRadius:"20px", fontSize:"12px", color:"#1A2F4A", outline:"none", width:"220px" }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#6B7A99" }}>
          <div style={{ width:"36px", height:"36px", border:"3px solid #EDE8DF", borderTopColor:"#178F78", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#6B7A99", background:"white", borderRadius:"20px", border:"1px solid #EDE8DF" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🚗</div>
          <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"6px" }}>{search ? "No records match" : "No pickup authorizations yet"}</div>
          <div style={{ fontSize:"12px" }}>Parents add authorized pickup persons from their dashboard.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {entries.map(([enquiryId, g]: [string, any]) => {
            const isOpen = expanded === enquiryId;
            return (
              <div key={enquiryId} style={{ background:"white", border:"1px solid #EDE8DF", borderRadius:"16px", overflow:"hidden" }}>
                <div onClick={() => setExpanded(isOpen ? null : enquiryId)}
                  style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", cursor:"pointer", flexWrap:"wrap" }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(23,143,120,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>🧒</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{g.childName || g.child.child_name || "Unknown"}</div>
                    <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                      {g.child.program_label || ""}{g.child.section_name ? ` · ${g.child.section_name}` : ""}
                      {g.child.phone ? ` · ${g.child.phone}` : ""}
                    </div>
                  </div>
                  <span style={{ fontSize:"11px", fontWeight:700, background:"rgba(99,102,241,0.1)", color:"#6366F1", borderRadius:"20px", padding:"2px 10px" }}>
                    🚗 {g.auths.length} authorized
                  </span>
                  <span style={{ color:"#9CA3AF", fontSize:"18px" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ borderTop:"1px solid #EDE8DF", padding:"16px 18px", background:"#FEFCF8" }}>
                    {g.auths.map((a: any) => (
                      <div key={a.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:"1px solid #EDE8DF" }}>
                        <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(99,102,241,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>👤</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{a.authorized_name} <span style={{ fontWeight:400, color:"#6B7A99" }}>({a.relation})</span></div>
                          <a href={`tel:${a.phone}`} style={{ fontSize:"11px", color:"#178F78", fontWeight:600, textDecoration:"none" }}>{a.phone}</a>
                          {a.id_number && <span style={{ fontSize:"10px", color:"#9CA3AF", marginLeft:"8px", fontFamily:"monospace" }}>{a.id_type}: {a.id_number}</span>}
                          {a.notes && <div style={{ fontSize:"11px", color:"#6B7A99", marginTop:"2px", fontStyle:"italic" }}>{a.notes}</div>}
                        </div>
                        <span style={{ fontSize:"10px", fontWeight:700, background: a.is_active ? "rgba(23,143,120,0.1)" : "rgba(220,38,38,0.08)", color: a.is_active ? "#178F78" : "#DC2626", borderRadius:"20px", padding:"2px 10px" }}>
                          {a.is_active ? "Active" : "Paused"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Admin Medical Records Panel ──────────────────────────────
function AdminMedicalPanel() {
  const [records, setRecords]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/medical?all=true")
      .then(r => r.json())
      .then(d => setRecords(Array.isArray(d) ? d : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const SEV_COLOR: Record<string, string> = { mild:"#F5B829", moderate:"#E8694A", severe:"#DC2626" };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const child = r.enquiries || {};
    return !q
      || (r.child_name || child.child_name || "").toLowerCase().includes(q)
      || (child.phone || "").includes(q)
      || (child.program_label || "").toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#178F78" }}>🩺 Child Medical Records</div>
          <div style={{ fontSize:"12px", color:"#6B7A99" }}>{records.length} records on file</div>
        </div>
        <div style={{ position:"relative" }}>
          <Search style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", width:"15px", height:"15px", color:"#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
            style={{ paddingLeft:"32px", paddingRight:"12px", height:"36px", border:"1px solid #EDE8DF", borderRadius:"20px", fontSize:"12px", color:"#1A2F4A", outline:"none", width:"220px" }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#6B7A99" }}>
          <div style={{ width:"36px", height:"36px", border:"3px solid #EDE8DF", borderTopColor:"#178F78", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 12px" }} />
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#6B7A99", background:"white", borderRadius:"20px", border:"1px solid #EDE8DF" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🩺</div>
          <div style={{ fontWeight:700, fontSize:"15px", marginBottom:"6px" }}>
            {search ? "No records match your search" : "No medical records yet"}
          </div>
          <div style={{ fontSize:"12px" }}>Records are submitted by parents from their dashboard.</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtered.map(r => {
            const child      = r.enquiries || {};
            const name       = r.child_name || child.child_name || "Unknown";
            const allergies  = r.allergies  || [];
            const isOpen     = expanded === r.enquiry_id;
            const hasAlerts  = allergies.length > 0 || r.medical_conditions;

            return (
              <div key={r.enquiry_id} style={{ background:"white", border:"1px solid #EDE8DF", borderRadius:"16px", overflow:"hidden" }}>
                {/* Summary row */}
                <div
                  onClick={() => setExpanded(isOpen ? null : r.enquiry_id)}
                  style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px", cursor:"pointer", flexWrap:"wrap" }}>
                  <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:"linear-gradient(135deg,rgba(23,143,120,0.15),rgba(99,102,241,0.15))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>🧒</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{name}</div>
                    <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                      {child.program_label || ""}{child.section_name ? ` · ${child.section_name}` : ""}
                      {child.phone ? ` · ${child.phone}` : ""}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
                    {r.blood_group && r.blood_group !== "unknown" && (
                      <span style={{ fontSize:"11px", fontWeight:700, background:"rgba(220,38,38,0.1)", color:"#DC2626", borderRadius:"20px", padding:"2px 10px" }}>🩸 {r.blood_group}</span>
                    )}
                    {allergies.length > 0 && (
                      <span style={{ fontSize:"11px", fontWeight:700, background:"rgba(220,38,38,0.1)", color:"#DC2626", borderRadius:"20px", padding:"2px 10px" }}>
                        ⚠️ {allergies.length} allerg{allergies.length > 1 ? "ies" : "y"}
                      </span>
                    )}
                    {r.medical_conditions && (
                      <span style={{ fontSize:"11px", fontWeight:700, background:"rgba(245,184,41,0.15)", color:"#B08000", borderRadius:"20px", padding:"2px 10px" }}>🏥 Condition</span>
                    )}
                    {!hasAlerts && (
                      <span style={{ fontSize:"11px", color:"#178F78", background:"rgba(23,143,120,0.08)", borderRadius:"20px", padding:"2px 10px" }}>✅ No alerts</span>
                    )}
                  </div>
                  <span style={{ color:"#9CA3AF", fontSize:"18px", flexShrink:0 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ borderTop:"1px solid #EDE8DF", padding:"18px", background:"#FEFCF8" }}>
                    <ChildMedicalTab
                      enquiryId={r.enquiry_id}
                      childName={name}
                      updatedBy="admin"
                      readOnly={false}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession]       = useState<any>(null);
  const [tab, setTab]               = useState<AdminTab>("enquiries");
  const [allowedTabs, setAllowedTabs] = useState<string[] | null>(null);
  const [editingChild, setEditingChild]   = useState<any>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [staffList, setStaffList]         = useState<any[]>([]);

  // Programme state
  const [programOptions, setProgramOptions] = useState<{id:string;label:string;icon?:string;color?:string;sort_order?:number}[]>([]);
  const [showProgForm, setShowProgForm]     = useState(false);
  const [editingProg, setEditingProg]       = useState<any>(null);
  const [progForm, setProgForm]             = useState({ slug:"", label:"", icon:"🎓", color:"#178F78", sort_order:0 });
  const [progSaving, setProgSaving]         = useState(false);

  // Announcements state
  const [announcements, setAnnouncements]       = useState<any[]>([]);
  const [newAnnForm, setNewAnnForm]             = useState({ title:"", body:"", target:"all", priority:"normal" });
  const [showAnnForm, setShowAnnForm]           = useState(false);
  const [annSaving, setAnnSaving]               = useState(false);
  const [editingAnn, setEditingAnn]             = useState<any>(null);

  // Expenses state
  const [expenses, setExpenses]         = useState<any[]>([]);
  const [expMonth, setExpMonth]         = useState(new Date().toISOString().slice(0, 7));
  const [showExpForm, setShowExpForm]   = useState(false);
  const [expForm, setExpForm]           = useState({ category:"salaries", title:"", amount:"", date:new Date().toISOString().split("T")[0], notes:"" });
  const [expSaving, setExpSaving]       = useState(false);

  // Bulk selection state
  const [bulkMode, setBulkMode]           = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [rolloverModal, setRolloverModal] = useState(false);
  const [rolloverTargetYear, setRolloverTargetYear] = useState("");
  const [bulkActionMsg, setBulkActionMsg] = useState("");
  const [bulkWorking, setBulkWorking]     = useState(false);
  const [yearFilter, setYearFilter]       = useState("all");

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

  // Public holiday loader state
  const [schoolState, setSchoolState]           = useState("");
  const [calAcademicYear, setCalAcademicYear]   = useState("all");
  const [holidayPreview, setHolidayPreview]     = useState<any[]>([]);
  const [savedHolidayDates, setSavedHolidayDates] = useState<Set<string>>(new Set());
  const [newHolSelected, setNewHolSelected]     = useState<Set<string>>(new Set());
  const [loadingHolidays, setLoadingHolidays]   = useState(false);
  const [savingHolidays, setSavingHolidays]     = useState(false);
  const [holidayMsg, setHolidayMsg]             = useState("");
  const loadedHolidayKeyRef = useRef("");

  // ── Auth check ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) { router.replace("/admin-login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setSession(data);
          // Fetch tab permissions for this admin's role
          fetch("/api/admin/permissions", { credentials: "include" })
            .then(r => r.json())
            .then(d => setAllowedTabs(d.permissions ?? null))
            .catch(() => setAllowedTabs(null));
        }
      })
      .catch(() => router.replace("/admin-login"));
  }, [router]);

  // Switch to first allowed tab if current tab is restricted
  useEffect(() => {
    if (allowedTabs && allowedTabs.length > 0 && !allowedTabs.includes(tab)) {
      setTab(allowedTabs[0] as AdminTab);
    }
  }, [allowedTabs, tab]);

  // ── Load data ───────────────────────────────────────────
  const loadProgrammes = useCallback(async () => {
    const r = await fetch("/api/programmes", { cache: "no-store" });
    const d = await r.json();
    const list = (d.programmes || []).map((p: any) => ({ id: p.slug, label: p.label, icon: p.icon, color: p.color, sort_order: p.sort_order, _id: p.id }));
    setProgramOptions(list);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    const r = await fetch("/api/admin/announcements");
    const d = await r.json();
    setAnnouncements(Array.isArray(d) ? d : []);
  }, []);

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

  useEffect(() => {
    if (session) {
      loadEnquiries();
      loadSections();
      loadProgrammes();
      fetch("/api/academic-years").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setAcademicYears(d);
      });
    }
  }, [session, loadEnquiries, loadSections, loadProgrammes]);
  const onAcademicYearChange = useCallback(() => {
    loadEnquiries();
    fetch("/api/academic-years").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAcademicYears(d);
    });
    // Reset cache so holiday panel reloads with fresh year list
    loadedHolidayKeyRef.current = "";
  }, [loadEnquiries]);

  const loadHolidayPanel = useCallback(async (state: string, academicYear: string, schoolAcademicYears: any[]) => {
    const calYear = calMonth.slice(0, 4);
    let yearStart = calYear;
    let yearEnd   = calYear;
    let startDate = `${calYear}-01-01`;
    let endDate   = `${calYear}-12-31`;
    let autoSelectAll = false;

    if (academicYear !== "all") {
      const ay = schoolAcademicYears.find((a: any) => a.id === academicYear);
      if (ay) {
        startDate = ay.start_date;
        endDate   = ay.end_date;
        yearStart = ay.start_date.slice(0, 4);
        yearEnd   = ay.end_date.slice(0, 4);
        autoSelectAll = true; // academic year chosen → pre-select all
      }
    }

    const cacheKey = `${yearStart}-${yearEnd}-${state}-${academicYear}`;
    if (cacheKey === loadedHolidayKeyRef.current) return;
    loadedHolidayKeyRef.current = cacheKey;

    setLoadingHolidays(true);
    setHolidayPreview([]);
    setHolidayMsg("");

    try {
      // Fetch holidays (two years if academic year spans two calendar years)
      const fetches = [
        fetch(`/api/admin/holidays?year=${yearStart}&state=${encodeURIComponent(state)}`, { cache: "no-store" }).then(r => r.json()),
      ];
      if (yearEnd !== yearStart) {
        fetches.push(fetch(`/api/admin/holidays?year=${yearEnd}&state=${encodeURIComponent(state)}`, { cache: "no-store" }).then(r => r.json()));
      }
      const results = await Promise.all(fetches);
      let allHolidays: any[] = results.flatMap((hd: any) => hd.holidays || []);

      // Filter to academic year date range
      if (academicYear !== "all") {
        allHolidays = allHolidays.filter(h => h.date >= startDate && h.date <= endDate);
      }

      // Deduplicate
      const seen = new Set<string>();
      allHolidays = allHolidays.filter(h => {
        const k = `${h.date}::${h.name}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      });
      allHolidays.sort((a, b) => a.date.localeCompare(b.date));

      // Fetch existing calendar events for the year range (for comparison)
      const evRes = await fetch(`/api/admin/calendar?year=${yearStart}&yearEnd=${yearEnd}`, { cache: "no-store" });
      const evData = await evRes.json();
      const existingDates = new Set<string>(
        (evData.events || []).filter((e: any) => e.event_type === "holiday").map((e: any) => e.event_date)
      );
      setSavedHolidayDates(existingDates);

      setHolidayPreview(allHolidays);

      // Auto-select: academic year → all new ones selected; otherwise → none selected
      if (autoSelectAll) {
        setNewHolSelected(new Set(allHolidays.filter(h => !existingDates.has(h.date)).map((h: any) => h.date)));
      } else {
        setNewHolSelected(new Set());
      }

      if (allHolidays.length === 0) setHolidayMsg("No holidays found for this period.");
    } catch {
      setHolidayMsg("Could not load holidays.");
    } finally {
      setLoadingHolidays(false);
    }
  }, [calMonth]);

  useEffect(() => {
    if (session && tab === "calendar") {
      loadEvents();
      fetch("/api/settings", { cache: "no-store" })
        .then(r => r.json())
        .then(d => {
          const state = d.state || "";
          setSchoolState(state);
          loadHolidayPanel(state, calAcademicYear, academicYears);
        });
    }
  }, [session, tab, calMonth, calAcademicYear, loadEvents, academicYears, loadHolidayPanel]);
  useEffect(() => { if (session && tab === "announcements") loadAnnouncements(); }, [session, tab, loadAnnouncements]);

  const loadExpenses = useCallback(async () => {
    const r = await fetch(`/api/owner/expenses?month=${expMonth}`);
    if (r.ok) { const d = await r.json(); setExpenses(d.expenses || []); }
  }, [expMonth]);
  useEffect(() => { if (session && tab === "expenses") loadExpenses(); }, [session, tab, expMonth, loadExpenses]);
  useEffect(() => {
    if (session && tab === "sections" && staffList.length === 0) {
      fetch("/api/staff").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setStaffList(d);
      });
    }
  }, [session, tab, staffList.length]);

  // ── Public Holiday Loader ─────────────────────────────────
  const savePublicHolidays = async () => {
    const toSave = holidayPreview.filter(h => newHolSelected.has(h.date) && !savedHolidayDates.has(h.date));
    if (toSave.length === 0) return;
    setSavingHolidays(true);
    setHolidayMsg("");
    let saved = 0;
    for (const h of toSave) {
      const r = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: h.name, event_date: h.date, event_type: "holiday",
          icon: h.icon || "🗓️", color: "#E8694A", is_holiday: true,
          description: h.source === "state" ? `${schoolState} holiday` : "National holiday",
          affects: "all",
        }),
      });
      if (r.ok) saved++;
    }
    // Refresh: update saved dates set, clear selections, reload month view
    const newSaved = new Set(savedHolidayDates);
    toSave.forEach(h => newSaved.add(h.date));
    setSavedHolidayDates(newSaved);
    setNewHolSelected(new Set());
    await loadEvents();
    setHolidayMsg(`✓ ${saved} holiday${saved !== 1 ? "s" : ""} added to calendar.`);
    setSavingHolidays(false);
  };

  // ── Programme CRUD ────────────────────────────────────────
  const addProgramme = async () => {
    if (!progForm.slug || !progForm.label) return;
    setProgSaving(true);
    await fetch("/api/programmes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(progForm) });
    await loadProgrammes();
    setProgForm({ slug: "", label: "", icon: "🎓", color: "#178F78", sort_order: 0 });
    setShowProgForm(false);
    setProgSaving(false);
  };

  const saveProgramme = async () => {
    if (!editingProg) return;
    setProgSaving(true);
    await fetch("/api/programmes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingProg._id, label: editingProg.label, icon: editingProg.icon, color: editingProg.color, sort_order: editingProg.sort_order }) });
    await loadProgrammes();
    setEditingProg(null);
    setProgSaving(false);
  };

  const deleteProgramme = async (programmeId: string) => {
    if (!confirm("Delete this programme? Existing sections/enquiries using it won't be affected.")) return;
    await fetch(`/api/programmes?id=${programmeId}`, { method: "DELETE" });
    await loadProgrammes();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.push("/admin-login");
  };

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
  const currentYear = academicYears.find(y => y.is_current);

  const filtered = enquiries.filter(e => {
    const matchS  = filterStatus === "all" || e.status === filterStatus;
    const matchQ  = !search || e.child_name?.toLowerCase().includes(search.toLowerCase()) || e.phone?.includes(search);
    const matchY  = yearFilter === "all"
      ? true
      : yearFilter === "current"
      ? e.academic_year_id === currentYear?.id || (!e.academic_year_id && currentYear)
      : e.academic_year_id === yearFilter;
    return matchS && matchQ && matchY;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const clearBulk = () => {
    setSelectedIds(new Set());
    setBulkMode(false);
    setBulkActionMsg("");
    setRolloverModal(false);
    setRolloverTargetYear("");
  };

  const doBulkRollover = async () => {
    if (!rolloverTargetYear || selectedIds.size === 0) return;
    setBulkWorking(true);
    setBulkActionMsg("");
    const res  = await fetch("/api/academic-years", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rollover_selected", enquiry_ids: Array.from(selectedIds), to_year_id: rolloverTargetYear }),
    });
    const data = await res.json();
    setBulkWorking(false);
    if (data.success) {
      setBulkActionMsg(`✅ ${data.count} children rolled over successfully!`);
      loadEnquiries();
      setTimeout(() => { clearBulk(); setRolloverModal(false); }, 1800);
    } else {
      setBulkActionMsg("❌ " + (data.error || "Failed"));
    }
  };

  const doBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    const res  = await fetch("/api/academic-years", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_status", enquiry_ids: Array.from(selectedIds), status }),
    });
    const data = await res.json();
    setBulkWorking(false);
    if (data.success) { loadEnquiries(); clearBulk(); }
  };

  const doBulkSection = async (sectionId: string, sectionName: string) => {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    const res  = await fetch("/api/academic-years", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_section", enquiry_ids: Array.from(selectedIds), section_id: sectionId, section_name: sectionName }),
    });
    const data = await res.json();
    setBulkWorking(false);
    if (data.success) { loadEnquiries(); clearBulk(); }
  };

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
        {allowedTabs && (
          <a href="/teacher-dashboard" style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.1)", borderRadius:"20px", padding:"5px 12px", color:"white", fontSize:"11px", fontWeight:600, textDecoration:"none" }}>
            👩‍🏫 Staff Dashboard
          </a>
        )}
        <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.1)", border:"none", borderRadius:"20px", padding:"5px 12px", color:"white", fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
          <LogOut style={{ width:"13px", height:"13px" }} /> Logout
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ background:"white", borderBottom:"1px solid #EDE8DF", padding:"0 24px", display:"flex", gap:"0", overflowX:"auto" }}>
        {([
          { key:"enquiries", label:"📋 Enquiries", count: enquiries.length },
          { key:"sections",  label:"🏫 Sections",  count: sections.length  },
          { key:"calendar",  label:"📅 Calendar",  count: events.length    },
          { key:"photos",    label:"📸 Photos",    count: 0                },
          { key:"fees",      label:"💳 Fees",      count: 0                },
          { key:"staff",     label:"👩‍🏫 Staff",    count: 0                },
          { key:"settings",  label:"⚙️ Settings",  count: 0                },
          { key:"import",    label:"📥 Import Data",   count: 0             },
          { key:"kit",           label:"🎒 Kit Manager",    count: 0                        },
          { key:"announcements", label:"📢 Announcements", count: announcements.length     },
          { key:"expenses",      label:"💸 Expenses",      count: 0                         },
          { key:"reports",       label:"📊 Reports",       count: 0                         },
          { key:"transport",     label:"🚌 Transport",     count: 0                         },
          { key:"medical",       label:"🩺 Medical",       count: 0 },
          { key:"pickup",        label:"🚗 Pickup Auth",   count: 0 },
          { key:"payroll",       label:"💰 Payroll",       count: 0 },
          { key:"ptm",           label:"📅 PTM",           count: 0 },
          { key:"blog",          label:"📝 Blog",          count: 0 },
          { key:"referrals",     label:"🎁 Referrals",     count: 0 },
          { key:"followups",     label:"📋 Follow-Ups",    count: 0 },
          { key:"birthdays",     label:"🎂 Birthdays",     count: 0 },
          { key:"testimonials",  label:"💬 Testimonials",  count: 0 },
          { key:"incidents",     label:"🚨 Incidents",     count: 0 },
        ] as const).filter(t => !allowedTabs || allowedTabs.includes(t.key)).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"14px 18px", border:"none", borderBottom:`3px solid ${tab===t.key ? "#178F78" : "transparent"}`, background:"transparent", fontWeight:700, fontSize:"12px", color:tab===t.key ? "#178F78" : "#6B7A99", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", whiteSpace:"nowrap", flexShrink:0 }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ background:tab===t.key ? "#178F78" : "#EDE8DF", color:tab===t.key ? "white" : "#6B7A99", borderRadius:"20px", padding:"1px 7px", fontSize:"10px" }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>

        {/* ══ ENQUIRIES TAB ══ */}
        {tab === "enquiries" && (
          <div>
            {/* Filters row */}
            <div style={{ display:"flex", gap:"10px", marginBottom:"12px", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:"180px" }}>
                <Search style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", width:"14px", height:"14px", color:"#6B7A99" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
                  style={{ ...inp(), paddingLeft:"32px" }} />
              </div>
              <select value={filterStatus} onChange={e => setFilter(e.target.value)} style={inp({ width:"auto" })}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
              {/* Academic Year filter */}
              <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} style={inp({ width:"auto" })}>
                <option value="all">All Years</option>
                <option value="current">Current Year</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.label}{y.is_current ? " ★" : ""}</option>)}
              </select>
              <div style={{ background:"rgba(23,143,120,0.1)", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:700, color:"#178F78" }}>
                {filtered.length} records
              </div>
              {/* Bulk select toggle */}
              <button onClick={() => { setBulkMode(m => !m); setSelectedIds(new Set()); }}
                style={{ background: bulkMode ? "#1A2F4A" : "rgba(26,47,74,0.08)", color: bulkMode ? "white" : "#1A2F4A", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                {bulkMode ? "✕ Cancel Select" : "☑ Bulk Select"}
              </button>
            </div>

            {/* Bulk action bar — appears when items selected */}
            {bulkMode && selectedIds.size > 0 && (
              <div style={{ background:"#1A2F4A", borderRadius:"14px", padding:"12px 16px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
                <div style={{ color:"white", fontWeight:700, fontSize:"13px", marginRight:"4px" }}>
                  {selectedIds.size} selected
                </div>

                {/* Rollover */}
                <button onClick={() => setRolloverModal(true)}
                  style={{ background:"#F5B829", color:"#1A2F4A", border:"none", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                  🎓 Roll Over to Next Year
                </button>

                {/* Bulk status */}
                <select onChange={e => { if (e.target.value) { doBulkStatus(e.target.value); e.target.value = ""; } }}
                  style={{ ...inp({ width:"auto", fontSize:"12px" }), background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)" }}
                  defaultValue="">
                  <option value="" disabled>📋 Change Status…</option>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ color:"#1A2F4A" }}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>

                {/* Bulk section assign */}
                <select onChange={e => {
                  const sec = sections.find(s => s.id === e.target.value);
                  if (sec) { doBulkSection(sec.id, sec.name); e.target.value = ""; }
                }} style={{ ...inp({ width:"auto", fontSize:"12px" }), background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)" }}
                  defaultValue="">
                  <option value="" disabled>🏫 Assign Section…</option>
                  {sections.map(s => <option key={s.id} value={s.id} style={{ color:"#1A2F4A" }}>{s.name} ({s.program_label})</option>)}
                </select>

                {bulkWorking && <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>Working…</div>}

                {/* Select all / deselect */}
                <button onClick={toggleAll}
                  style={{ background:"rgba(255,255,255,0.1)", color:"white", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"8px", padding:"7px 12px", fontSize:"12px", cursor:"pointer", marginLeft:"auto" }}>
                  {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
                </button>
              </div>
            )}

            {/* Bulk mode header row */}
            {bulkMode && (
              <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"6px 16px", marginBottom:"6px" }}>
                <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll} style={{ width:"16px", height:"16px", cursor:"pointer" }} />
                <span style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99" }}>SELECT ALL {filtered.length} CHILDREN</span>
              </div>
            )}

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
                <div key={e.id}
                  onClick={() => { if (bulkMode && editingEnquiry?.id !== e.id) toggleSelect(e.id); }}
                  style={{ background: selectedIds.has(e.id) ? "rgba(23,143,120,0.05)" : "white", borderRadius:"16px", border:`1px solid ${selectedIds.has(e.id) ? "#178F78" : "#EDE8DF"}`, padding:"14px 16px", cursor: bulkMode ? "pointer" : "default", transition:"all 0.15s" }}>
                  {editingEnquiry?.id === e.id ? (
                    /* ── Quick Edit mode (status / section / notes) ── */
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
                    /* ── View mode ── */
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                      {/* Bulk select checkbox */}
                      {bulkMode && (
                        <input type="checkbox" checked={selectedIds.has(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          style={{ width:"18px", height:"18px", cursor:"pointer", flexShrink:0 }} />
                      )}
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
                            try {
                              const sb  = await getSb();
                              const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
                              const fileName = `profiles/${e.id}.${ext}`;
                              const { error: uploadErr } = await sb.storage
                                .from("school-photos")
                                .upload(fileName, file, { contentType: file.type, upsert: true });
                              if (uploadErr) { alert("Upload failed: " + uploadErr.message); return; }
                              const { data: urlData } = sb.storage.from("school-photos").getPublicUrl(fileName);
                              const photoUrl = urlData.publicUrl + `?t=${Date.now()}`;
                              await fetch("/api/photos/profile", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ enquiryId: e.id, photoUrl }),
                              });
                              loadEnquiries();
                            } catch (err: any) {
                              alert("Error: " + err.message);
                            }
                            ev.target.value = "";
                          }} />
                      </div>

                      {/* Name + phone */}
                      <div style={{ flex:1, minWidth:"150px" }}>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{e.child_name}</div>
                        <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                          📞 {e.phone} · {e.program_label || "No programme"}
                          {/* Parent names if filled */}
                          {(e.father_name || e.mother_name) && (
                            <span style={{ marginLeft:"6px" }}>
                              · 👤 {e.father_name || e.mother_name}
                            </span>
                          )}
                        </div>
                        {/* Health info if filled */}
                        {(e.blood_group || e.allergies) && (
                          <div style={{ fontSize:"10px", color:"#E8694A", marginTop:"2px" }}>
                            {e.blood_group && `🩸 ${e.blood_group}`}
                            {e.blood_group && e.allergies && "  "}
                            {e.allergies && `⚠️ ${e.allergies}`}
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize:"11px", color:"#6B7A99" }}>
                        {e.child_dob ? `Age: ${Math.floor((e.child_age_months||0)/12)}y ${(e.child_age_months||0)%12}m` : "DOB not provided"}
                      </div>

                      {e.section_name && (
                        <span style={{ background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:700 }}>📚 {e.section_name}</span>
                      )}
                      {/* Academic year badge */}
                      {(() => {
                        const yr = academicYears.find(y => y.id === e.academic_year_id);
                        return yr ? (
                          <span style={{ background: yr.is_current ? "rgba(245,184,41,0.12)" : "rgba(107,114,128,0.1)", color: yr.is_current ? "#B08000" : "#6B7280", borderRadius:"20px", padding:"3px 8px", fontSize:"9px", fontWeight:700 }}>
                            🎓 {yr.label}
                          </span>
                        ) : null;
                      })()}

                      {e.notes && <div style={{ fontSize:"10px", color:"#6B7A99", fontStyle:"italic" }}>"{e.notes}"</div>}

                      <span style={{ background:`${STATUS_COLORS[e.status]||"#6B7A99"}15`, color:STATUS_COLORS[e.status]||"#6B7A99", border:`1px solid ${STATUS_COLORS[e.status]||"#6B7A99"}40`, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:700, textTransform:"capitalize" }}>
                        {e.status}
                      </span>

                      <div style={{ fontSize:"10px", color:"#6B7A99" }}>{new Date(e.created_at).toLocaleDateString("en-IN")}</div>

                      {/* Action buttons */}
                      <div style={{ display:"flex", gap:"6px" }}>
                        {/* Quick edit — status/section/notes */}
                        <button onClick={() => setEditEnq({ ...e })}
                          style={{ background:"rgba(23,143,120,0.08)", border:"none", borderRadius:"10px", padding:"6px 12px", fontSize:"11px", fontWeight:700, color:"#178F78", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                          <Edit2 style={{ width:"12px", height:"12px" }} /> Edit
                        </button>
                        {/* Full child profile editor */}
                        <button onClick={() => setEditingChild(e)}
                          style={{ background:"rgba(99,102,241,0.08)", border:"none", borderRadius:"10px", padding:"6px 12px", fontSize:"11px", fontWeight:700, color:"#6366F1", cursor:"pointer" }}>
                          👶 Profile
                        </button>
                      </div>
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

            {/* ── Programme Manager ── */}
            <div style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>📚 Programmes</div>
                {!showProgForm && !editingProg && (
                  <button onClick={() => setShowProgForm(true)}
                    style={{ display:"flex", alignItems:"center", gap:"5px", background:"rgba(23,143,120,0.1)", color:"#178F78", border:"none", borderRadius:"10px", padding:"6px 12px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                    <Plus style={{ width:"12px", height:"12px" }} /> Add Programme
                  </button>
                )}
              </div>

              {/* List */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom: showProgForm ? "12px" : "0" }}>
                {programOptions.map((p: any) => (
                  <div key={p.id} style={{ background:"#FAF0E8", borderRadius:"10px", padding:"6px 10px", display:"flex", alignItems:"center", gap:"6px", fontSize:"12px" }}>
                    {editingProg?._id === p._id ? (
                      <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
                        <input value={editingProg.label} onChange={e => setEditingProg((v: any) => ({ ...v, label: e.target.value }))}
                          style={{ ...inp(), width:"120px", padding:"4px 8px", fontSize:"12px" }} placeholder="Label" />
                        <input value={editingProg.icon} onChange={e => setEditingProg((v: any) => ({ ...v, icon: e.target.value }))}
                          style={{ ...inp(), width:"52px", padding:"4px 8px", fontSize:"12px", textAlign:"center" }} placeholder="🎓" />
                        <input value={editingProg.color} onChange={e => setEditingProg((v: any) => ({ ...v, color: e.target.value }))}
                          style={{ ...inp(), width:"90px", padding:"4px 8px", fontSize:"12px" }} placeholder="#178F78" />
                        <input type="number" value={editingProg.sort_order} onChange={e => setEditingProg((v: any) => ({ ...v, sort_order: parseInt(e.target.value) || 0 }))}
                          style={{ ...inp(), width:"56px", padding:"4px 8px", fontSize:"12px" }} placeholder="Order" />
                        <button onClick={saveProgramme} disabled={progSaving}
                          style={{ background:"#178F78", color:"white", border:"none", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:700, cursor:"pointer" }}>
                          {progSaving ? "…" : "Save"}
                        </button>
                        <button onClick={() => setEditingProg(null)}
                          style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"8px", padding:"4px 8px", fontSize:"11px", cursor:"pointer" }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize:"16px" }}>{p.icon || "🎓"}</span>
                        <span style={{ fontWeight:700, color:"#1A2F4A" }}>{p.label}</span>
                        <span style={{ color:"#9CA3AF" }}>({p.id})</span>
                        <button onClick={() => setEditingProg(p)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#178F78", padding:"0 2px" }} title="Edit">✏️</button>
                        <button onClick={() => deleteProgramme(p._id)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#E8694A", padding:"0 2px" }} title="Delete">✕</button>
                      </>
                    )}
                  </div>
                ))}
                {programOptions.length === 0 && (
                  <div style={{ fontSize:"12px", color:"#9CA3AF" }}>No programmes yet. Add one to get started.</div>
                )}
              </div>

              {/* Add form */}
              {showProgForm && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"flex-end", borderTop:"1px solid #EDE8DF", paddingTop:"12px" }}>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"3px" }}>SLUG (unique ID)</label>
                    <input value={progForm.slug} onChange={e => setProgForm(p => ({ ...p, slug: e.target.value }))}
                      style={{ ...inp(), width:"110px", padding:"6px 10px", fontSize:"12px" }} placeholder="e.g. nursery" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"3px" }}>LABEL</label>
                    <input value={progForm.label} onChange={e => setProgForm(p => ({ ...p, label: e.target.value }))}
                      style={{ ...inp(), width:"130px", padding:"6px 10px", fontSize:"12px" }} placeholder="e.g. Nursery" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"3px" }}>ICON</label>
                    <input value={progForm.icon} onChange={e => setProgForm(p => ({ ...p, icon: e.target.value }))}
                      style={{ ...inp(), width:"52px", padding:"6px 8px", fontSize:"12px", textAlign:"center" }} placeholder="🎓" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"3px" }}>COLOR</label>
                    <input value={progForm.color} onChange={e => setProgForm(p => ({ ...p, color: e.target.value }))}
                      style={{ ...inp(), width:"90px", padding:"6px 10px", fontSize:"12px" }} placeholder="#178F78" />
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"3px" }}>ORDER</label>
                    <input type="number" value={progForm.sort_order} onChange={e => setProgForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                      style={{ ...inp(), width:"56px", padding:"6px 8px", fontSize:"12px" }} />
                  </div>
                  <button onClick={addProgramme} disabled={progSaving || !progForm.slug || !progForm.label}
                    style={{ background: !progForm.slug || !progForm.label ? "#EDE8DF" : "#178F78", color: !progForm.slug || !progForm.label ? "#9CA3AF" : "white", border:"none", borderRadius:"10px", padding:"7px 16px", fontSize:"12px", fontWeight:700, cursor: !progForm.slug || !progForm.label ? "not-allowed" : "pointer" }}>
                    {progSaving ? "Adding…" : "Add"}
                  </button>
                  <button onClick={() => setShowProgForm(false)}
                    style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"7px 12px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
                </div>
              )}
            </div>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>Class Sections</div>
              <button onClick={() => { setNewSec(true); setEditSec({ name:"", program_id: programOptions[0]?.id || "nursery", program_label: programOptions[0]?.label || "Nursery", class_teacher:"", strength:20, academic_year:"2025-26" }); }}
                style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                <Plus style={{ width:"14px", height:"14px" }} /> Add Section
              </button>
            </div>

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
                      const prog = programOptions.find(p => p.id === e.target.value);
                      setEditSec((p:any) => ({ ...p, program_id: e.target.value, program_label: prog?.label || "" }));
                    }} style={inp()}>
                      {programOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>CLASS TEACHER</label>
                    <select value={editingSection.class_teacher_id || ""} onChange={e => {
                      const teacher = staffList.find(s => s.id === e.target.value);
                      setEditSec((p:any) => ({
                        ...p,
                        class_teacher_id: e.target.value || null,
                        class_teacher: teacher?.name || "",
                      }));
                    }} style={inp()}>
                      <option value="">— No teacher assigned —</option>
                      {staffList
                        .filter(s => {
                          // Only show active teachers (no last_working_day or future last_working_day)
                          if (!s.last_working_day) return true;
                          return new Date(s.last_working_day) >= new Date();
                        })
                        .filter(s => ["Teacher", "Class Teacher"].includes(s.role))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                        ))
                      }
                    </select>
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

            {programOptions.map(prog => {
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
                            <div style={{ background:"#178F78", height:"100%", width:`${Math.min(100,(childCount/s.strength)*100)}%`, borderRadius:"8px", transition:"width 0.3s" }} />
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
            {/* ── Academic Year management (top) ── */}
            <AcademicYearTab onYearChange={onAcademicYearChange} />
            <div style={{ borderTop:"2px solid #EDE8DF", margin:"20px 0" }} />

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>Calendar & Events</div>
              <div style={{ display:"flex", gap:"10px" }}>
                <input type="month" value={calMonth} onChange={e => setCalMonth(e.target.value)}
                  style={{ ...inp({ width:"auto" }), padding:"7px 12px" }} />
                <button onClick={() => { setNewEvt(true); setEditEvt({ title:"", event_date:`${calMonth}-01`, event_type:"activity", icon:"📅", color:"#178F78", is_holiday:false, description:"", affects:"all" }); }}
                  style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                  <Plus style={{ width:"14px", height:"14px" }} /> Add Event
                </button>
              </div>
            </div>

            {/* ── Public Holiday Loader ── */}
            {(() => {
              const savedHols = holidayPreview.filter(h => savedHolidayDates.has(h.date));
              const newHols   = holidayPreview.filter(h => !savedHolidayDates.has(h.date));
              const canSave   = newHolSelected.size > 0 && !savingHolidays;
              return (
                <div style={{ background:"white", borderRadius:"16px", border:"1px solid #EDE8DF", padding:"16px", marginBottom:"18px" }}>
                  {/* Header row */}
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"10px", marginBottom:"12px" }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A", marginBottom:"2px" }}>
                        🌐 Public Holidays
                        {loadingHolidays && <span style={{ marginLeft:"8px", fontSize:"11px", color:"#4A90D9", fontWeight:400 }}>Loading…</span>}
                      </div>
                      {schoolState
                        ? <div style={{ fontSize:"11px", color:"#178F78" }}>State: <strong>{schoolState}</strong> · National + state holidays</div>
                        : <div style={{ fontSize:"11px", color:"#E8694A" }}>⚠ No state — <a href="#" onClick={e=>{e.preventDefault();setTab("settings");}} style={{color:"#E8694A",fontWeight:700}}>set in Settings</a></div>
                      }
                    </div>
                    {/* Academic year selector */}
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <label style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99" }}>ACADEMIC YEAR</label>
                      <select value={calAcademicYear} onChange={e => { setCalAcademicYear(e.target.value); loadedHolidayKeyRef.current = ""; }}
                        style={{ ...inp({ width:"auto" }), padding:"6px 10px", fontSize:"12px" }}>
                        <option value="all">All / By Month</option>
                        {academicYears.map((ay: any) => (
                          <option key={ay.id} value={ay.id}>{ay.label}{ay.is_current ? " (Current)" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Already-saved holidays — top section */}
                  {savedHols.length > 0 && (
                    <div style={{ marginBottom:"12px" }}>
                      <div style={{ fontSize:"11px", fontWeight:700, color:"#178F78", marginBottom:"6px", display:"flex", alignItems:"center", gap:"6px" }}>
                        <span>✓ Already in Calendar ({savedHols.length})</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                        {savedHols.map((h, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"5px 10px", borderRadius:"8px", background:"#F0FAF7", border:"1px solid #178F7820", opacity:0.75 }}>
                            <span style={{ color:"#178F78", fontSize:"14px" }}>✓</span>
                            <span style={{ fontSize:"15px" }}>{h.icon}</span>
                            <span style={{ flex:1, fontSize:"12px", fontWeight:600, color:"#1A2F4A" }}>{h.name}</span>
                            <span style={{ fontSize:"11px", color:"#6B7A99" }}>{new Date(h.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                            <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"20px", background: h.source==="state" ? "rgba(74,144,217,0.1)" : "rgba(23,143,120,0.1)", color: h.source==="state" ? "#4A90D9" : "#178F78" }}>
                              {h.source==="state" ? "STATE" : "NATIONAL"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New holidays — bottom section */}
                  {newHols.length > 0 && (
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:"#E8694A" }}>
                          + New Holidays to Add ({newHols.length})
                          {calAcademicYear !== "all" && <span style={{ color:"#178F78", marginLeft:"6px" }}>— All selected for academic year</span>}
                        </div>
                        <div style={{ display:"flex", gap:"8px" }}>
                          <button onClick={() => setNewHolSelected(new Set(newHols.map((h:any)=>h.date)))}
                            style={{ background:"none", border:"none", fontSize:"11px", color:"#4A90D9", cursor:"pointer", fontWeight:700 }}>Select All</button>
                          <button onClick={() => setNewHolSelected(new Set())}
                            style={{ background:"none", border:"none", fontSize:"11px", color:"#6B7A99", cursor:"pointer" }}>Clear</button>
                        </div>
                      </div>
                      <div style={{ maxHeight:"280px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"3px" }}>
                        {newHols.map((h, i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"5px 10px", borderRadius:"8px", background: newHolSelected.has(h.date) ? "#FFF8F0" : "#FAF0E8", border:`1px solid ${newHolSelected.has(h.date) ? "#F5B82930" : "#EDE8DF"}` }}>
                            <input type="checkbox" checked={newHolSelected.has(h.date)}
                              onChange={e => {
                                const s = new Set(newHolSelected);
                                e.target.checked ? s.add(h.date) : s.delete(h.date);
                                setNewHolSelected(s);
                              }} style={{ cursor:"pointer" }} />
                            <span style={{ fontSize:"15px" }}>{h.icon}</span>
                            <div style={{ flex:1 }}>
                              <input value={h.name} onChange={e => {
                                const updated = [...holidayPreview];
                                const idx = updated.findIndex(x => x.date===h.date && x.name===h.name);
                                if (idx >= 0) { updated[idx] = { ...updated[idx], name: e.target.value }; setHolidayPreview(updated); }
                              }} style={{ ...inp({ width:"100%" }), padding:"3px 8px", fontSize:"12px", fontWeight:600 }} />
                            </div>
                            <span style={{ fontSize:"11px", color:"#6B7A99", whiteSpace:"nowrap" }}>{new Date(h.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>
                            <span style={{ fontSize:"9px", fontWeight:700, padding:"2px 6px", borderRadius:"20px", background: h.source==="state" ? "rgba(74,144,217,0.1)" : "rgba(23,143,120,0.1)", color: h.source==="state" ? "#4A90D9" : "#178F78" }}>
                              {h.source==="state" ? "STATE" : "NATIONAL"}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginTop:"10px" }}>
                        <button onClick={savePublicHolidays} disabled={!canSave}
                          style={{ background: !canSave ? "#EDE8DF" : "#178F78", color: !canSave ? "#9CA3AF" : "white", border:"none", borderRadius:"10px", padding:"8px 20px", fontSize:"12px", fontWeight:700, cursor: !canSave ? "not-allowed" : "pointer" }}>
                          {savingHolidays ? "Saving…" : `Save ${newHolSelected.size} Selected to Calendar`}
                        </button>
                      </div>
                    </div>
                  )}

                  {!loadingHolidays && holidayPreview.length === 0 && !holidayMsg && (
                    <div style={{ fontSize:"12px", color:"#9CA3AF", textAlign:"center", padding:"12px 0" }}>Select an academic year or wait for holidays to load…</div>
                  )}
                  {holidayMsg && (
                    <div style={{ marginTop:"8px", fontSize:"12px", fontWeight:700, color: holidayMsg.startsWith("✓") ? "#178F78" : "#E8694A" }}>{holidayMsg}</div>
                  )}
                </div>
              );
            })()}

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
                      {programOptions.map(p => <option key={p.id} value={`program:${p.id}`}>{p.label} only</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"flex-end", paddingBottom:"2px" }}>
                    <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", fontSize:"12px", fontWeight:700, color:"#E8694A" }}>
                      <input type="checkbox" checked={editingEvent.is_holiday} onChange={e => setEditEvt((p:any) => ({ ...p, is_holiday: e.target.checked }))} />
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

        {/* ══ FEES TAB ══ */}
        {tab === "fees" && <FeesTab enquiries={enquiries} />}

        {/* ══ STAFF TAB ══ */}
        {tab === "staff" && <StaffTab />}

        {/* ══ SETTINGS TAB ══ */}
        {tab === "settings" && <SchoolSettingsTab />}

        {/* ══ PHOTOS TAB ══ */}
        {tab === "photos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>
            {/* ── Website display photos ── */}
            <SitePhotosManager />

            {/* ── Class photos (existing) ── */}
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
          </div>
        )}
      </div>

      {/* ══ ACADEMIC YEAR TAB ══ */}

      {/* ══ IMPORT TAB ══ */}
      {tab === "import" && <ExcelImport onImported={() => { loadEnquiries(); }} />}

      {/* ══ KIT MANAGER TAB ══ */}
      {tab === "kit" && <KitBulkManager enquiries={enquiries} />}

      {/* ══ ANNOUNCEMENTS TAB ══ */}
      {tab === "announcements" && (
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>

          {/* Header + new button */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"18px", fontWeight:700, color:"#1A2F4A" }}>📢 Announcements</div>
            <button onClick={() => { setShowAnnForm(!showAnnForm); setEditingAnn(null); setNewAnnForm({ title:"", body:"", target:"all", priority:"normal" }); }}
              style={{ background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"8px 16px", fontSize:"12px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:"6px" }}>
              <Plus style={{ width:"14px", height:"14px" }} /> New Announcement
            </button>
          </div>

          {/* Create / edit form */}
          {(showAnnForm || editingAnn) && (
            <div style={{ background:"white", borderRadius:"16px", border:"2px solid #178F78", padding:"18px", marginBottom:"14px" }}>
              <div style={{ fontWeight:700, fontSize:"14px", color:"#178F78", marginBottom:"14px" }}>
                {editingAnn ? "Edit Announcement" : "New Announcement"}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"10px" }}>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>TITLE *</label>
                  <input value={editingAnn ? editingAnn.title : newAnnForm.title}
                    onChange={e => editingAnn ? setEditingAnn((p:any)=>({...p, title:e.target.value})) : setNewAnnForm(p=>({...p, title:e.target.value}))}
                    style={inp()} placeholder="e.g. School closed on Monday" />
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>MESSAGE *</label>
                  <textarea value={editingAnn ? editingAnn.body : newAnnForm.body}
                    onChange={e => editingAnn ? setEditingAnn((p:any)=>({...p, body:e.target.value})) : setNewAnnForm(p=>({...p, body:e.target.value}))}
                    rows={3} style={{ ...inp(), resize:"vertical" as const }} placeholder="Full announcement message…" />
                </div>
                <div>
                  <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>AUDIENCE</label>
                  <select value={editingAnn ? editingAnn.target : newAnnForm.target}
                    onChange={e => editingAnn ? setEditingAnn((p:any)=>({...p, target:e.target.value})) : setNewAnnForm(p=>({...p, target:e.target.value}))}
                    style={inp()}>
                    <option value="all">All (Parents + Teachers)</option>
                    <option value="parents">Parents only</option>
                    <option value="teachers">Teachers only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"4px" }}>PRIORITY</label>
                  <select value={editingAnn ? editingAnn.priority : newAnnForm.priority}
                    onChange={e => editingAnn ? setEditingAnn((p:any)=>({...p, priority:e.target.value})) : setNewAnnForm(p=>({...p, priority:e.target.value}))}
                    style={inp()}>
                    <option value="normal">Normal</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px" }}>
                <button disabled={annSaving}
                  onClick={async () => {
                    const form = editingAnn || newAnnForm;
                    if (!form.title?.trim() || !form.body?.trim()) return;
                    setAnnSaving(true);
                    if (editingAnn) {
                      await fetch("/api/admin/announcements", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(editingAnn) });
                      setEditingAnn(null);
                    } else {
                      await fetch("/api/admin/announcements", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(newAnnForm) });
                      setShowAnnForm(false);
                      setNewAnnForm({ title:"", body:"", target:"all", priority:"normal" });
                    }
                    setAnnSaving(false);
                    loadAnnouncements();
                  }}
                  style={{ background:"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"8px 18px", fontSize:"12px", fontWeight:700, cursor:"pointer" }}>
                  {annSaving ? "Saving…" : editingAnn ? "Save Changes" : "Post Announcement"}
                </button>
                <button onClick={() => { setShowAnnForm(false); setEditingAnn(null); }}
                  style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* List */}
          {announcements.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#6B7A99", background:"white", borderRadius:"16px", border:"1px solid #EDE8DF" }}>
              <div style={{ fontSize:"32px", marginBottom:"8px" }}>📢</div>
              No announcements yet. Click "New Announcement" to post one.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {announcements.map((a:any) => (
                <div key={a.id} style={{ background:"white", borderRadius:"14px", border:`1px solid ${a.priority==="urgent" ? "rgba(220,38,38,0.3)" : "#EDE8DF"}`, padding:"14px 16px" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                        <div style={{ fontWeight:700, fontSize:"14px", color:"#1A2F4A" }}>{a.title}</div>
                        {a.priority === "urgent" && (
                          <span style={{ background:"rgba(220,38,38,0.1)", color:"#DC2626", borderRadius:"20px", padding:"1px 8px", fontSize:"9px", fontWeight:700 }}>🔴 URGENT</span>
                        )}
                        <span style={{ background:"rgba(23,143,120,0.1)", color:"#178F78", borderRadius:"20px", padding:"1px 8px", fontSize:"9px", fontWeight:700, textTransform:"capitalize" }}>
                          {a.target === "all" ? "👥 All" : a.target === "parents" ? "👨‍👩‍👧 Parents" : "👩‍🏫 Teachers"}
                        </span>
                      </div>
                      <div style={{ fontSize:"12px", color:"#6B7A99", lineHeight:"1.5", marginBottom:"6px" }}>{a.body}</div>
                      <div style={{ fontSize:"10px", color:"#9CA3AF" }}>
                        {new Date(a.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                      <button onClick={() => { setEditingAnn({...a}); setShowAnnForm(false); }}
                        style={{ background:"rgba(23,143,120,0.08)", border:"none", borderRadius:"8px", padding:"6px 10px", fontSize:"11px", fontWeight:700, color:"#178F78", cursor:"pointer" }}>
                        <Edit2 style={{ width:"12px", height:"12px" }} />
                      </button>
                      <button onClick={async () => {
                        if (!confirm("Delete this announcement?")) return;
                        await fetch("/api/admin/announcements", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id: a.id }) });
                        loadAnnouncements();
                      }} style={{ background:"rgba(220,38,38,0.08)", border:"none", borderRadius:"8px", padding:"6px 10px", fontSize:"11px", fontWeight:700, color:"#DC2626", cursor:"pointer" }}>
                        <Trash2 style={{ width:"12px", height:"12px" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ CHILD PROFILE MODAL ══ */}
      {editingChild && (
        <ChildEditModal
          enquiry={editingChild}
          onClose={() => setEditingChild(null)}
          onSaved={() => { setEditingChild(null); loadEnquiries(); }}
        />
      )}

      {/* ══ ROLLOVER MODAL ══ */}
      {rolloverModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
          <div style={{ background:"white", borderRadius:"24px", padding:"28px", width:"100%", maxWidth:"560px", maxHeight:"88vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#1A2F4A", marginBottom:"4px" }}>
              🎓 Roll Over Selected Children
            </div>
            <div style={{ fontSize:"13px", color:"#6B7A99", marginBottom:"20px" }}>
              {selectedIds.size} children selected. Choose the academic year to move them to.
              Their section assignments will be cleared so you can re-assign them in the new year.
            </div>

            {/* Selected children preview */}
            <div style={{ background:"#FAF0E8", borderRadius:"12px", padding:"12px", marginBottom:"16px", maxHeight:"180px", overflowY:"auto" }}>
              <div style={{ fontSize:"10px", fontWeight:700, color:"#6B7A99", marginBottom:"8px", letterSpacing:"0.5px" }}>CHILDREN TO BE ROLLED OVER</div>
              {enquiries.filter(e => selectedIds.has(e.id)).map(e => {
                const yr = academicYears.find(y => y.id === e.academic_year_id);
                return (
                  <div key={e.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"5px 0", borderBottom:"1px solid #EDE8DF" }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"rgba(23,143,120,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>🧒</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:"13px", color:"#1A2F4A" }}>{e.child_name}</div>
                      <div style={{ fontSize:"10px", color:"#6B7A99" }}>{e.program_label} · {e.status}
                        {yr && <span style={{ marginLeft:"6px", color:"#B08000" }}>from {yr.label}</span>}
                      </div>
                    </div>
                    <button onClick={() => toggleSelect(e.id)}
                      style={{ background:"rgba(220,38,38,0.08)", color:"#DC2626", border:"none", borderRadius:"6px", padding:"3px 8px", fontSize:"11px", cursor:"pointer" }}>✕</button>
                  </div>
                );
              })}
            </div>

            {/* Target year */}
            <div style={{ marginBottom:"16px" }}>
              <label style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"6px" }}>ROLL OVER TO ACADEMIC YEAR *</label>
              <select value={rolloverTargetYear} onChange={e => setRolloverTargetYear(e.target.value)}
                style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"10px 12px", fontSize:"13px", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"100%" }}>
                <option value="">— Select target year —</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.label}{y.is_current ? " ★ (Current)" : ""}</option>
                ))}
              </select>
            </div>

            {/* Warning */}
            <div style={{ background:"rgba(245,184,41,0.1)", border:"1px solid rgba(245,184,41,0.3)", borderRadius:"10px", padding:"10px 14px", fontSize:"12px", color:"#B08000", marginBottom:"20px" }}>
              ⚠️ Section assignments will be cleared. You'll need to re-assign children to sections in the new year.
            </div>

            {bulkActionMsg && (
              <div style={{ background: bulkActionMsg.startsWith("✅") ? "rgba(23,143,120,0.1)" : "rgba(220,38,38,0.1)", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontWeight:600, color: bulkActionMsg.startsWith("✅") ? "#178F78" : "#DC2626", marginBottom:"14px" }}>
                {bulkActionMsg}
              </div>
            )}

            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={doBulkRollover} disabled={bulkWorking || !rolloverTargetYear || selectedIds.size === 0}
                style={{ flex:1, background: !rolloverTargetYear ? "#ccc" : "#F5B829", color:"#1A2F4A", border:"none", borderRadius:"12px", padding:"12px", fontSize:"14px", fontWeight:700, cursor: !rolloverTargetYear ? "not-allowed" : "pointer", fontFamily:"'Quicksand',sans-serif" }}>
                {bulkWorking ? "Rolling over…" : `🎓 Confirm Rollover (${selectedIds.size} children)`}
              </button>
              <button onClick={() => { setRolloverModal(false); setBulkActionMsg(""); }}
                style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"12px", padding:"12px 16px", fontSize:"13px", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EXPENSES TAB ══ */}
      {tab === "expenses" && (
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#1A2F4A" }}>💸 Expenses</div>
              <input type="month" value={expMonth} onChange={e => setExpMonth(e.target.value)}
                style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"7px 12px", fontSize:"13px", outline:"none", background:"white", fontFamily:"'Quicksand',sans-serif" }} />
            </div>
            <button onClick={() => setShowExpForm(!showExpForm)}
              style={{ display:"flex", alignItems:"center", gap:"6px", background:"#178F78", color:"white", border:"none", borderRadius:"12px", padding:"10px 18px", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"'Quicksand',sans-serif" }}>
              <Plus style={{ width:"14px", height:"14px" }} /> Add Expense
            </button>
          </div>

          {showExpForm && (
            <div style={{ background:"white", border:"1px solid #EDE8DF", borderRadius:"16px", padding:"20px", marginBottom:"20px" }}>
              <div style={{ fontWeight:700, color:"#1A2F4A", marginBottom:"14px" }}>New Expense</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                {[
                  { label:"Category", field:"category", type:"select" },
                  { label:"Title *", field:"title", type:"text", placeholder:"e.g. Teacher salaries" },
                  { label:"Amount (₹) *", field:"amount", type:"number", placeholder:"0" },
                  { label:"Date *", field:"date", type:"date" },
                  { label:"Notes", field:"notes", type:"text", placeholder:"Optional", span:2 },
                ].map((f: any) => (
                  <div key={f.field} style={{ gridColumn: f.span ? `span ${f.span}` : undefined }}>
                    <label style={{ fontSize:"11px", fontWeight:700, color:"#6B7A99", display:"block", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}
                        style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", outline:"none", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"100%", boxSizing:"border-box" as const }}>
                        {["salaries","utilities","maintenance","supplies","repairs","events","other"].map(c =>
                          <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                        )}
                      </select>
                    ) : (
                      <input type={f.type} value={(expForm as any)[f.field]} placeholder={f.placeholder}
                        onChange={e => setExpForm(p => ({ ...p, [f.field]: e.target.value }))}
                        style={{ border:"1px solid #EDE8DF", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", outline:"none", background:"#FAF0E8", fontFamily:"'Quicksand',sans-serif", width:"100%", boxSizing:"border-box" as const }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:"10px" }}>
                <button disabled={expSaving || !expForm.title || !expForm.amount} onClick={async () => {
                  setExpSaving(true);
                  await fetch("/api/owner/expenses", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ ...expForm, amount:parseFloat(expForm.amount), added_by:session?.name || "admin" }) });
                  setExpForm({ category:"salaries", title:"", amount:"", date:new Date().toISOString().split("T")[0], notes:"" });
                  setShowExpForm(false); setExpSaving(false); loadExpenses();
                }} style={{ background: !expForm.title || !expForm.amount ? "#ccc" : "#178F78", color:"white", border:"none", borderRadius:"12px", padding:"10px 20px", fontWeight:700, fontSize:"13px", cursor: !expForm.title || !expForm.amount ? "not-allowed" : "pointer", fontFamily:"'Quicksand',sans-serif" }}>
                  {expSaving ? "Saving…" : "Save Expense"}
                </button>
                <button onClick={() => setShowExpForm(false)} style={{ background:"#EDE8DF", color:"#6B7A99", border:"none", borderRadius:"12px", padding:"10px 16px", fontSize:"13px", cursor:"pointer", fontFamily:"'Quicksand',sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
            <div style={{ background:"linear-gradient(135deg,#F5B82922,#F5B82911)", border:"1px solid #F5B82944", borderRadius:"14px", padding:"16px 22px" }}>
              <div style={{ fontSize:"11px", color:"#6B7A99", textTransform:"uppercase", letterSpacing:"0.06em" }}>Month Total</div>
              <div style={{ fontSize:"1.6rem", fontWeight:800, color:"#F5B829" }}>₹{expenses.reduce((s,e)=>s+Number(e.amount),0).toLocaleString("en-IN")}</div>
            </div>
            {Object.entries(expenses.reduce((acc:Record<string,number>,e)=>{ acc[e.category]=(acc[e.category]||0)+Number(e.amount); return acc; },{})).map(([cat,amt])=>(
              <div key={cat} style={{ background:"white", border:"1px solid #EDE8DF", borderRadius:"14px", padding:"14px 18px" }}>
                <div style={{ fontSize:"11px", color:"#6B7A99", textTransform:"capitalize" }}>{cat}</div>
                <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#1A2F4A" }}>₹{(amt as number).toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>

          {/* Expenses table */}
          <div style={{ background:"white", border:"1px solid #EDE8DF", borderRadius:"16px", overflow:"hidden" }}>
            {expenses.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px", color:"#6B7A99" }}>No expenses recorded for this month</div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
                <thead>
                  <tr style={{ background:"#FAF0E8", color:"#6B7A99", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    {["Date","Category","Title","Amount","Notes","Added By",""].map(h => (
                      <th key={h} style={{ textAlign: h==="Amount" ? "right" : "left", padding:"10px 14px", fontWeight:700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e:any) => (
                    <tr key={e.id} style={{ borderTop:"1px solid #EDE8DF" }}>
                      <td style={{ padding:"11px 14px", color:"#6B7A99" }}>{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                      <td style={{ padding:"11px 14px" }}>
                        <span style={{ background:"#FEF3E8", color:"#E8694A", borderRadius:"6px", padding:"2px 8px", fontSize:"11px", fontWeight:700, textTransform:"capitalize" }}>{e.category}</span>
                      </td>
                      <td style={{ padding:"11px 14px", fontWeight:600, color:"#1A2F4A" }}>{e.title}</td>
                      <td style={{ padding:"11px 14px", textAlign:"right", fontWeight:700, color:"#F5B829" }}>₹{Number(e.amount).toLocaleString("en-IN")}</td>
                      <td style={{ padding:"11px 14px", color:"#6B7A99" }}>{e.notes || "—"}</td>
                      <td style={{ padding:"11px 14px", color:"#6B7A99", fontSize:"12px" }}>{e.added_by || "—"}</td>
                      <td style={{ padding:"11px 14px", textAlign:"center" }}>
                        <button onClick={async () => {
                          if (!confirm("Delete this expense?")) return;
                          await fetch(`/api/owner/expenses?id=${e.id}`, { method:"DELETE" });
                          loadExpenses();
                        }} style={{ background:"none", border:"none", cursor:"pointer", color:"#E8694A", opacity:0.7 }}>
                          <Trash2 style={{ width:"14px", height:"14px" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ REPORTS TAB ══ */}
      {tab === "reports" && (
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>
          <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"20px", fontWeight:700, color:"#1A2F4A", marginBottom:"20px" }}>📊 Attendance Reports</div>
          <AttendanceReport theme="light" />
        </div>
      )}

      {/* ══ TRANSPORT TAB ══ */}
      {tab === "transport" && (
        <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"20px" }}>
          <TransportStaffView session={session} isAdmin={true} />
        </div>
      )}

      {/* ══ MEDICAL TAB ══ */}
      {tab === "medical" && (
        <AdminMedicalPanel />
      )}

      {/* ══ PICKUP TAB ══ */}
      {tab === "pickup" && (
        <AdminPickupPanel />
      )}

      {/* ══ PAYROLL TAB ══ */}
      {tab === "payroll" && <PayrollTab />}

      {/* ══ PTM TAB ══ */}
      {tab === "ptm" && <PTMScheduler />}

      {/* ══ BLOG TAB ══ */}
      {tab === "blog" && <BlogManager />}

      {/* ══ REFERRALS TAB ══ */}
      {tab === "referrals" && <ReferralTab />}

      {/* ══ FOLLOW-UPS TAB ══ */}
      {tab === "followups" && <LeadFollowUpTab />}

      {/* ══ BIRTHDAYS TAB ══ */}
      {tab === "birthdays" && <BirthdayPanel />}

      {/* ══ TESTIMONIALS TAB ══ */}
      {tab === "testimonials" && <TestimonialsManager />}

      {/* ══ INCIDENTS TAB ══ */}
      {tab === "incidents" && <IncidentLog />}

    </div>
  );
}
