"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { X, ArrowLeft, Send, Sparkles, ImageIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface Channel { id:string; slug:string; name:string; description:string; icon:string; access:string; message_count:number; }
interface Member   { id:string; display_name:string; avatar_emoji:string; user_type:string; }
interface Message  { id:string; member_id:string; display_name:string; avatar_emoji:string; content:string|null; msg_type:string; image_url:string|null; created_at:string; reactions:Record<string,number>; }
interface MyUser   { user_type:string; user_ref:string|null; default_name:string|null; }

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
  const [view,       setView]       = useState<"channels"|"label"|"chat">("channels");
  const [channels,   setChannels]   = useState<Channel[]>([]);
  const [myUser,     setMyUser]     = useState<MyUser|null>(null);
  const [channel,    setChannel]    = useState<Channel|null>(null);
  const [member,     setMember]     = useState<Member|null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [labelName,  setLabelName]  = useState("");
  const [labelEmoji, setLabelEmoji] = useState("😊");
  const [showAI,     setShowAI]     = useState(false);
  const [aiPrompt,   setAiPrompt]   = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [pickerFor,  setPickerFor]  = useState<string|null>(null);
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

  useEffect(() => {
    if (!open) return;
    fetch("/api/community/me").then(r=>r.json()).then(setMyUser).catch(()=>setMyUser({user_type:"community",user_ref:null,default_name:null}));
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

  function getUserRef() { return myUser?.user_ref || communityId.current; }

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
    setChannel(ch);
    const ut = myUser.user_type, ur = getUserRef();
    const r = await fetch(`/api/community/members?channel_id=${ch.id}&user_type=${ut}&user_ref=${encodeURIComponent(ur)}`);
    const d = await r.json();
    if (d.member) { setMember(d.member); await loadMessages(ch.id); setView("chat"); }
    else {
      const defEmoji = ch.slug==="children" ? AVATARS.children[0] : (AVATARS[ut]?.[0]||"😊");
      setLabelName(myUser.default_name||localStorage.getItem("ep_community_name")||"");
      setLabelEmoji(defEmoji);
      setView("label");
    }
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
                  <button onClick={()=>{if(view==="label")setView("channels");else resetWidget();}}
                    style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:"28px",height:"28px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"white",flexShrink:0}}>
                    <ArrowLeft size={14}/>
                  </button>
                )}
                <div style={{flex:1,textAlign:view==="channels"?"center":"left"}}>
                  {view==="channels" && <div style={{fontSize:"22px",marginBottom:"2px"}}>💬</div>}
                  <div style={{color:"white",fontWeight:700,fontSize:"15px",fontFamily:"'Fredoka',sans-serif",lineHeight:1.2}}>
                    {view==="channels" ? "Community Chat" : view==="label" ? `Join ${channel?.name}` : channel?.name}
                  </div>
                  <div style={{color:"rgba(255,255,255,0.75)",fontSize:"11px",fontFamily:"'Quicksand',sans-serif"}}>
                    {view==="channels" ? "Live · 4 groups active" :
                     view==="label"    ? "Choose your display name" :
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
