"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { X, ArrowLeft, Send, Sparkles, ImageIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Channel { id:string; slug:string; name:string; description:string; icon:string; access:string; message_count:number; }
interface Member   { id:string; display_name:string; avatar_emoji:string; user_type:string; }
interface Message  { id:string; member_id:string; display_name:string; avatar_emoji:string; content:string|null; msg_type:string; image_url:string|null; created_at:string; reactions:Record<string,number>; }
interface MyUser     { user_type:string; user_ref:string|null; default_name:string|null; enquiryId?:string; }
interface CommPhone  { phone:string; verifiedAt:number; }
interface SectionChans {
  childChannel:  Channel;
  parentChannel: Channel;
  sectionName:   string;
  ayLabel:       string;
  childName:     string;
}

const sbBrowser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const REACTIONS = ["❤️","😂","😮","👏","🎉","👍","🌟","🥰","🙌","🔥"];
const AVATARS: Record<string,string[]> = {
  children:  ["🦁","🐯","🦊","🐸","🦄","🐼","🐨","🐰","⭐","🎨","🚀","🌈"],
  parent:    ["👩","👨","🧑","🌸","🌺","🌻","💐","🍀"],
  teacher:   ["👩‍🏫","👨‍🏫","📚","🍎","✏️","🎓","🌟","💡"],
  owner:     ["👑","⭐","🏫","💎"],
  community: ["😊","🙋","🌍","👋","💪","🌈","✨","🎯"],
};
const CH_COLOR: Record<string,{accent:string;bg:string}> = {
  children:  { accent:"#F5B829", bg:"#FFF8E7" },
  parents:   { accent:"#3B82F6", bg:"#EFF6FF" },
  staff:     { accent:"#22C55E", bg:"#F0FDF4" },
  community: { accent:"#A855F7", bg:"#FDF4FF" },
};

const TEASERS = [
  { text:"Parents are chatting! 💬",    emoji:"👨‍👩‍👧" },
  { text:"Kids sharing Ghibli art! 🎨", emoji:"🦁"    },
  { text:"Join your community →",       emoji:"🌟"    },
  { text:"New message in Parent Circle",emoji:"💌"    },
  { text:"Children's Corner is live!",  emoji:"🐯"    },
  { text:"Create AI art together! ✨",  emoji:"🚀"    },
];

function fmtTime(iso:string){ return new Date(iso).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true}); }

