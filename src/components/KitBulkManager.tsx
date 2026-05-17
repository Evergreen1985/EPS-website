"use client";
import { useState, useEffect, useCallback } from "react";

const PROGRAMMES = [
  { id:"infant",      label:"Infant Care"     },
  { id:"playgroup",   label:"Playgroup"        },
  { id:"nursery",     label:"Nursery"          },
  { id:"jrkg",        label:"Junior KG"        },
  { id:"srkg",        label:"Senior KG"        },
  { id:"daycare",     label:"Full-Day Daycare" },
  { id:"afterschool", label:"After-School"     },
];

// Map programme id → label for matching against enquiry program_label
const PROG_LABEL: Record<string,string> = {
  infant:"Infant Care", playgroup:"Playgroup", nursery:"Nursery",
  jrkg:"Junior KG", srkg:"Senior KG", daycare:"Full-Day Daycare", afterschool:"After-School",
};
// Map programme label → id (reverse)
const LABEL_TO_PROG: Record<string,string> = Object.fromEntries(
  Object.entries(PROG_LABEL).map(([id,lbl]) => [lbl.toLowerCase(), id])
);

const CAT_META: Record<string,{label:string;icon:string;color:string}> = {
  book:       { label:"Books",      icon:"📚", color:"#6366F1" },
  uniform:    { label:"Uniform",    icon:"👕", color:"#178F78" },
  bag:        { label:"School Bag", icon:"🎒", color:"#E8694A" },
  stationery: { label:"Stationery", icon:"✏️", color:"#F5B829" },
  other:      { label:"Other",      icon:"📦", color:"#6B7A99" },
};

const DEFAULT_BOOKS: Record<string,string[]> = {
  nursery:     ["English Reader","Maths Workbook","Hindi Primer","Drawing Book"],
  jrkg:        ["English Reader","Maths Workbook","Hindi Book","EVS Book","Drawing Book"],
  srkg:        ["English Reader","Maths Workbook","Hindi Book","EVS Book","GK Book","Drawing Book"],
  daycare:     ["Activity Book"],
  playgroup:   ["Activity Book"],
  afterschool: ["Activity Workbook","Drawing Book"],
  infant:      ["Activity Book"],
};

const DEFAULT_STATIONERY: Record<string,string[]> = {
  nursery:     ["Water Bottle","Crayon Box"],
  jrkg:        ["Water Bottle","Pencil Box"],
  srkg:        ["Water Bottle","Pencil Box"],
  daycare:     ["Water Bottle"],
  playgroup:   ["Water Bottle","Crayon Box"],
  afterschool: ["Water Bottle","Stationery Kit"],
  infant:      ["Water Bottle"],
};

const PRESETS = [
  { key:"all",         label:"All Items",     cats:["book","uniform","bag","stationery"] },
  { key:"books_only",  label:"Books Only",    cats:["book","stationery"] },
  { key:"uniform_bag", label:"Uniform + Bag", cats:["uniform","bag"] },
];

interface KitItem {
  id:string; item_name:string; item_category:string;
  quantity:number; size?:string; issued:boolean;
  issued_by?:string; issued_date?:string; parent_comment?:string;
}
interface KitStatus { total:number; issued:number; categories:Record<string,boolean>; }
interface Props { enquiries:any[]; }

const inp: React.CSSProperties = {
  border:"1px solid #EDE8DF", borderRadius:"8px", padding:"6px 10px",
  fontSize:"11px", outline:"none", background:"#FAF0E8",
  fontFamily:"'Quicksand',sans-serif", boxSizing:"border-box" as const, width:"100%",
};