// ── Main Component ────────────────────────────────────────────────────────────
export default function CommunityChatBubble() {
  const pathname  = usePathname();
  const [open,       setOpen]       = useState(false);
  const [view,       setView]       = useState<"channels"|"phone"|"otp"|"role-select"|"label"|"chat">("channels");
  const [channels,   setChannels]   = useState<Channel[]>([]);
  const [myUser,     setMyUser]     = useState<MyUser|null>(null);
  const [channel,    setChannel]    = useState<Channel|null>(null);
  const [member,     setMember]     = useState<Member|null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput,   setOtpInput]   = useState("");
  const [waLink,     setWaLink]     = useState("");
  const [otpPhone,   setOtpPhone]   = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError,   setOtpError]   = useState("");
  const [pendingChannel, setPendingChannel] = useState<Channel|null>(null);
  const [labelName,  setLabelName]  = useState("");
  const [labelEmoji, setLabelEmoji] = useState("😊");
  const [showAI,     setShowAI]     = useState(false);
  const [aiPrompt,   setAiPrompt]   = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [pickerFor,  setPickerFor]  = useState<string|null>(null);
  const [sectionChans, setSectionChans] = useState<SectionChans|null>(null);
  const [teaserIdx,  setTeaserIdx]  = useState(0);
  const [appeared,   setAppeared]   = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const communityId = useRef("");

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!appeared) return;
    const t = setInterval(() => setTeaserIdx(i => (i+1) % TEASERS.length), 3000);
    return () => clearInterval(t);
  }, [appeared]);

  useEffect(() => {
    let id = localStorage.getItem("ep_community_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("ep_community_id", id); }
    communityId.current = id;
  }, []);

  // Load verified phone from localStorage (valid for 30 days)
  function getVerifiedPhone(): string | null {
    try {
      const raw = localStorage.getItem("ep_community_phone");
      if (!raw) return null;
      const parsed: CommPhone = JSON.parse(raw);
      const age = Date.now() - parsed.verifiedAt;
      if (age > 30 * 24 * 60 * 60 * 1000) { localStorage.removeItem("ep_community_phone"); return null; }
      return parsed.phone;
    } catch { return null; }
  }

  function saveVerifiedPhone(phone: string) {
    localStorage.setItem("ep_community_phone", JSON.stringify({ phone, verifiedAt: Date.now() }));
  }

  useEffect(() => {
    if (!open) return;
    fetch("/api/community/me").then(r=>r.json()).then(user => {
      setMyUser(user);
      if (user.user_type === "parent") {
        fetch("/api/community/section-channels")
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d?.childChannel) setSectionChans(d as SectionChans); })
          .catch(() => {});
      }
    }).catch(() => setMyUser({ user_type:"community", user_ref:null, default_name:null }));
    fetch("/api/community/channels").then(r=>r.json()).then(d=>setChannels(d.channels||[]));
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (view !== "chat" || !channel) return;
    const sub = sbBrowser.channel(`widget:${channel.id}`)
      .on("postgres_changes",{ event:"INSERT", schema:"public", table:"community_messages", filter:`channel_id=eq.${channel.id}` },
        (p) => { const m = p.new as any; setMessages(prev => prev.find(x=>x.id===m.id) ? prev : [...prev,{...m,reactions:{}}]); })
      .subscribe();
    return () => { sbBrowser.removeChannel(sub); };
  }, [view, channel]);

  function getUserRef() {
    if (myUser?.user_ref) return myUser.user_ref;
    return getVerifiedPhone() || communityId.current;
  }

  function canAccess(ch:Channel) {
    const ut = myUser?.user_type || "community";
    if (ut==="owner") return true;
    if (ch.access==="all") return true;
    if (ch.access==="parents" && ut==="parent") return true;
    if (ch.access==="staff"   && ut==="teacher") return true;
    if (ch.access==="parents_staff" && (ut==="parent"||ut==="teacher")) return true;
    return false;
  }

  async function handleChannelClick(ch:Channel) {
    if (!canAccess(ch) || !myUser) return;

    // Community (not logged-in) users must verify phone first
    if (myUser.user_type === "community") {
      const verifiedPhone = getVerifiedPhone();
      if (!verifiedPhone) {
        setPendingChannel(ch);
        setPhoneInput(""); setOtpInput(""); setOtpError(""); setWaLink("");
        setView("phone");
        return;
      }
      // Already verified — use phone as ref
      await enterChannel(ch, "community", verifiedPhone);
      return;
    }

    await enterChannel(ch, myUser.user_type, getUserRef());
  }

  async function enterChannel(ch:Channel, ut:string, ur:string, defName?:string) {
    setChannel(ch);
    const r = await fetch(`/api/community/members?channel_id=${ch.id}&user_type=${ut}&user_ref=${encodeURIComponent(ur)}`);
    const d = await r.json();
    if (d.member) { setMember(d.member); await loadMessages(ch.id); setView("chat"); }
    else {
      const isChildCh = ch.slug==="children" || ch.slug.startsWith("sect_child_");
      const defEmoji  = isChildCh ? AVATARS.children[0] : (AVATARS[ut]?.[0]||"😊");
      setLabelName(defName ?? myUser?.default_name ?? localStorage.getItem("ep_community_name") ?? "");
      setLabelEmoji(defEmoji);
      setView("label");
    }
  }

  async function handleSendOTP() {
    setOtpError(""); setOtpSending(true);
    try {
      const r = await fetch("/api/community/send-otp", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone: phoneInput }),
      });
      const d = await r.json();
      if (!r.ok) { setOtpError(d.error || "Failed to send OTP."); return; }
      setOtpPhone(d.phone);
      setWaLink(d.waLink);
      setView("otp");
    } finally { setOtpSending(false); }
  }

  async function handleVerifyOTP() {
    setOtpError(""); setOtpSending(true);
    try {
      const r = await fetch("/api/community/verify-otp", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ phone: otpPhone, otp: otpInput }),
      });
      const d = await r.json();
      if (!r.ok) { setOtpError(d.error || "Invalid OTP."); return; }
      // Verified — save phone, continue to channel
      saveVerifiedPhone(otpPhone);
      if (pendingChannel) await enterChannel(pendingChannel, "community", otpPhone);
    } finally { setOtpSending(false); }
  }

  async function loadMessages(chId:string) {
    const r = await fetch(`/api/community/messages?channel_id=${chId}`);
    const d = await r.json();
    setMessages(d.messages||[]);
  }

  async function handleJoin() {
    if (!labelName.trim()||!channel||!myUser) return;
    const ut = myUser.user_type, ur = getUserRef();
    if (ut==="community") localStorage.setItem("ep_community_name", labelName.trim());
    const r = await fetch("/api/community/members",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({channel_id:channel.id,user_type:ut,user_ref:ur,display_name:labelName.trim(),avatar_emoji:labelEmoji})});
    const d = await r.json();
    if (d.member) { setMember(d.member); await loadMessages(channel.id); setView("chat"); }
  }

  async function sendMsg(content?:string, msgType?:string, imageUrl?:string) {
    if (!channel||!member) return;
    const text = content ?? input.trim();
    if (!text&&!imageUrl) return;
    setSending(true);
    try {
      await fetch("/api/community/messages",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({channel_id:channel.id,member_id:member.id,display_name:member.display_name,
          user_type:member.user_type,avatar_emoji:member.avatar_emoji,content:text||null,msg_type:msgType||"text",image_url:imageUrl||null})});
      setInput("");
    } finally { setSending(false); }
  }

  async function genAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/community/ai-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:aiPrompt})});
      const d = await r.json();
      if (d.url) { await sendMsg(aiPrompt,"ai_image",d.url); setShowAI(false); setAiPrompt(""); }
    } finally { setAiLoading(false); }
  }

  async function toggleReact(msgId:string, emoji:string) {
    if (!member) return;
    setPickerFor(null);
    setMessages(prev=>prev.map(m=>{
      if (m.id!==msgId) return m;
      const r={...m.reactions};
      if (r[emoji]){r[emoji]--;if(r[emoji]===0)delete r[emoji];}else r[emoji]=(r[emoji]||0)+1;
      return {...m,reactions:r};
    }));
    await fetch("/api/community/reactions",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message_id:msgId,member_id:member.id,emoji})});
  }

  function resetWidget() { setView("channels"); setChannel(null); setMember(null); setMessages([]); setShowAI(false); setInput(""); }

  // Hide on /community page — full page chat is already there
  if (pathname === "/community") return null;
  if (!appeared) return null;

  const teaser = TEASERS[teaserIdx];

  return (
    <>
      <style>{`
        @keyframes wbounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wslideUp { from{opacity:0;transform:translateY(16px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      <div className="fixed z-40" style={{bottom:"90px",right:"16px",display:"flex",flexDirection:"column",alignItems:"flex-end"}}>

        {/* ── Chat Widget ─────────────────────────────────────────────────── */}
        {open && (
          <div style={{width:"340px",maxWidth:"calc(100vw - 32px)",height:"500px",background:"white",borderRadius:"20px",
            boxShadow:"0 20px 60px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden",
            marginBottom:"12px",animation:"wslideUp 0.3s ease"}} onClick={()=>setPickerFor(null)}>

            {/* Header */}
            <div style={{background:"linear-gradient(135deg,#8957E5 0%,#E8694A 100%)",padding:"14px 16px",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                {view!=="channels" && (
                  <button onClick={()=>{
                    if(view==="otp")          setView("phone");
                    else if(view==="phone")   { setView("channels"); setPendingChannel(null); }
                    else if(view==="role-select") setView("channels");
                    else if(view==="label")   { channel?.slug?.startsWith("sect_") ? setView("role-select") : setView("channels"); }
                    else resetWidget();
                  }}
                    style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>
                    <ArrowLeft size={14}/>
                  </button>
                )}
                <div style={{flex:1,textAlign:view==="channels"?"center":"left"}}>
                  {view==="channels" && <div style={{fontSize:"22px",marginBottom:"2px"}}>💬</div>}
                  <div style={{color:"white",fontWeight:700,fontSize:"15px",fontFamily:"'Fredoka',sans-serif",lineHeight:1.2}}>
                    {view==="channels"    ? "Community Chat"                    :
                     view==="phone"       ? "Verify Your Phone"                :
                     view==="otp"         ? "Enter Your OTP"                   :
                     view==="role-select" ? `${sectionChans?.sectionName}`     :
                     view==="label"       ? `Join ${channel?.name}`            :
                     channel?.name}
                  </div>
                  <div style={{color:"rgba(255,255,255,0.75)",fontSize:"11px",fontFamily:"'Quicksand',sans-serif"}}>
                    {view==="channels"    ? "Live · 4 groups active"                              :
                     view==="phone"       ? "OTP will arrive via WhatsApp"                        :
                     view==="otp"         ? `Sent to +91 ••••••${otpPhone.slice(-4)}`             :
                     view==="role-select" ? `${sectionChans?.ayLabel} · Who are you chatting as?` :
                     view==="label"       ? "Choose your display name"                            :
                     `You: ${member?.avatar_emoji} ${member?.display_name}`}
                  </div>
                </div>
                {view==="chat" && (
                  <button onClick={()=>setShowAI(v=>!v)}
                    style={{background:showAI?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.18)",border:"none",borderRadius:"20px",padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"4px",color:"white",fontSize:"11px",fontWeight:700,flexShrink:0}}>
                    <Sparkles size={11}/> Art
                  </button>
                )}
                <button onClick={()=>{setOpen(false);resetWidget();}}
                  style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>
                  <X size={14}/>
                </button>
              </div>

              {/* Avatar strip — only on channels view */}
              {view==="channels" && (
                <div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"10px"}}>
                  {["🦁","👩","👨‍🏫","🐸","👶","🌸"].map((e,i)=>(
                    <div key={i} style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>
                      {e}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── CHANNELS VIEW ──────────────────────────────────────────── */}
            {view==="channels" && (
              <div style={{flex:1,overflowY:"auto",padding:"12px"}}>

                {/* Section card — parents only */}
                {myUser?.user_type==="parent" && sectionChans && (
                  <button onClick={()=>setView("role-select")}
                    style={{width:"100%",marginBottom:"10px",background:"linear-gradient(135deg,rgba(59,130,246,0.08),rgba(137,87,229,0.12))",
                      border:"2px solid rgba(137,87,229,0.3)",borderRadius:"16px",padding:"12px 14px",
                      textAlign:"left",cursor:"pointer",fontFamily:"'Quicksand',sans-serif",
                      display:"flex",alignItems:"center",gap:"12px",boxSizing:"border-box"}}>
                    <div style={{fontSize:"28px",flexShrink:0}}>📚</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"9px",fontWeight:700,color:"#8957E5",textTransform:"uppercase",letterSpacing:"0.07em"}}>
                        {sectionChans.ayLabel}
                      </div>
                      <div style={{fontSize:"13px",fontWeight:700,color:"#1A2F4A",marginTop:"1px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                        {sectionChans.sectionName}
                      </div>
                      <div style={{fontSize:"10px",color:"#888",marginTop:"2px"}}>
                        👶 Children · 👪 Parents — tap to join
                      </div>
                    </div>
                    <div style={{fontSize:"16px",color:"#8957E5",flexShrink:0}}>›</div>
                  </button>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {channels.map(ch=>{
                    const c = CH_COLOR[ch.slug]||CH_COLOR.community;
                    const ok = canAccess(ch);
                    return (
                      <button key={ch.id} onClick={()=>ok&&handleChannelClick(ch)}
                        style={{background:ok?c.bg:"#F5F5F5",border:`2px solid ${ok?c.accent+"40":"#E0E0E0"}`,borderRadius:"14px",
                          padding:"12px 10px",textAlign:"left",cursor:ok?"pointer":"not-allowed",opacity:ok?1:0.55,
                          transition:"all 0.18s",fontFamily:"'Quicksand',sans-serif"}}>
                        <div style={{fontSize:"22px",marginBottom:"4px"}}>{ch.icon}</div>
                        <div style={{fontSize:"12px",fontWeight:700,color:ok?c.accent:"#999",fontFamily:"'Fredoka',sans-serif",lineHeight:1.2}}>{ch.name}</div>
                        <div style={{fontSize:"10px",color:ok?"#888":"#BBB",marginTop:"2px"}}>
                          {ok ? `${ch.message_count} msgs` : "🔒 Login required"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* AI teaser */}
                <div style={{marginTop:"12px",borderRadius:"12px",padding:"10px 12px",background:"linear-gradient(135deg,rgba(137,87,229,0.08),rgba(232,105,74,0.08))",border:"1px dashed rgba(137,87,229,0.25)",textAlign:"center"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#8957E5",fontFamily:"'Quicksand',sans-serif"}}>
                    ✨ AI Ghibli Art · Emoji Reactions · Real-time Chat
                  </div>
                </div>

                {(!myUser||myUser.user_type==="community") && (
                  <div style={{marginTop:"8px",textAlign:"center",fontSize:"10px",color:"#AAA",fontFamily:"'Quicksand',sans-serif"}}>
                    <a href="/parent-login" style={{color:"#178F78",fontWeight:700}}>Parent login</a>
                    {" · "}
                    <a href="/teacher-login" style={{color:"#E8694A",fontWeight:700}}>Teacher login</a>
                    {" to unlock all groups"}
                  </div>
                )}
              </div>
            )}

            {/* ── PHONE VIEW ──────────────────────────────────────────────── */}
            {view==="phone" && (
              <div style={{flex:1,overflowY:"auto",padding:"20px 16px",fontFamily:"'Quicksand',sans-serif"}}>
                <div style={{textAlign:"center",marginBottom:"20px"}}>
                  <div style={{fontSize:"40px",marginBottom:"8px"}}>📱</div>
                  <div style={{fontSize:"15px",fontWeight:700,color:"#1A2F4A"}}>Join the Community</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"4px"}}>Verify your phone to join the chat</div>
                </div>

                <div style={{marginBottom:"12px"}}>
                  <label style={{fontSize:"11px",fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:"6px"}}>
                    Phone Number
                  </label>
                  <div style={{display:"flex",alignItems:"center",border:"2px solid rgba(137,87,229,0.35)",borderRadius:"12px",overflow:"hidden"}}>
                    <span style={{padding:"10px 12px",background:"rgba(137,87,229,0.06)",fontSize:"13px",fontWeight:700,color:"#555",borderRight:"1px solid rgba(137,87,229,0.2)",whiteSpace:"nowrap"}}>+91</span>
                    <input value={phoneInput}
                      onChange={e=>setPhoneInput(e.target.value.replace(/\D/g,"").slice(0,10))}
                      onKeyDown={e=>e.key==="Enter"&&phoneInput.length===10&&!otpSending&&handleSendOTP()}
                      placeholder="10-digit number"
                      autoFocus
                      inputMode="numeric"
                      maxLength={10}
                      style={{flex:1,border:"none",padding:"10px 12px",fontSize:"14px",fontWeight:600,fontFamily:"'Quicksand',sans-serif",outline:"none"}}/>
                  </div>
                </div>

                {otpError && (
                  <div style={{background:"rgba(232,105,74,0.1)",border:"1px solid rgba(232,105,74,0.3)",borderRadius:"10px",padding:"8px 12px",fontSize:"12px",color:"#E8694A",marginBottom:"10px"}}>
                    {otpError}
                  </div>
                )}

                <button onClick={handleSendOTP} disabled={otpSending||phoneInput.length!==10}
                  style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",
                    background:"linear-gradient(135deg,#8957E5,#E8694A)",color:"white",fontWeight:700,fontSize:"14px",
                    cursor:otpSending||phoneInput.length!==10?"not-allowed":"pointer",
                    opacity:otpSending||phoneInput.length!==10?0.45:1,fontFamily:"'Quicksand',sans-serif"}}>
                  {otpSending ? "Sending…" : "📲 Get OTP via WhatsApp"}
                </button>

                <div style={{marginTop:"12px",textAlign:"center",fontSize:"11px",color:"#AAA"}}>
                  OTP will appear in a pre-filled WhatsApp message — just copy it
                </div>
              </div>
            )}

            {/* ── OTP VIEW ────────────────────────────────────────────────── */}
            {view==="otp" && (
              <div style={{flex:1,overflowY:"auto",padding:"20px 16px",fontFamily:"'Quicksand',sans-serif"}}>
                <div style={{textAlign:"center",marginBottom:"20px"}}>
                  <div style={{fontSize:"40px",marginBottom:"8px"}}>💬</div>
                  <div style={{fontSize:"15px",fontWeight:700,color:"#1A2F4A"}}>Check WhatsApp</div>
                  <div style={{fontSize:"12px",color:"#888",marginTop:"4px"}}>
                    OTP sent to +91 ••••••{otpPhone.slice(-4)}
                  </div>
                </div>

                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer"
                    style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                      padding:"10px 16px",background:"#25D366",color:"white",borderRadius:"12px",
                      fontWeight:700,fontSize:"13px",textDecoration:"none",marginBottom:"14px",
                      boxShadow:"0 4px 12px rgba(37,211,102,0.35)"}}>
                    🔗 Open WhatsApp to see OTP
                  </a>
                )}

                <div style={{marginBottom:"12px"}}>
                  <label style={{fontSize:"11px",fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.05em",display:"block",marginBottom:"6px"}}>
                    Enter 6-digit OTP
                  </label>
                  <input value={otpInput}
                    onChange={e=>setOtpInput(e.target.value.replace(/\D/g,"").slice(0,6))}
                    onKeyDown={e=>e.key==="Enter"&&otpInput.length===6&&!otpSending&&handleVerifyOTP()}
                    placeholder="• • • • • •"
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    style={{width:"100%",border:"2px solid rgba(137,87,229,0.35)",borderRadius:"12px",
                      padding:"12px 14px",fontSize:"22px",fontWeight:700,fontFamily:"monospace",
                      outline:"none",boxSizing:"border-box",textAlign:"center",letterSpacing:"8px"}}/>
                </div>

                {otpError && (
                  <div style={{background:"rgba(232,105,74,0.1)",border:"1px solid rgba(232,105,74,0.3)",borderRadius:"10px",padding:"8px 12px",fontSize:"12px",color:"#E8694A",marginBottom:"10px"}}>
                    {otpError}
                  </div>
                )}

                <button onClick={handleVerifyOTP} disabled={otpSending||otpInput.length!==6}
                  style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",
                    background:"linear-gradient(135deg,#8957E5,#E8694A)",color:"white",fontWeight:700,fontSize:"14px",
                    cursor:otpSending||otpInput.length!==6?"not-allowed":"pointer",
                    opacity:otpSending||otpInput.length!==6?0.45:1,fontFamily:"'Quicksand',sans-serif"}}>
                  {otpSending ? "Verifying…" : "Verify & Continue →"}
                </button>

                <div style={{marginTop:"12px",textAlign:"center",fontSize:"11px",color:"#AAA"}}>
                  <button onClick={handleSendOTP} disabled={otpSending}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#8957E5",fontWeight:700,fontSize:"11px",
                      fontFamily:"'Quicksand',sans-serif",padding:0,opacity:otpSending?0.45:1}}>
                    Resend OTP
                  </button>
                  {" · "}Valid for 10 minutes
                </div>
              </div>
            )}

            {/* ── ROLE SELECT (parent choosing child vs parent channel) ───── */}
            {view==="role-select" && sectionChans && (
              <div style={{flex:1,overflowY:"auto",padding:"16px",fontFamily:"'Quicksand',sans-serif"}}>
                <div style={{textAlign:"center",marginBottom:"18px"}}>
                  <div style={{fontSize:"11px",fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                    Who are you joining as?
                  </div>
                </div>

                {/* As Child */}
                <button
                  onClick={()=>enterChannel(sectionChans.childChannel,"parent",getUserRef(),sectionChans.childName)}
                  style={{width:"100%",padding:"16px",marginBottom:"10px",background:"#FFF8E7",
                    border:"2px solid #F5B829",borderRadius:"16px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:"14px",textAlign:"left",
                    fontFamily:"'Quicksand',sans-serif",boxSizing:"border-box",transition:"transform 0.15s"}}>
                  <div style={{fontSize:"36px",flexShrink:0}}>👶</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,color:"#B8860B"}}>
                      As {sectionChans.childName}
                    </div>
                    <div style={{fontSize:"11px",color:"#888",marginTop:"3px"}}>
                      Join the children's group · chat with child's name
                    </div>
                  </div>
                </button>

                {/* As Parent */}
                <button
                  onClick={()=>enterChannel(sectionChans.parentChannel,"parent",getUserRef(),`Parent of ${sectionChans.childName}`)}
                  style={{width:"100%",padding:"16px",background:"#EFF6FF",
                    border:"2px solid #3B82F6",borderRadius:"16px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:"14px",textAlign:"left",
                    fontFamily:"'Quicksand',sans-serif",boxSizing:"border-box",transition:"transform 0.15s"}}>
                  <div style={{fontSize:"36px",flexShrink:0}}>👪</div>
                  <div>
                    <div style={{fontSize:"15px",fontWeight:700,color:"#1D4ED8"}}>
                      As Parent
                    </div>
                    <div style={{fontSize:"11px",color:"#888",marginTop:"3px"}}>
                      Join the parents' group · use your own name
                    </div>
                  </div>
                </button>

                <div style={{marginTop:"16px",textAlign:"center",fontSize:"10px",color:"#CCC"}}>
                  You can join both groups with different display names
                </div>
              </div>
            )}

            {/* ── LABEL SETUP ─────────────────────────────────────────────── */}
            {view==="label" && channel && (
              <div style={{flex:1,overflowY:"auto",padding:"16px",fontFamily:"'Quicksand',sans-serif"}}>
                <p style={{fontSize:"11px",fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"8px"}}>Pick your emoji</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"14px"}}>
                  {(AVATARS[channel.slug==="children"?"children":(myUser?.user_type||"community")]||AVATARS.community).map(e=>(
                    <button key={e} onClick={()=>setLabelEmoji(e)}
                      style={{fontSize:"20px",padding:"4px",borderRadius:"10px",border:`2px solid ${labelEmoji===e?"#8957E5":"transparent"}`,
                        background:labelEmoji===e?"rgba(137,87,229,0.1)":"transparent",cursor:"pointer"}}>
                      {e}
                    </button>
                  ))}
                </div>
                <p style={{fontSize:"11px",fontWeight:700,color:"#999",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"6px"}}>
                  {channel.slug==="children"?"Child's name":"Your display name"}
                </p>
                <input value={labelName} onChange={e=>setLabelName(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleJoin()}
                  placeholder={channel.slug==="children"?"e.g. Arjun":"e.g. Priya Sharma"}
                  autoFocus
                  style={{width:"100%",border:"2px solid rgba(137,87,229,0.35)",borderRadius:"12px",padding:"10px 14px",
                    fontSize:"13px",fontWeight:600,fontFamily:"'Quicksand',sans-serif",outline:"none",boxSizing:"border-box"}}/>
                <button onClick={handleJoin} disabled={!labelName.trim()}
                  style={{width:"100%",marginTop:"12px",padding:"12px",borderRadius:"12px",border:"none",
                    background:"linear-gradient(135deg,#8957E5,#E8694A)",color:"white",fontWeight:700,fontSize:"14px",
                    cursor:labelName.trim()?"pointer":"not-allowed",opacity:labelName.trim()?1:0.45,
                    fontFamily:"'Quicksand',sans-serif"}}>
                  {labelEmoji} Enter Chat
                </button>
              </div>
            )}

            {/* ── CHAT VIEW ───────────────────────────────────────────────── */}
            {view==="chat" && (
              <>
                {/* Messages */}
                <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"10px 12px",background:"#FAF8F5",display:"flex",flexDirection:"column",gap:"4px"}}>
                  {messages.length===0 && (
                    <div style={{textAlign:"center",paddingTop:"40px",color:"#CCC",fontFamily:"'Quicksand',sans-serif"}}>
                      <div style={{fontSize:"36px",marginBottom:"8px"}}>{channel?.icon}</div>
                      <div style={{fontSize:"13px",fontWeight:600}}>No messages yet — say hello! 👋</div>
                    </div>
                  )}
                  {messages.map((msg,i)=>{
                    const mine = member&&msg.member_id===member.id;
                    const prev = messages[i-1];
                    const showHead = !prev||prev.member_id!==msg.member_id;
                    const cc = CH_COLOR[channel?.slug||"community"];
                    return (
                      <div key={msg.id} style={{display:"flex",flexDirection:mine?"row-reverse":"row",alignItems:"flex-end",gap:"6px"}}>
                        <div style={{width:"24px",flexShrink:0,display:"flex",justifyContent:"center"}}>
                          {showHead&&!mine&&(
                            <div style={{width:"24px",height:"24px",borderRadius:"50%",background:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",boxShadow:"0 1px 4px rgba(0,0,0,0.1)",marginBottom:"16px"}}>
                              {msg.avatar_emoji}
                            </div>
                          )}
                        </div>
                        <div style={{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
                          {showHead&&!mine&&(
                            <div style={{fontSize:"10px",fontWeight:700,color:cc?.accent||"#8957E5",marginBottom:"2px",paddingLeft:"2px",fontFamily:"'Quicksand',sans-serif"}}>
                              {msg.display_name}
                            </div>
                          )}
                          <div onClick={e=>{e.stopPropagation();setPickerFor(pickerFor===msg.id?null:msg.id);}}
                            style={{background:mine?"#178F78":"white",color:mine?"white":"#1A2F4A",
                              padding:"7px 11px",borderRadius:mine?"14px 14px 3px 14px":"14px 14px 14px 3px",
                              boxShadow:"0 1px 5px rgba(0,0,0,0.09)",cursor:"pointer",fontSize:"12px",lineHeight:1.45}}>
                            {msg.msg_type==="ai_image"&&(
                              <div style={{fontSize:"9px",opacity:0.7,marginBottom:"4px",display:"flex",alignItems:"center",gap:"3px"}}>
                                <Sparkles size={9}/> Ghibli Art
                              </div>
                            )}
                            {msg.image_url&&(
                              <img src={msg.image_url} alt={msg.content||"image"}
                                style={{borderRadius:"8px",maxWidth:"100%",maxHeight:"140px",objectFit:"cover",display:"block",marginBottom:"4px"}}/>
                            )}
                            {msg.content&&<span style={{wordBreak:"break-word"}}>{msg.content}</span>}
                            <div style={{fontSize:"9px",opacity:0.5,marginTop:"2px"}}>{fmtTime(msg.created_at)}</div>
                          </div>
                          {/* Reactions */}
                          {Object.keys(msg.reactions).length>0&&(
                            <div style={{display:"flex",gap:"3px",marginTop:"3px",flexWrap:"wrap",justifyContent:mine?"flex-end":"flex-start"}}>
                              {Object.entries(msg.reactions).map(([e,n])=>(
                                <button key={e} onClick={()=>toggleReact(msg.id,e)}
                                  style={{background:"white",border:"1px solid #EEE",borderRadius:"10px",padding:"1px 5px",fontSize:"11px",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
                                  {e} {n}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Emoji picker */}
                          {pickerFor===msg.id&&(
                            <div onClick={e=>e.stopPropagation()}
                              style={{display:"flex",flexWrap:"wrap",gap:"3px",padding:"6px 8px",background:"white",
                                border:"1px solid #EDE8DF",borderRadius:"14px",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",marginTop:"4px",zIndex:10}}>
                              {REACTIONS.map(e=>(
                                <button key={e} onClick={()=>toggleReact(msg.id,e)}
                                  style={{fontSize:"16px",background:"none",border:"none",cursor:"pointer",padding:"2px"}}>
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AI panel */}
                {showAI&&(
                  <div style={{borderTop:"1px solid #EDE8DF",padding:"8px 12px",background:"white",flexShrink:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                      <Sparkles size={12} color="#8957E5"/>
                      <span style={{fontSize:"11px",fontWeight:700,color:"#8957E5",fontFamily:"'Quicksand',sans-serif"}}>Ghibli AI Image</span>
                      <button onClick={()=>setShowAI(false)} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#CCC"}}><X size={12}/></button>
                    </div>
                    <div style={{display:"flex",gap:"6px"}}>
                      <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)}
                        onKeyDown={e=>e.key==="Enter"&&genAI()}
                        placeholder="e.g. a rabbit in the rain…"
                        style={{flex:1,border:"1.5px solid rgba(137,87,229,0.3)",borderRadius:"10px",padding:"6px 10px",fontSize:"11px",fontFamily:"'Quicksand',sans-serif",outline:"none"}}/>
                      <button onClick={genAI} disabled={aiLoading||!aiPrompt.trim()}
                        style={{background:"linear-gradient(135deg,#8957E5,#E8694A)",color:"white",border:"none",borderRadius:"10px",
                          padding:"6px 10px",fontSize:"11px",fontWeight:700,cursor:"pointer",opacity:aiLoading||!aiPrompt.trim()?0.45:1}}>
                        {aiLoading?"✨":"Go"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Input bar */}
                <div style={{borderTop:"1px solid #EDE8DF",padding:"8px 10px",background:"white",flexShrink:0,display:"flex",alignItems:"center",gap:"6px"}}>
                  <button onClick={()=>setShowAI(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",flexShrink:0}}>
                    <ImageIcon size={16} color={showAI?"#8957E5":"#CCC"}/>
                  </button>
                  <input value={input} onChange={e=>setInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                    placeholder="Type a message…"
                    style={{flex:1,border:"1.5px solid rgba(23,143,120,0.35)",borderRadius:"20px",padding:"7px 12px",
                      fontSize:"12px",fontFamily:"'Quicksand',sans-serif",outline:"none"}}/>
                  <button onClick={()=>sendMsg()} disabled={sending||!input.trim()}
                    style={{background:"#178F78",border:"none",borderRadius:"50%",width:"30px",height:"30px",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",opacity:sending||!input.trim()?0.4:1,flexShrink:0}}>
                    <Send size={13} color="white"/>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Floating Trigger Button ──────────────────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
          {/* Rotating teaser tag */}
          {!open && (
            <div key={teaserIdx} style={{background:"linear-gradient(135deg,#8957E5,#E8694A)",color:"white",
              borderRadius:"20px",padding:"6px 12px",fontSize:"11px",fontWeight:700,whiteSpace:"nowrap",
              boxShadow:"0 4px 14px rgba(137,87,229,0.4)",fontFamily:"'Quicksand',sans-serif",
              animation:"fadeUp 0.5s ease",cursor:"pointer"}} onClick={()=>setOpen(true)}>
              {teaser.emoji} {teaser.text}
            </div>
          )}

          {/* Main bubble */}
          <div onClick={()=>setOpen(v=>!v)}
            style={{position:"relative",cursor:"pointer",filter:"drop-shadow(0 8px 24px rgba(137,87,229,0.4))"}}>
            <span style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(137,87,229,0.35)",
              animation:"ping 1.8s cubic-bezier(0,0,0.2,1) infinite"}}/>
            <span style={{position:"absolute",inset:0,borderRadius:"50%",background:"rgba(232,105,74,0.2)",
              animation:"ping 2.4s cubic-bezier(0,0,0.2,1) infinite",animationDelay:"0.6s"}}/>
            <div style={{position:"relative",width:"52px",height:"52px",borderRadius:"50%",
              background:"linear-gradient(135deg,#8957E5,#E8694A)",display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"22px",animation:"wbounce 2.5s ease-in-out infinite",transition:"transform 0.2s"}}>
              {open ? "✕" : "💬"}
              {/* LIVE badge */}
              {!open && (
                <div style={{position:"absolute",top:"-4px",right:"-4px",background:"#E8694A",color:"white",
                  fontSize:"8px",fontWeight:800,padding:"2px 5px",borderRadius:"10px",
                  fontFamily:"'Quicksand',sans-serif",boxShadow:"0 2px 6px rgba(232,105,74,0.5)",
                  display:"flex",alignItems:"center",gap:"3px"}}>
                  <span style={{width:"5px",height:"5px",borderRadius:"50%",background:"white",display:"inline-block",
                    animation:"ping 1s cubic-bezier(0,0,0.2,1) infinite"}}/>
                  LIVE
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