// Collapsible category section for programme template editor
function CollapsibleCat({ cat, meta, catItems, onDelete }:{ cat:string; meta:any; catItems:any[]; onDelete:(id:string, isDef:boolean)=>void }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{marginBottom:"6px", border:"1px solid #EDE8DF", borderRadius:"8px", overflow:"hidden"}}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px",
          background:open?"rgba(23,143,120,0.04)":"white", border:"none", cursor:"pointer"}}>
        <span style={{fontSize:"11px", fontWeight:700, color:meta.color}}>{meta.icon} {meta.label} ({catItems.length})</span>
        <span style={{fontSize:"10px", color:"#9CA3AF", transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
      </button>
      {open && (
        <div style={{padding:"4px 8px 6px"}}>
          {catItems.map((item:any) => (
            <div key={item.id} style={{display:"flex", alignItems:"center", gap:"6px", padding:"4px 6px",
              background:item._default?"rgba(245,184,41,0.06)":"rgba(23,143,120,0.04)",
              borderRadius:"5px", marginBottom:"3px",
              border:`1px solid ${item._default?"rgba(245,184,41,0.2)":"rgba(23,143,120,0.12)"}`}}>
              <span style={{fontSize:"11px", flex:1, color:"#1A2F4A", fontWeight:600}}>{item.item_name}</span>
              {item.quantity>1 && <span style={{fontSize:"9px", color:"#6B7A99", flexShrink:0}}>×{item.quantity}</span>}
              {item._default && <span style={{fontSize:"8px", color:"#B08000", background:"rgba(245,184,41,0.15)", borderRadius:"4px", padding:"1px 4px", flexShrink:0}}>default</span>}
              <button onClick={()=>onDelete(item.id, !!item._default)}
                style={{background:"rgba(220,38,38,0.08)", color:"#DC2626", border:"none", borderRadius:"4px", padding:"2px 6px", fontSize:"10px", cursor:"pointer", flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ on, onToggle }: { on:boolean; onToggle:()=>void }) {
  return (
    <button
      onClick={onToggle}
      style={{ width:"34px", height:"18px", borderRadius:"20px", border:"none",
        cursor:"pointer", background:on?"#178F78":"#D1D5DB",
        position:"relative", flexShrink:0, transition:"background 0.2s" }}
    >
      <span style={{ position:"absolute", top:"2px", left:on?"16px":"2px",
        width:"14px", height:"14px", borderRadius:"50%", background:"white",
        transition:"left 0.2s", display:"block" }} />
    </button>
  );
}

export default function KitBulkManager({ enquiries }:Props) {

  // ── All state at top ───────────────────────────────────────────────────────
  const [filterProg, setFilterProg]       = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [search, setSearch]               = useState("");
  const [activeTab, setActiveTab]         = useState<"nokit"|"haskit">("nokit");
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [editChild, setEditChild]         = useState<any>(null);
  const [hasKitSelected, setHasKitSelected] = useState<Set<string>>(new Set());
  const [clearingKit, setClearingKit]       = useState(false);
  const [editItems, setEditItems]         = useState<KitItem[]>([]);
  const [editLoading, setEditLoading]     = useState(false);
  const [editSaving, setEditSaving]       = useState<string|null>(null);
  const [addItemName, setAddItemName]     = useState("");
  const [addItemCat, setAddItemCat]       = useState("book");
  const [addItemSize, setAddItemSize]     = useState("");
  const [addItemSaving, setAddItemSaving] = useState(false);
  const [preset, setPreset]               = useState("all");
  const [inclBooks, setInclBooks]         = useState(true);
  const [books, setBooks]                 = useState<string[]>([]);
  const [newBook, setNewBook]             = useState("");
  const [inclStationery, setInclStationery] = useState(true);
  const [stationery, setStationery]       = useState<string[]>([]);
  const [newStat, setNewStat]             = useState("");
  const [inclUniform, setInclUniform]     = useState(true);
  const [uniformPresets, setUniformPresets] = useState([
    {id:"u1", label:"Shirt only",  qty:1},
    {id:"u2", label:"Full Set ×1", qty:1},
    {id:"u3", label:"2 Full Sets", qty:2},
  ]);
  const [uniformSel, setUniformSel]       = useState("u3");
  const [uniformCustom, setUniformCustom] = useState("");
  const [newUniform, setNewUniform]       = useState("");
  const [inclBag, setInclBag]             = useState(true);
  const [bagPresets, setBagPresets]       = useState(["Standard","Small","Medium","Large"]);
  const [bagSel, setBagSel]               = useState("Standard");
  const [bagCustom, setBagCustom]         = useState("");
  const [newBag, setNewBag]               = useState("");
  const [others, setOthers]               = useState<string[]>([]);
  const [newOther, setNewOther]           = useState("");
  // Programme template editor (top-left panel)
  const [tmplProg, setTmplProg]             = useState("nursery");
  const [tmplItems, setTmplItems]           = useState<any[]>([]);
  const [tmplLoading, setTmplLoading]       = useState(false);
  const [tmplNewItem, setTmplNewItem]       = useState("");
  const [tmplNewCat, setTmplNewCat]         = useState("book");
  const [tmplNewQty, setTmplNewQty]         = useState("1");
  const [tmplSaving, setTmplSaving]         = useState(false);
  const [tmplRefreshKey, setTmplRefreshKey] = useState(0);
  const [tmplRollover, setTmplRollover]     = useState("all");
  const [tmplSection, setTmplSection]       = useState("all");
  const [allSections, setAllSections]       = useState<any[]>([]);
  const [currentYearStart, setCurrentYearStart] = useState<string>("");
  const [tmplNewBycat, setTmplNewBycat]     = useState<Record<string,string>>({});
  const [tmplSavingCat, setTmplSavingCat]   = useState<string|null>(null);

  const [working, setWorking]               = useState(false);
  const [issueNow, setIssueNow]           = useState(false);
  const [result, setResult]               = useState<any>(null);
  const [kitStatus, setKitStatus]         = useState<Record<string,KitStatus>>({});

  // ── Derived values ─────────────────────────────────────────────────────────
  const enrolled = enquiries.filter(e => e.status==="enrolled" || e.status==="visited");
  // Sections for the selected programme in Programme Default Items panel
  // Sections for selected programme — from API sections table (not just enrolled children)
  const tmplProgLabel = PROG_LABEL[tmplProg] || "";
  const progSections = allSections.length > 0
    ? allSections
        .filter((s:any) => (s.program_label||"").toLowerCase() === tmplProgLabel.toLowerCase())
        .map((s:any) => s.name)
        .filter(Boolean)
    : Array.from(new Set(
        enrolled.filter((e:any) => LABEL_TO_PROG[(e.program_label||"").toLowerCase()] === tmplProg)
          .map((e:any) => e.section_name).filter(Boolean)
      )) as string[];
  const sections = Array.from(new Set(enrolled.map((e:any) => e.section_name).filter(Boolean)));
  const filtered = enrolled.filter((e:any) => {
    const lbl = (e.program_label||"").toLowerCase();
    const mP  = tmplProg==="all" || LABEL_TO_PROG[lbl] === tmplProg;
    const mS  = tmplSection==="all" || e.section_name===tmplSection;
    const mQ  = !search || e.child_name?.toLowerCase().includes(search.toLowerCase());
    // Rollover vs new: compare created_at with current academic year start_date
    let mR = true;
    if (tmplRollover !== "all" && currentYearStart) {
      const createdAt  = new Date(e.created_at || 0).getTime();
      const yearStart  = new Date(currentYearStart).getTime();
      const isNew      = createdAt >= yearStart;
      if (tmplRollover === "new")      mR = isNew;
      if (tmplRollover === "rollover") mR = !isNew;
    }
    return mP && mS && mQ && mR;
  });
  const noKitChildren  = filtered.filter((e:any) => !kitStatus[e.id] || kitStatus[e.id].total===0);
  const hasKitChildren = filtered.filter((e:any) => kitStatus[e.id]?.total > 0);
  const selChildren    = noKitChildren.filter((e:any) => selectedIds.has(e.id));
  const selProgs       = Array.from(new Set(selChildren.map((e:any) => LABEL_TO_PROG[(e.program_label||"").toLowerCase()]).filter(Boolean)));
  const effectiveProg  = filterProg!=="all" ? filterProg : (selProgs.length===1 ? String(selProgs[0]) : "all");

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const prog = effectiveProg!=="all" ? effectiveProg : filterProg!=="all" ? filterProg : "";
    if (!prog) return;
    setBooks(DEFAULT_BOOKS[prog] || []);
    setStationery(DEFAULT_STATIONERY[prog] || []);
    setUniformSel("u3"); setUniformCustom("");
    setBagSel("Standard"); setBagCustom(""); setOthers([]);
  }, [effectiveProg, filterProg]);

  useEffect(() => {
    if (preset==="custom") return;
    const p = PRESETS.find(p => p.key===preset);
    if (!p) return;
    setInclBooks(p.cats.includes("book"));
    setInclUniform(p.cats.includes("uniform"));
    setInclBag(p.cats.includes("bag"));
    setInclStationery(p.cats.includes("stationery"));
  }, [preset]);

  // Fetch all sections and current academic year on mount
  useEffect(() => {
    fetch("/api/admin/sections")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllSections(data); })
      .catch(() => {});
    fetch("/api/academic-years")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const current = data.find((y:any) => y.is_current);
          if (current?.start_date) setCurrentYearStart(current.start_date);
        }
      })
      .catch(() => {});
  }, []);

  const loadKitStatus = useCallback(async () => {
    const ids = filtered.map((e:any) => e.id);
    if (!ids.length) return;
    try {
      const res  = await fetch("/api/kit/bulk", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"status", enquiry_ids:ids }),
      });
      const text = await res.text();
      if (text) setKitStatus(JSON.parse(text) || {});
    } catch(_) {}
  }, [filtered.map((e:any) => e.id).join(",")]);

  useEffect(() => { loadKitStatus(); }, [loadKitStatus]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleChild = (id:string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const clearKitForSelected = async () => {
    if (!hasKitSelected.size) return;
    if (!confirm(`Move ${hasKitSelected.size} child${hasKitSelected.size>1?"ren":""} back to "No Kit"? Their kit items will be deleted.`)) return;
    setClearingKit(true);
    for (const id of Array.from(hasKitSelected)) {
      // Delete all kit items for this child
      const items = await fetch(`/api/kit?enquiryId=${id}`).then(r=>r.json()).catch(()=>[]);
      if (Array.isArray(items)) {
        for (const item of items) {
          await fetch("/api/kit", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:item.id}) });
        }
      }
    }
    setHasKitSelected(new Set());
    setEditChild(null);
    await loadKitStatus();
    setClearingKit(false);
  };

  const loadEditItems = async (child:any) => {
    setEditChild(child); setEditLoading(true); setEditItems([]);
    try {
      const res  = await fetch(`/api/kit?enquiryId=${child.id}`);
      const data = await res.json();
      setEditItems(Array.isArray(data) ? data : []);
    } catch(_) {}
    setEditLoading(false);
  };

  const deleteEditItem = async (id:string) => {
    setEditSaving(id);
    await fetch("/api/kit", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
    setEditItems(prev => prev.filter(i => i.id!==id));
    await loadKitStatus();
    setEditSaving(null);
  };

  const toggleIssued = async (item:KitItem) => {
    setEditSaving(item.id);
    await fetch("/api/kit", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id:item.id, action:item.issued?"unissue":"issue",
        issued_by:"Admin", issued_date:new Date().toISOString().split("T")[0] }),
    });
    setEditItems(prev => prev.map(i => i.id===item.id ? {...i, issued:!i.issued} : i));
    setEditSaving(null);
  };

  const addToExistingKit = async () => {
    if (!addItemName.trim() || !editChild) return;
    setAddItemSaving(true);
    const res = await fetch("/api/kit", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"add", enquiry_id:editChild.id,
        child_name:editChild.child_name, programme_id:editChild.program_id,
        item_name:addItemName.trim(), item_category:addItemCat,
        quantity:1, size:addItemSize||undefined }),
    });
    const data = await res.json();
    if (data.success && data.data) setEditItems(prev => [...prev, data.data]);
    setAddItemName(""); setAddItemSize("");
    await loadKitStatus();
    setAddItemSaving(false);
  };

  const buildItems = () => {
    const items: {item_name:string;item_category:string;quantity:number;size?:string}[] = [];
    if (inclBooks)     books.forEach(n => items.push({item_name:n, item_category:"book", quantity:1}));
    if (inclStationery) stationery.forEach(n => items.push({item_name:n, item_category:"stationery", quantity:1}));
    if (inclBag) {
      const label = bagSel==="custom" ? bagCustom : bagSel;
      items.push({item_name:"School Bag", item_category:"bag", quantity:1, size:label||undefined});
    }
    if (inclUniform) {
      if (uniformSel==="custom") {
        if (uniformCustom) items.push({item_name:uniformCustom, item_category:"uniform", quantity:1});
      } else {
        const u = uniformPresets.find(p => p.id===uniformSel);
        if (u) items.push({item_name:`Uniform — ${u.label}`, item_category:"uniform", quantity:u.qty});
      }
    }
    others.forEach(n => items.push({item_name:n, item_category:"other", quantity:1}));
    return items;
  };

  const builtItems = buildItems();
  const canApply   = selectedIds.size>0 && builtItems.length>0 && effectiveProg!=="all";
  const progLabel  = PROGRAMMES.find(p => p.id===filterProg)?.label || "";

  const applyBulk = async () => {
    if (!canApply) return;
    setWorking(true); setResult(null);
    const children = selChildren.map((e:any) => ({enquiry_id:e.id, child_name:e.child_name, programme_id:e.program_id}));
    const res = await fetch("/api/kit/bulk", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action:"init_bulk", children, selected_items:builtItems, issued_by:"Admin", issue_immediately:issueNow }),
    });
    const text = await res.text();
    if (text) setResult(JSON.parse(text));
    setWorking(false); setSelectedIds(new Set());
    await loadKitStatus();
  };

  // ── Load programme template items ────────────────────────────────────────────
  const loadTmplItems = useCallback(async () => {
    if (!tmplProg) return;
    setTmplLoading(true);
    try {
      const res  = await fetch(`/api/kit?programmeId=${tmplProg}`);
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      // If DB returns empty, show hardcoded defaults as reference
      if (Array.isArray(data) && data.length > 0) {
        setTmplItems(data);
      } else {
        const defBooks = DEFAULT_BOOKS[tmplProg] || [];
        const defStat  = DEFAULT_STATIONERY[tmplProg] || [];
        setTmplItems([
          ...defBooks.map((n,i)   => ({id:`def_b${i}`,  item_name:n, item_category:"book",       quantity:1, _default:true})),
          {id:"def_u1", item_name:"Uniform (Set)", item_category:"uniform", quantity:2, _default:true},
          {id:"def_bg1",item_name:"School Bag",    item_category:"bag",     quantity:1, _default:true},
          ...defStat.map((n,i)    => ({id:`def_s${i}`,  item_name:n, item_category:"stationery", quantity:1, _default:true})),
        ]);
      }
    } catch(_) { setTmplItems([]); }
    setTmplLoading(false);
  }, [tmplProg, tmplRefreshKey]);

  useEffect(() => { loadTmplItems(); }, [loadTmplItems]);

  // When children are first selected (0→N), force refresh tmplItems
  useEffect(() => {
    if (selectedIds.size > 0) {
      setTmplRefreshKey(k => k+1);
    }
  }, [selectedIds.size > 0]);

  // Sync Configure Kit from tmplItems — this is the SINGLE source of truth
  // Runs whenever tmplItems changes (programme selected, item added, item removed)
  useEffect(() => {
    // Books — always set (even empty clears the list)
    const bookItems = tmplItems.filter((i:any) => i.item_category==="book").map((i:any) => i.item_name);
    setBooks(bookItems.length ? bookItems : DEFAULT_BOOKS[tmplProg] || []);

    // Stationery
    const statItems = tmplItems.filter((i:any) => i.item_category==="stationery").map((i:any) => i.item_name);
    setStationery(statItems.length ? statItems : DEFAULT_STATIONERY[tmplProg] || []);

    // Uniform — rebuild presets from template, fallback to defaults
    const uniItems = tmplItems.filter((i:any) => i.item_category==="uniform");
    if (uniItems.length > 0) {
      const freshPresets = uniItems.map((i:any) => ({
        id: `u_${i.id || i.item_name}`, label: i.item_name, qty: i.quantity || 1,
      }));
      setUniformPresets(freshPresets);
      setUniformSel(freshPresets[0].id);
    } else {
      // No uniform in template — reset to default options
      setUniformPresets([
        {id:"u1", label:"Shirt only",  qty:1},
        {id:"u2", label:"Full Set ×1", qty:1},
        {id:"u3", label:"2 Full Sets", qty:2},
      ]);
      setUniformSel("u3");
    }

    // Bag — rebuild from template, fallback to defaults
    const bagItems2 = tmplItems.filter((i:any) => i.item_category==="bag");
    if (bagItems2.length > 0) {
      const freshBag = bagItems2.map((i:any) => i.item_name);
      setBagPresets(freshBag);
      setBagSel(freshBag[0]);
    } else {
      setBagPresets(["Standard","Small","Medium","Large"]);
      setBagSel("Standard");
    }

    // Other items
    const otherItems = tmplItems.filter((i:any) => i.item_category==="other").map((i:any) => i.item_name);
    setOthers(otherItems);
  }, [tmplItems, tmplProg]);

  const addTmplItem = async () => {
    if (!tmplNewItem.trim()) return;
    setTmplSaving(true);
    try {
      const res  = await fetch("/api/kit", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"add_template", programme_id:tmplProg,
          item_name:tmplNewItem.trim(), item_category:tmplNewCat, quantity:Number(tmplNewQty)||1 }),
      });
      const data = await res.json();
      if (data.success) { setTmplNewItem(""); loadTmplItems(); }
    } catch(_) {}
    setTmplSaving(false);
  };

  const addTmplItemByCat = async (cat:string) => {
    const name = (tmplNewBycat[cat]||"").trim();
    if (!name) return;
    setTmplSavingCat(cat);
    const qty = Number(tmplNewBycat[cat+"_qty"]||"1") || 1;
    try {
      const res  = await fetch("/api/kit", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"add_template", programme_id:tmplProg,
          item_name:name, item_category:cat, quantity:qty }),
      });
      const data = await res.json();
      if (data.success) {
        setTmplNewBycat(p => ({...p, [cat]:"", [cat+"_qty"]:"1"}));
        loadTmplItems();
      }
    } catch(_) {}
    setTmplSavingCat(null);
  };

  const deleteTmplItem = async (id:string, isDefault:boolean) => {
    if (isDefault) {
      // Just remove from local view — default items not in DB yet
      setTmplItems(p => p.filter(i => i.id !== id));
      return;
    }
    await fetch("/api/kit", { method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({id, from:"template"}) });
    loadTmplItems();
  };

  // ── Stats for report ───────────────────────────────────────────────────────
  const totalChildren   = filtered.length;
  const kitSetUp        = filtered.filter((e:any) => kitStatus[e.id]?.total > 0).length;
  const fullyIssued     = filtered.filter((e:any) => { const s=kitStatus[e.id]; return s&&s.total>0&&s.issued===s.total; }).length;
  const noKitCount      = filtered.filter((e:any) => !kitStatus[e.id]||kitStatus[e.id].total===0).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── TOP ROW: Programme Template (left) + Summary (right) ── */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px", alignItems:"start"}}>

        {/* LEFT: Programme Default Template Editor — fixed height so item list scrolls inside */}
        <div style={{background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"14px", display:"flex", flexDirection:"column", height:"440px"}}>
          <div style={{marginBottom:"10px"}}>
            {/* Title + programme inline */}
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px"}}>
              <div style={{fontFamily:"'Fredoka',sans-serif", fontSize:"14px", fontWeight:700, color:"#1A2F4A"}}>⚙️ Programme Default Items</div>
              <select value={tmplProg} onChange={e=>{setTmplProg(e.target.value); setTmplRollover("all"); setTmplSection("all");}} style={{...inp, width:"auto", fontSize:"11px"}}>
                {PROGRAMMES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            {/* Rollover + Section on one row */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px"}}>
              <select value={tmplRollover} onChange={e=>setTmplRollover(e.target.value)} style={inp}>
                <option value="all">All Children</option>
                <option value="rollover">Rollover Children</option>
                <option value="new">New Enrolments</option>
              </select>
              <select value={tmplSection} onChange={e=>setTmplSection(e.target.value)} style={inp}>
                <option value="all">All Sections</option>
                {progSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {tmplLoading ? (
            <div style={{fontSize:"11px", color:"#6B7A99", textAlign:"center", padding:"20px"}}>Loading…</div>
          ) : (
            <div style={{flex:1, display:"flex", gap:"8px", overflow:"hidden"}}>

              {/* LEFT col: Books + Other */}
              <div style={{flex:1, display:"flex", flexDirection:"column", gap:"8px", overflowY:"auto"}}>
                {(["book","other"] as string[]).map(cat => {
                  const meta     = CAT_META[cat];
                  const catItems = tmplItems.filter((i:any) => i.item_category===cat);
                  const newVal   = tmplNewBycat[cat] || "";
                  return (
                    <div key={cat} style={{background:"rgba(23,143,120,0.03)", borderRadius:"8px", border:"1px solid rgba(23,143,120,0.12)", padding:"8px"}}>
                      <div style={{fontSize:"10px", fontWeight:700, color:meta.color, marginBottom:"5px"}}>{meta.icon} {meta.label}</div>
                      {catItems.map((item:any) => (
                        <div key={item.id} style={{display:"flex", alignItems:"center", gap:"4px", padding:"3px 6px", background:item._default?"rgba(245,184,41,0.08)":"white", borderRadius:"5px", border:`1px solid ${item._default?"rgba(245,184,41,0.2)":"#EDE8DF"}`, marginBottom:"3px"}}>
                          <span style={{fontSize:"10px", flex:1, color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.item_name}</span>
                          {item.quantity>1 && <span style={{fontSize:"9px", color:"#6B7A99", flexShrink:0}}>×{item.quantity}</span>}
                          <button onClick={()=>deleteTmplItem(item.id, !!item._default)}
                            style={{background:"none", color:"#DC2626", border:"none", padding:"0 2px", fontSize:"10px", cursor:"pointer"}}>✕</button>
                        </div>
                      ))}
                      <div style={{display:"flex", gap:"3px", marginTop:"4px"}}>
                        <input style={{...inp, flex:1, fontSize:"10px", padding:"4px 6px"}}
                          value={newVal} onChange={e=>setTmplNewBycat(p=>({...p,[cat]:e.target.value}))}
                          placeholder={`+ Add ${meta.label.toLowerCase()}…`}
                          onKeyDown={e=>{if(e.key==="Enter") addTmplItemByCat(cat);}} />
                        <button onClick={()=>addTmplItemByCat(cat)} disabled={!newVal.trim()||tmplSavingCat===cat}
                          style={{background:newVal.trim()?"#178F78":"#EDE8DF", color:newVal.trim()?"white":"#9CA3AF", border:"none", borderRadius:"6px", padding:"4px 8px", fontSize:"10px", fontWeight:700, cursor:newVal.trim()?"pointer":"default"}}>
                          {tmplSavingCat===cat?"…":"+"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RIGHT col: Uniform + Bag + Stationery */}
              <div style={{flex:1, display:"flex", flexDirection:"column", gap:"8px", overflowY:"auto"}}>
                {(["uniform","bag","stationery"] as string[]).map(cat => {
                  const meta     = CAT_META[cat];
                  const catItems = tmplItems.filter((i:any) => i.item_category===cat);
                  const newVal   = tmplNewBycat[cat] || "";
                  const newQty   = tmplNewBycat[cat+"_qty"] || "1";
                  return (
                    <div key={cat} style={{background:"rgba(23,143,120,0.03)", borderRadius:"8px", border:"1px solid rgba(23,143,120,0.12)", padding:"8px"}}>
                      <div style={{fontSize:"10px", fontWeight:700, color:meta.color, marginBottom:"5px"}}>{meta.icon} {meta.label}</div>
                      {catItems.map((item:any) => (
                        <div key={item.id} style={{display:"flex", alignItems:"center", gap:"4px", padding:"3px 6px", background:item._default?"rgba(245,184,41,0.08)":"white", borderRadius:"5px", border:`1px solid ${item._default?"rgba(245,184,41,0.2)":"#EDE8DF"}`, marginBottom:"3px"}}>
                          <span style={{fontSize:"10px", flex:1, color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{item.item_name}</span>
                          {item.quantity>1 && <span style={{fontSize:"9px", color:"#6B7A99", flexShrink:0}}>×{item.quantity}</span>}
                          <button onClick={()=>deleteTmplItem(item.id, !!item._default)}
                            style={{background:"none", color:"#DC2626", border:"none", padding:"0 2px", fontSize:"10px", cursor:"pointer"}}>✕</button>
                        </div>
                      ))}
                      {/* Add row — uniform/bag get qty selector */}
                      <div style={{display:"flex", gap:"3px", marginTop:"4px"}}>
                        <input style={{...inp, flex:1, fontSize:"10px", padding:"4px 6px"}}
                          value={newVal} onChange={e=>setTmplNewBycat(p=>({...p,[cat]:e.target.value}))}
                          placeholder={cat==="uniform"?"e.g. 2 Full Sets…":cat==="bag"?"e.g. Standard, Small…":`+ Add ${meta.label.toLowerCase()}…`}
                          onKeyDown={e=>{if(e.key==="Enter") addTmplItemByCat(cat);}} />
                        {(cat==="uniform"||cat==="bag") && (
                          <select value={newQty}
                            onChange={e=>setTmplNewBycat(p=>({...p,[cat+"_qty"]:e.target.value}))}
                            style={{...inp, width:"46px", padding:"4px 4px", fontSize:"10px"}}>
                            {[1,2,3,4].map(n=><option key={n} value={n}>×{n}</option>)}
                          </select>
                        )}
                        <button onClick={()=>addTmplItemByCat(cat)} disabled={!newVal.trim()||tmplSavingCat===cat}
                          style={{background:newVal.trim()?"#178F78":"#EDE8DF", color:newVal.trim()?"white":"#9CA3AF", border:"none", borderRadius:"6px", padding:"4px 8px", fontSize:"10px", fontWeight:700, cursor:newVal.trim()?"pointer":"default"}}>
                          {tmplSavingCat===cat?"…":"+"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* RIGHT: Kit Status Summary */}
        <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
          <div style={{fontFamily:"'Fredoka',sans-serif", fontSize:"14px", fontWeight:700, color:"#1A2F4A", marginBottom:"10px"}}>📊 Kit Status Summary</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"10px"}}>
            {[
              { label:"Total Children",  value:totalChildren,  color:"#1A2F4A", bg:"#FAF0E8",                icon:"👶" },
              { label:"Kit Set Up",      value:kitSetUp,       color:"#6366F1", bg:"rgba(99,102,241,0.08)", icon:"🎒" },
              { label:"Fully Issued",    value:fullyIssued,    color:"#178F78", bg:"rgba(23,143,120,0.08)", icon:"✅" },
              { label:"No Kit Yet",      value:noKitCount,     color:"#B08000", bg:"rgba(245,184,41,0.1)",  icon:"⏳" },
            ].map(s => (
              <div key={s.label} style={{background:s.bg, borderRadius:"10px", padding:"10px 12px", display:"flex", alignItems:"center", gap:"8px"}}>
                <span style={{fontSize:"18px"}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:"20px", fontWeight:700, color:s.color, lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:"9px", color:"#6B7A99", marginTop:"2px"}}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          {/* By Category + By Programme side by side */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px"}}>
            <div style={{background:"white", borderRadius:"10px", border:"1px solid #EDE8DF", padding:"10px"}}>
              <div style={{fontWeight:700, fontSize:"11px", color:"#1A2F4A", marginBottom:"7px"}}>📦 By Category</div>
              {Object.entries(CAT_META).map(([cat, meta]) => {
                const hasKitCount = filtered.filter((e:any) => kitStatus[e.id]?.total>0).length;
                const issuedCount = filtered.filter((e:any) => kitStatus[e.id]?.categories?.[cat]).length;
                const pct = hasKitCount>0 ? Math.round(issuedCount/hasKitCount*100) : 0;
                return (
                  <div key={cat} style={{marginBottom:"6px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:"2px"}}>
                      <span style={{fontSize:"10px", fontWeight:700, color:"#1A2F4A"}}>{meta.icon} {meta.label}</span>
                      <span style={{fontSize:"9px", color:"#6B7A99"}}>{issuedCount}/{hasKitCount}</span>
                    </div>
                    <div style={{background:"#FAF0E8", borderRadius:"20px", height:"4px", overflow:"hidden"}}>
                      <div style={{background:meta.color, height:"100%", width:`${pct}%`, borderRadius:"20px"}} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{background:"white", borderRadius:"10px", border:"1px solid #EDE8DF", padding:"10px"}}>
              <div style={{fontWeight:700, fontSize:"11px", color:"#1A2F4A", marginBottom:"7px"}}>🏫 By Programme</div>
              {PROGRAMMES.map(prog => {
                const pc  = enrolled.filter((e:any) => LABEL_TO_PROG[(e.program_label||"").toLowerCase()]===prog.id);
                if (!pc.length) return null;
                const ful = pc.filter((e:any) => { const s=kitStatus[e.id]; return s&&s.total>0&&s.issued===s.total; }).length;
                const pct = Math.round(ful/pc.length*100);
                return (
                  <div key={prog.id} style={{display:"flex", alignItems:"center", gap:"6px", padding:"4px 0", borderBottom:"1px solid #EDE8DF"}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:"10px", fontWeight:700, color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{prog.label}</div>
                      <div style={{fontSize:"9px", color:"#6B7A99"}}>{pc.length} children</div>
                    </div>
                    <span style={{fontSize:"10px", fontWeight:700, color:pct===100?"#178F78":"#B08000", flexShrink:0}}>{ful}/{pc.length}</span>
                    <div style={{width:"24px", height:"24px", borderRadius:"50%", background:`conic-gradient(#178F78 ${pct*3.6}deg, #EDE8DF 0)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                      <div style={{width:"16px", height:"16px", borderRadius:"50%", background:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"7px", fontWeight:700, color:"#178F78"}}>{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Kit Manager (left) + Configure Kit (right) ── */}
      <div style={{height:"1px", background:"#EDE8DF", marginBottom:"16px"}} />
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", alignItems:"start"}}>

        {/* LEFT: Children */}
        <div>
          <div style={{fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"#1A2F4A", marginBottom:"12px"}}>🎒 Kit Manager</div>

          <input value={search} onChange={e=>setSearch(e.target.value)} style={{...inp, marginBottom:"10px"}} placeholder="Search child name…" />

          {/* Tabs */}
          <div style={{display:"flex", gap:"6px", marginBottom:"8px"}}>
            <button onClick={()=>{setActiveTab("nokit");setEditChild(null);}}
              style={{flex:1, padding:"7px", borderRadius:"8px", border:"none", cursor:"pointer", fontWeight:700, fontSize:"11px",
                background:activeTab==="nokit"?"#1A2F4A":"#EDE8DF", color:activeTab==="nokit"?"white":"#6B7A99"}}>
              ⏳ No Kit ({noKitChildren.length})
            </button>
            <button onClick={()=>{setActiveTab("haskit");setSelectedIds(new Set());}}
              style={{flex:1, padding:"7px", borderRadius:"8px", border:"none", cursor:"pointer", fontWeight:700, fontSize:"11px",
                background:activeTab==="haskit"?"#178F78":"#EDE8DF", color:activeTab==="haskit"?"white":"#6B7A99"}}>
              ✅ Kit Set Up ({hasKitChildren.length})
            </button>
          </div>

          {/* No Kit list */}
          {activeTab==="nokit" && (
            <div>
              <div style={{display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", background:"#1A2F4A", borderRadius:"8px 8px 0 0"}}>
                <input type="checkbox"
                  checked={selectedIds.size===noKitChildren.length && noKitChildren.length>0}
                  onChange={()=>setSelectedIds(selectedIds.size===noKitChildren.length ? new Set() : new Set(noKitChildren.map((e:any)=>e.id)))}
                  style={{width:"14px", height:"14px", cursor:"pointer"}} />
                <span style={{fontSize:"10px", fontWeight:700, color:"white"}}>SELECT ALL {noKitChildren.length}</span>
                {selectedIds.size>0 && (
                  <span style={{marginLeft:"auto", background:"#178F78", color:"white", borderRadius:"20px", padding:"1px 8px", fontSize:"10px", fontWeight:700}}>
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
              <div style={{border:"1px solid #EDE8DF", borderTop:"none", borderRadius:"0 0 10px 10px", maxHeight:"300px", overflowY:"auto", marginBottom:"8px"}}>
                {noKitChildren.length===0 ? (
                  <div style={{padding:"16px", textAlign:"center", color:"#6B7A99", fontSize:"12px"}}>All children have kits ✅</div>
                ) : noKitChildren.map((e:any, idx:number) => {
                  const isSel = selectedIds.has(e.id);
                  return (
                    <div key={e.id} onClick={()=>toggleChild(e.id)}
                      style={{display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px",
                        background:isSel?"rgba(23,143,120,0.06)":idx%2===0?"white":"#FAFAFA",
                        borderBottom:"1px solid #EDE8DF", cursor:"pointer",
                        borderLeft:`3px solid ${isSel?"#178F78":"transparent"}`}}>
                      <input type="checkbox" checked={isSel} onChange={()=>toggleChild(e.id)} onClick={ev=>ev.stopPropagation()}
                        style={{width:"14px", height:"14px", accentColor:"#178F78", flexShrink:0}} />
                      <div style={{width:"26px", height:"26px", borderRadius:"50%", background:"rgba(23,143,120,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0}}>🧒</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontWeight:700, fontSize:"12px", color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{e.child_name}</div>
                        <div style={{fontSize:"10px", color:"#6B7A99"}}>{e.program_label}{e.section_name ? ` · ${e.section_name}` : ""}</div>
                      </div>
                      <span style={{fontSize:"9px", color:"#B08000", background:"rgba(245,184,41,0.12)", borderRadius:"20px", padding:"1px 6px", fontWeight:600}}>No kit</span>
                    </div>
                  );
                })}
              </div>
              {result && (
                <div style={{background:"rgba(23,143,120,0.08)", borderRadius:"10px", padding:"10px 12px"}}>
                  <div style={{fontWeight:700, fontSize:"12px", color:"#178F78", marginBottom:"4px"}}>
                    ✅ Done — {result.results?.filter((r:any)=>r.added>0).length} children updated
                  </div>
                  {result.results?.map((r:any) => (
                    <div key={r.enquiry_id} style={{fontSize:"10px", color:r.error?"#DC2626":"#6B7A99", display:"flex", justifyContent:"space-between"}}>
                      <span>{r.child_name}</span>
                      <span>{r.error ? "❌" : r.skipped ? "Already set" : `+${r.added} items`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Has Kit list */}
          {activeTab==="haskit" && (
            <div>
              {/* Bulk action bar */}
              {hasKitSelected.size>0 && (
                <div style={{display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", background:"#1A2F4A", borderRadius:"8px", marginBottom:"6px"}}>
                  <span style={{fontSize:"11px", fontWeight:700, color:"white"}}>{hasKitSelected.size} selected</span>
                  <button onClick={clearKitForSelected} disabled={clearingKit}
                    style={{background:"rgba(220,38,38,0.8)", color:"white", border:"none", borderRadius:"7px", padding:"5px 12px", fontSize:"11px", fontWeight:700, cursor:"pointer", marginLeft:"auto"}}>
                    {clearingKit ? "Clearing…" : "🗑 Move to No Kit"}
                  </button>
                  <button onClick={()=>setHasKitSelected(new Set())}
                    style={{background:"rgba(255,255,255,0.1)", color:"white", border:"none", borderRadius:"7px", padding:"5px 10px", fontSize:"11px", cursor:"pointer"}}>
                    ✕
                  </button>
                </div>
              )}
              {/* Select all row */}
              <div style={{display:"flex", alignItems:"center", gap:"8px", padding:"6px 10px", background:"#1A2F4A", borderRadius:hasKitSelected.size>0?"8px 8px 0 0":"8px 8px 0 0"}}>
                <input type="checkbox"
                  checked={hasKitSelected.size===hasKitChildren.length && hasKitChildren.length>0}
                  onChange={()=>setHasKitSelected(hasKitSelected.size===hasKitChildren.length ? new Set() : new Set(hasKitChildren.map((e:any)=>e.id)))}
                  style={{width:"14px", height:"14px", cursor:"pointer"}} />
                <span style={{fontSize:"10px", fontWeight:700, color:"white"}}>SELECT ALL {hasKitChildren.length}</span>
                {hasKitSelected.size>0 && <span style={{marginLeft:"auto", background:"#E8694A", color:"white", borderRadius:"20px", padding:"1px 8px", fontSize:"10px", fontWeight:700}}>{hasKitSelected.size} selected</span>}
              </div>
              <div style={{border:"1px solid #EDE8DF", borderTop:"none", borderRadius:"0 0 10px 10px", maxHeight:"280px", overflowY:"auto"}}>
                {hasKitChildren.length===0 ? (
                  <div style={{padding:"16px", textAlign:"center", color:"#6B7A99", fontSize:"12px"}}>No children with kit yet.</div>
                ) : hasKitChildren.map((e:any, idx:number) => {
                  const s = kitStatus[e.id];
                  const pct = s&&s.total>0 ? Math.round(s.issued/s.total*100) : 0;
                  const isActive  = editChild?.id===e.id;
                  const isSel     = hasKitSelected.has(e.id);
                  return (
                    <div key={e.id}
                      style={{display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px",
                        background:isSel?"rgba(232,105,74,0.06)":isActive?"rgba(23,143,120,0.08)":idx%2===0?"white":"#FAFAFA",
                        borderBottom:"1px solid #EDE8DF",
                        borderLeft:`3px solid ${isSel?"#E8694A":isActive?"#178F78":"transparent"}`}}>
                      <input type="checkbox" checked={isSel}
                        onChange={()=>setHasKitSelected(prev=>{const n=new Set(prev); n.has(e.id)?n.delete(e.id):n.add(e.id); return n;})}
                        onClick={ev=>ev.stopPropagation()}
                        style={{width:"14px", height:"14px", accentColor:"#E8694A", flexShrink:0, cursor:"pointer"}} />
                      <div style={{width:"26px", height:"26px", borderRadius:"50%", background:"rgba(23,143,120,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", flexShrink:0, cursor:"pointer"}}
                        onClick={()=>loadEditItems(e)}>🧒</div>
                      <div style={{flex:1, minWidth:0, cursor:"pointer"}} onClick={()=>loadEditItems(e)}>
                        <div style={{fontWeight:700, fontSize:"12px", color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{e.child_name}</div>
                        <div style={{fontSize:"10px", color:"#6B7A99"}}>{e.program_label}{e.section_name ? ` · ${e.section_name}` : ""}</div>
                      </div>
                      <div style={{textAlign:"right", flexShrink:0, cursor:"pointer"}} onClick={()=>loadEditItems(e)}>
                        <div style={{fontSize:"9px", color:pct===100?"#178F78":"#B08000", fontWeight:700}}>{s?.issued}/{s?.total}</div>
                        <div style={{width:"44px", height:"3px", background:"#EDE8DF", borderRadius:"20px", marginTop:"2px"}}>
                          <div style={{height:"100%", width:`${pct}%`, background:pct===100?"#178F78":"#F5B829", borderRadius:"20px"}} />
                        </div>
                      </div>
                      <span style={{fontSize:"10px", color:"#178F78", fontWeight:600, cursor:"pointer"}} onClick={()=>loadEditItems(e)}>✏️</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Config or Edit */}
        <div>
          {/* Configure Kit locked when no children selected in No Kit tab */}
        {activeTab==="nokit" && selectedIds.size===0 && (
          <div style={{background:"white", borderRadius:"14px", border:"1px solid #EDE8DF", padding:"40px 20px", textAlign:"center", color:"#9CA3AF"}}>
            <div style={{fontSize:"32px", marginBottom:"10px"}}>☑️</div>
            <div style={{fontWeight:700, fontSize:"14px", color:"#6B7A99", marginBottom:"6px"}}>Select children first</div>
            <div style={{fontSize:"12px"}}>Select one or more children from the Kit Manager to configure and apply their kit.</div>
          </div>
        )}
        {activeTab==="nokit" && selectedIds.size>0 && (
          <div style={{background:"rgba(23,143,120,0.06)", borderRadius:"10px", padding:"7px 12px", marginBottom:"10px", fontSize:"12px", color:"#178F78", fontWeight:600}}>
            ✅ {selectedIds.size} child{selectedIds.size>1?"ren":""} selected — configure and apply kit below
          </div>
        )}
        {activeTab==="haskit" && editChild ? (
            <div>
              <div style={{fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#178F78", marginBottom:"12px"}}>
                ✏️ {editChild.child_name}
                <span style={{fontSize:"11px", color:"#6B7A99", fontWeight:400, marginLeft:"8px"}}>{editChild.program_label}</span>
              </div>
              {editLoading ? (
                <div style={{padding:"20px", textAlign:"center", color:"#6B7A99", fontSize:"12px"}}>Loading…</div>
              ) : (
                <div>
                  {Object.entries(CAT_META).map(([cat, meta]) => {
                    const catItems = editItems.filter(i => i.item_category===cat);
                    if (!catItems.length) return null;
                    return (
                      <div key={cat} style={{marginBottom:"10px"}}>
                        <div style={{fontSize:"11px", fontWeight:700, color:meta.color, marginBottom:"5px"}}>{meta.icon} {meta.label}</div>
                        {catItems.map(item => (
                          <div key={item.id} style={{display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", background:"white", borderRadius:"8px", border:"1px solid #EDE8DF", marginBottom:"3px"}}>
                            <button onClick={()=>toggleIssued(item)} disabled={editSaving===item.id}
                              style={{width:"20px", height:"20px", borderRadius:"5px", border:`2px solid ${item.issued?"#178F78":"#EDE8DF"}`,
                                background:item.issued?"#178F78":"white", cursor:"pointer", flexShrink:0, fontSize:"10px", color:"white", fontWeight:700}}>
                              {editSaving===item.id ? "…" : item.issued ? "✓" : ""}
                            </button>
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{fontSize:"12px", fontWeight:700, color:"#1A2F4A"}}>{item.item_name}</div>
                              {item.size && <div style={{fontSize:"10px", color:"#6366F1"}}>Size: {item.size}</div>}
                              {item.issued && item.issued_by && <div style={{fontSize:"9px", color:"#178F78"}}>By {item.issued_by}</div>}
                              {item.parent_comment && <div style={{fontSize:"10px", color:"#DC2626"}}>💬 {item.parent_comment}</div>}
                            </div>
                            <button onClick={()=>deleteEditItem(item.id)} disabled={editSaving===item.id}
                              style={{background:"rgba(220,38,38,0.08)", color:"#DC2626", border:"none", borderRadius:"6px", padding:"4px 8px", fontSize:"11px", cursor:"pointer"}}>
                              🗑
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <div style={{background:"#FAF0E8", borderRadius:"10px", padding:"10px", marginTop:"8px"}}>
                    <div style={{fontSize:"11px", fontWeight:700, color:"#6B7A99", marginBottom:"6px"}}>+ ADD ITEM</div>
                    <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:"4px", marginBottom:"4px"}}>
                      <input style={inp} value={addItemName} onChange={e=>setAddItemName(e.target.value)} placeholder="Item name…" />
                      <select style={inp} value={addItemCat} onChange={e=>setAddItemCat(e.target.value)}>
                        {Object.entries(CAT_META).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex", gap:"4px"}}>
                      <input style={{...inp, flex:1}} value={addItemSize} onChange={e=>setAddItemSize(e.target.value)} placeholder="Size (optional)" />
                      <button onClick={addToExistingKit} disabled={addItemSaving||!addItemName.trim()}
                        style={{background:addItemName.trim()?"#178F78":"#ccc", color:"white", border:"none", borderRadius:"8px", padding:"6px 14px", fontSize:"12px", fontWeight:700, cursor:addItemName.trim()?"pointer":"not-allowed"}}>
                        {addItemSaving ? "…" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab==="haskit" && !editChild ? (
            <div style={{padding:"40px", textAlign:"center", color:"#6B7A99", background:"white", borderRadius:"14px", border:"1px solid #EDE8DF"}}>
              <div style={{fontSize:"32px", marginBottom:"8px"}}>✏️</div>
              <div style={{fontSize:"13px", fontWeight:600}}>Click a child to view and edit their kit</div>
            </div>
          ) : selectedIds.size===0 ? null : (
            <div>
              <div style={{fontFamily:"'Fredoka',sans-serif", fontSize:"15px", fontWeight:700, color:"#1A2F4A", marginBottom:"4px"}}>
                📦 Configure Kit
              </div>
              <div style={{fontSize:"11px", color:"#6B7A99", marginBottom:"10px"}}>
                {filterProg!=="all" ? `Defaults loaded for ${progLabel} — customise below` : "Filter by programme or select children to load defaults"}
              </div>

              {/* Presets */}
              <div style={{display:"flex", gap:"4px", marginBottom:"10px", flexWrap:"wrap"}}>
                {PRESETS.map(p => (
                  <button key={p.key} onClick={()=>setPreset(p.key)}
                    style={{padding:"4px 10px", borderRadius:"20px", border:`1.5px solid ${preset===p.key?"#178F78":"#EDE8DF"}`,
                      background:preset===p.key?"#178F78":"white", color:preset===p.key?"white":"#6B7A99", fontSize:"10px", fontWeight:700, cursor:"pointer"}}>
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Books */}
              <div style={{background:inclBooks?"rgba(99,102,241,0.04)":"#FAFAFA", border:`1.5px solid ${inclBooks?"#6366F1":"#EDE8DF"}`, borderRadius:"10px", padding:"10px", marginBottom:"8px"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:inclBooks?"8px":"0"}}>
                  <span style={{fontSize:"12px", fontWeight:700, color:inclBooks?"#1A2F4A":"#9CA3AF"}}>📚 Books</span>
                  <ToggleSwitch on={inclBooks} onToggle={()=>{setInclBooks(v=>!v);setPreset("custom");}} />
                </div>
                {inclBooks && (
                  <div>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px", marginBottom:"6px"}}>
                      {books.map(name => (
                        <div key={name} style={{display:"flex", alignItems:"center", gap:"4px", padding:"3px 6px", borderRadius:"5px", background:"rgba(99,102,241,0.06)"}}>
                          <span style={{fontSize:"11px", flex:1, color:"#1A2F4A", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{name}</span>
                          <button onClick={()=>setBooks(p=>p.filter(b=>b!==name))} style={{background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:"10px", padding:0, flexShrink:0}}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex", gap:"4px"}}>
                      <input style={{...inp, flex:1}} value={newBook} onChange={e=>setNewBook(e.target.value)} placeholder="+ Add book…"
                        onKeyDown={e=>{if(e.key==="Enter"&&newBook.trim()){setBooks(p=>[...p,newBook.trim()]);setNewBook("");}}} />
                      <button onClick={()=>{if(newBook.trim()){setBooks(p=>[...p,newBook.trim()]);setNewBook("");}}}
                        style={{background:"#6366F1", color:"white", border:"none", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer", fontWeight:700}}>Add</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Uniform */}
              <div style={{background:inclUniform?"rgba(23,143,120,0.04)":"#FAFAFA", border:`1.5px solid ${inclUniform?"#178F78":"#EDE8DF"}`, borderRadius:"10px", padding:"10px", marginBottom:"8px"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:inclUniform?"8px":"0"}}>
                  <span style={{fontSize:"12px", fontWeight:700, color:inclUniform?"#1A2F4A":"#9CA3AF"}}>👕 Uniform</span>
                  <ToggleSwitch on={inclUniform} onToggle={()=>{setInclUniform(v=>!v);setPreset("custom");}} />
                </div>
                {inclUniform && (
                  <div>
                    <div style={{display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"6px"}}>
                      {uniformPresets.map(u => (
                        <div key={u.id} style={{display:"flex", alignItems:"center"}}>
                          <button onClick={()=>{setUniformSel(u.id);}}
                            style={{padding:"4px 8px", borderRadius:"20px 0 0 20px", fontSize:"10px", fontWeight:700, cursor:"pointer",
                              border:`1.5px solid ${uniformSel===u.id?"#178F78":"#EDE8DF"}`, borderRight:"none",
                              background:uniformSel===u.id?"rgba(23,143,120,0.1)":"white",
                              color:uniformSel===u.id?"#178F78":"#6B7A99"}}>
                            {u.label}
                          </button>
                          <button onClick={()=>{setUniformPresets(p=>p.filter(x=>x.id!==u.id)); if(uniformSel===u.id) setUniformSel("custom");}}
                            style={{padding:"4px 5px", borderRadius:"0 20px 20px 0", fontSize:"9px", cursor:"pointer",
                              border:`1.5px solid ${uniformSel===u.id?"#178F78":"#EDE8DF"}`, borderLeft:"none",
                              background:uniformSel===u.id?"rgba(23,143,120,0.1)":"white", color:"#DC2626"}}>✕</button>
                        </div>
                      ))}
                      <button onClick={()=>setUniformSel("custom")}
                        style={{padding:"4px 8px", borderRadius:"20px", fontSize:"10px", fontWeight:700, cursor:"pointer",
                          border:`1.5px solid ${uniformSel==="custom"?"#178F78":"#EDE8DF"}`,
                          background:uniformSel==="custom"?"rgba(23,143,120,0.1)":"white", color:uniformSel==="custom"?"#178F78":"#6B7A99"}}>
                        Custom
                      </button>
                    </div>
                    {uniformSel==="custom" && (
                      <input style={{...inp, marginBottom:"6px"}} value={uniformCustom} onChange={e=>setUniformCustom(e.target.value)} placeholder="e.g. Shirt + Tie + Belt…" />
                    )}
                    <div style={{display:"flex", gap:"4px"}}>
                      <input style={{...inp, flex:1}} value={newUniform} onChange={e=>setNewUniform(e.target.value)} placeholder="+ Add option…"
                        onKeyDown={e=>{if(e.key==="Enter"&&newUniform.trim()){const id=`u${Date.now()}`;setUniformPresets(p=>[...p,{id,label:newUniform.trim(),qty:1}]);setUniformSel(id);setNewUniform("");}}} />
                      <button onClick={()=>{if(newUniform.trim()){const id=`u${Date.now()}`;setUniformPresets(p=>[...p,{id,label:newUniform.trim(),qty:1}]);setUniformSel(id);setNewUniform("");}}}
                        style={{background:"#178F78", color:"white", border:"none", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer", fontWeight:700}}>Add</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bag */}
              <div style={{background:inclBag?"rgba(232,105,74,0.04)":"#FAFAFA", border:`1.5px solid ${inclBag?"#E8694A":"#EDE8DF"}`, borderRadius:"10px", padding:"10px", marginBottom:"8px"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:inclBag?"8px":"0"}}>
                  <span style={{fontSize:"12px", fontWeight:700, color:inclBag?"#1A2F4A":"#9CA3AF"}}>🎒 School Bag</span>
                  <ToggleSwitch on={inclBag} onToggle={()=>{setInclBag(v=>!v);setPreset("custom");}} />
                </div>
                {inclBag && (
                  <div>
                    <div style={{display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"6px"}}>
                      {bagPresets.map(label => (
                        <div key={label} style={{display:"flex", alignItems:"center"}}>
                          <button onClick={()=>{setBagSel(label);}}
                            style={{padding:"4px 8px", borderRadius:"20px 0 0 20px", fontSize:"10px", fontWeight:700, cursor:"pointer",
                              border:`1.5px solid ${bagSel===label?"#E8694A":"#EDE8DF"}`, borderRight:"none",
                              background:bagSel===label?"rgba(232,105,74,0.08)":"white", color:bagSel===label?"#E8694A":"#6B7A99"}}>
                            {label}
                          </button>
                          <button onClick={()=>{setBagPresets(p=>p.filter(x=>x!==label)); if(bagSel===label) setBagSel("custom");}}
                            style={{padding:"4px 5px", borderRadius:"0 20px 20px 0", fontSize:"9px", cursor:"pointer",
                              border:`1.5px solid ${bagSel===label?"#E8694A":"#EDE8DF"}`, borderLeft:"none",
                              background:bagSel===label?"rgba(232,105,74,0.08)":"white", color:"#DC2626"}}>✕</button>
                        </div>
                      ))}
                      <button onClick={()=>setBagSel("custom")}
                        style={{padding:"4px 8px", borderRadius:"20px", fontSize:"10px", fontWeight:700, cursor:"pointer",
                          border:`1.5px solid ${bagSel==="custom"?"#E8694A":"#EDE8DF"}`,
                          background:bagSel==="custom"?"rgba(232,105,74,0.08)":"white", color:bagSel==="custom"?"#E8694A":"#6B7A99"}}>
                        Custom
                      </button>
                    </div>
                    {bagSel==="custom" && (
                      <input style={{...inp, marginBottom:"6px"}} value={bagCustom} onChange={e=>setBagCustom(e.target.value)} placeholder="e.g. Bag with child photo, Trolley bag…" />
                    )}
                    <div style={{display:"flex", gap:"4px"}}>
                      <input style={{...inp, flex:1}} value={newBag} onChange={e=>setNewBag(e.target.value)} placeholder="+ Add bag option…"
                        onKeyDown={e=>{if(e.key==="Enter"&&newBag.trim()){setBagPresets(p=>[...p,newBag.trim()]);setBagSel(newBag.trim());setNewBag("");}}} />
                      <button onClick={()=>{if(newBag.trim()){setBagPresets(p=>[...p,newBag.trim()]);setBagSel(newBag.trim());setNewBag("");}}}
                        style={{background:"#E8694A", color:"white", border:"none", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer", fontWeight:700}}>Add</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stationery */}
              <div style={{background:inclStationery?"rgba(245,184,41,0.06)":"#FAFAFA", border:`1.5px solid ${inclStationery?"#F5B829":"#EDE8DF"}`, borderRadius:"10px", padding:"10px", marginBottom:"8px"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:inclStationery?"8px":"0"}}>
                  <span style={{fontSize:"12px", fontWeight:700, color:inclStationery?"#1A2F4A":"#9CA3AF"}}>✏️ Stationery</span>
                  <ToggleSwitch on={inclStationery} onToggle={()=>{setInclStationery(v=>!v);setPreset("custom");}} />
                </div>
                {inclStationery && (
                  <div>
                    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px", marginBottom:"6px"}}>
                      {stationery.map(name => (
                        <div key={name} style={{display:"flex", alignItems:"center", gap:"4px", padding:"3px 6px", borderRadius:"5px", background:"rgba(245,184,41,0.08)"}}>
                          <span style={{fontSize:"11px", flex:1, color:"#1A2F4A"}}>{name}</span>
                          <button onClick={()=>setStationery(p=>p.filter(s=>s!==name))} style={{background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:"10px", padding:0}}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"flex", gap:"4px"}}>
                      <input style={{...inp, flex:1}} value={newStat} onChange={e=>setNewStat(e.target.value)} placeholder="+ Add item…"
                        onKeyDown={e=>{if(e.key==="Enter"&&newStat.trim()){setStationery(p=>[...p,newStat.trim()]);setNewStat("");}}} />
                      <button onClick={()=>{if(newStat.trim()){setStationery(p=>[...p,newStat.trim()]);setNewStat("");}}}
                        style={{background:"#F5B829", color:"#1A2F4A", border:"none", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer", fontWeight:700}}>Add</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Other */}
              {others.length>0 && (
                <div style={{background:"#FAF0E8", borderRadius:"10px", padding:"8px 10px", marginBottom:"8px"}}>
                  {others.map((name, i) => (
                    <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:"11px", padding:"2px 0"}}>
                      <span>📦 {name}</span>
                      <button onClick={()=>setOthers(p=>p.filter((_,j)=>j!==i))} style={{background:"none", border:"none", color:"#DC2626", cursor:"pointer", fontSize:"11px"}}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{display:"flex", gap:"4px", marginBottom:"10px"}}>
                <input style={{...inp, flex:1}} value={newOther} onChange={e=>setNewOther(e.target.value)} placeholder="+ Other item (ID card, diary…)" />
                <button onClick={()=>{if(newOther.trim()){setOthers(p=>[...p,newOther.trim()]);setNewOther("");}}}
                  style={{background:"#6B7A99", color:"white", border:"none", borderRadius:"6px", padding:"5px 10px", fontSize:"11px", cursor:"pointer"}}>Add</button>
              </div>

              {/* Issue toggle */}
              <label style={{display:"flex", alignItems:"center", gap:"6px", cursor:"pointer", marginBottom:"8px", padding:"7px 10px", background:"#FAF0E8", borderRadius:"8px"}}>
                <input type="checkbox" checked={issueNow} onChange={e=>setIssueNow(e.target.checked)} style={{accentColor:"#178F78"}} />
                <div>
                  <div style={{fontSize:"12px", fontWeight:700, color:"#1A2F4A"}}>Mark as issued immediately</div>
                  <div style={{fontSize:"10px", color:"#6B7A99"}}>Uncheck to add as pending</div>
                </div>
              </label>

              <div style={{background:"rgba(23,143,120,0.06)", borderRadius:"8px", padding:"7px 10px", marginBottom:"8px", fontSize:"11px", color:"#178F78", fontWeight:600}}>
                {builtItems.length} items · {selectedIds.size} child{selectedIds.size!==1?"ren":"} selected"}
                {effectiveProg==="all" && selectedIds.size>0 && selProgs.length>1 && <span style={{color:"#E8694A"}}> ⚠️ Mixed programmes</span>}
              </div>

              <button onClick={applyBulk} disabled={!canApply||working}
                style={{width:"100%", background:!canApply?"#ccc":"#178F78", color:"white", border:"none", borderRadius:"10px", padding:"11px", fontSize:"13px", fontWeight:700, cursor:!canApply?"not-allowed":"pointer"}}>
                {working ? "Applying…" : canApply ? `✓ Apply to ${selectedIds.size} Child${selectedIds.size>1?"ren":""}` : "Select children to apply"}
              </button>
              {!canApply && selectedIds.size>0 && effectiveProg==="all" && (
                <div style={{fontSize:"11px", color:"#E8694A", marginTop:"4px", textAlign:"center"}}>Filter by single programme first</div>
              )}
            </div>
          )}
        </div>

      </div>


    </div>
  );
}
