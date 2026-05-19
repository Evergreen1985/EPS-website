"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Send, Sparkles, X, ImageIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Channel {
  id: string; slug: string; name: string; description: string;
  icon: string; access: string; message_count: number;
}
interface Member {
  id: string; display_name: string; avatar_emoji: string;
  user_type: string; user_ref: string; channel_id: string;
}
interface Message {
  id: string; channel_id: string; member_id: string;
  display_name: string; user_type: string; avatar_emoji: string;
  content: string | null; msg_type: string; image_url: string | null;
  created_at: string; reactions: Record<string, number>;
}
interface MyUser {
  user_type: string; user_ref: string | null; default_name: string | null;
}

// ── Supabase browser client for realtime ─────────────────────────────────────

const sbBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Constants ────────────────────────────────────────────────────────────────

const REACTIONS = ["❤️","😂","😮","🥹","👏","🎉","👍","🌟","🥰","😍","🙌","🔥"];

const AVATARS: Record<string, string[]> = {
  children:  ["🦁","🐯","🦊","🐸","🦄","🐼","🐨","🐰","🐮","🦋","⭐","🎨","🚀","🌈"],
  parent:    ["👩","👨","🧑","🌸","🌺","🌻","💐","🍀","🌙","🦋"],
  teacher:   ["👩‍🏫","👨‍🏫","📚","🍎","✏️","🎓","🌟","💡"],
  owner:     ["👑","⭐","🏫","💎","🌿"],
  community: ["😊","🙋","🌍","👋","💪","🌈","✨","🎯","🐾","🌸"],
};

const CHANNEL_COLORS: Record<string, { bg: string; accent: string; light: string }> = {
  children:  { bg: "#FFF8E7", accent: "#F5B829", light: "rgba(245,184,41,0.12)" },
  parents:   { bg: "#EFF6FF", accent: "#3B82F6", light: "rgba(59,130,246,0.10)" },
  staff:     { bg: "#F0FDF4", accent: "#22C55E", light: "rgba(34,197,94,0.10)"  },
  community: { bg: "#FDF4FF", accent: "#A855F7", light: "rgba(168,85,247,0.10)" },
};

const PRIMARY = "#178F78";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function fmtDate(iso: string) {
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CommunityHub() {
  const [view,       setView]       = useState<"channels"|"chat">("channels");
  const [channels,   setChannels]   = useState<Channel[]>([]);
  const [myUser,     setMyUser]     = useState<MyUser | null>(null);
  const [channel,    setChannel]    = useState<Channel | null>(null);
  const [member,     setMember]     = useState<Member | null>(null);
  const [messages,   setMessages]   = useState<Message[]>([]);
  const [input,      setInput]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [showLabel,  setShowLabel]  = useState(false);
  const [showAI,     setShowAI]     = useState(false);
  const [aiPrompt,   setAiPrompt]   = useState("");
  const [aiLoading,  setAiLoading]  = useState(false);
  const [pickerFor,  setPickerFor]  = useState<string|null>(null);
  const [labelName,  setLabelName]  = useState("");
  const [labelEmoji, setLabelEmoji] = useState("😊");
  const [loadingMsg, setLoadingMsg] = useState(false);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);
  const communityId = useRef("");

  // Community user ID persisted in localStorage
  useEffect(() => {
    let id = localStorage.getItem("ep_community_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("ep_community_id", id); }
    communityId.current = id;
  }, []);

  useEffect(() => {
    fetch("/api/community/me").then(r => r.json())
      .then(d => setMyUser(d))
      .catch(() => setMyUser({ user_type: "community", user_ref: null, default_name: null }));
  }, []);

  useEffect(() => {
    fetch("/api/community/channels").then(r => r.json())
      .then(d => setChannels(d.channels || []));
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (view !== "chat" || !channel) return;
    const sub = sbBrowser
      .channel(`chat:${channel.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_messages",
        filter: `channel_id=eq.${channel.id}`,
      }, (payload) => {
        const msg = payload.new as any;
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, { ...msg, reactions: {} }]);
      })
      .subscribe();
    return () => { sbBrowser.removeChannel(sub); };
  }, [view, channel]);

  function getUserRef() {
    if (myUser?.user_ref) return myUser.user_ref;
    return communityId.current;
  }

  function canAccess(ch: Channel) {
    const ut = myUser?.user_type || "community";
    if (ut === "owner") return true;
    if (ch.access === "all") return true;
    if (ch.access === "parents" && ut === "parent") return true;
    if (ch.access === "staff"   && ut === "teacher") return true;
    if (ch.access === "parents_staff" && (ut === "parent" || ut === "teacher")) return true;
    return false;
  }

  async function handleChannelClick(ch: Channel) {
    if (!canAccess(ch)) return;
    setChannel(ch);

    const ut = myUser?.user_type || "community";
    const ur = getUserRef();

    const r = await fetch(`/api/community/members?channel_id=${ch.id}&user_type=${ut}&user_ref=${encodeURIComponent(ur)}`);
    const d = await r.json();

    if (d.member) {
      setMember(d.member);
      await loadMessages(ch.id);
      setView("chat");
    } else {
      const defaultEmoji = ch.slug === "children"
        ? AVATARS.children[0]
        : (AVATARS[ut]?.[0] || "😊");
      setLabelName(myUser?.default_name || localStorage.getItem("ep_community_name") || "");
      setLabelEmoji(defaultEmoji);
      setShowLabel(true);
    }
  }

  async function loadMessages(channelId: string) {
    setLoadingMsg(true);
    try {
      const r = await fetch(`/api/community/messages?channel_id=${channelId}`);
      const d = await r.json();
      setMessages(d.messages || []);
    } finally {
      setLoadingMsg(false);
    }
  }

  async function handleJoin() {
    if (!labelName.trim() || !channel || !myUser) return;
    const ut = myUser.user_type;
    const ur = getUserRef();
    if (ut === "community") localStorage.setItem("ep_community_name", labelName.trim());

    const r = await fetch("/api/community/members", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: channel.id, user_type: ut, user_ref: ur, display_name: labelName.trim(), avatar_emoji: labelEmoji }),
    });
    const d = await r.json();
    if (d.member) {
      setMember(d.member);
      setShowLabel(false);
      await loadMessages(channel.id);
      setView("chat");
    }
  }

  async function sendMessage(content?: string, msgType?: string, imageUrl?: string) {
    if (!channel || !member) return;
    const text = content ?? input.trim();
    if (!text && !imageUrl) return;
    setSending(true);
    try {
      await fetch("/api/community/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: channel.id, member_id: member.id,
          display_name: member.display_name, user_type: member.user_type,
          avatar_emoji: member.avatar_emoji,
          content: text || null, msg_type: msgType || "text", image_url: imageUrl || null,
        }),
      });
      setInput("");
      if (inputRef.current) { inputRef.current.style.height = "auto"; }
    } finally {
      setSending(false);
    }
  }

  async function generateAIImage() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const r = await fetch("/api/community/ai-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const d = await r.json();
      if (d.url) {
        await sendMessage(aiPrompt, "ai_image", d.url);
        setShowAI(false);
        setAiPrompt("");
      }
    } finally {
      setAiLoading(false);
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!member) return;
    setPickerFor(null);
    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;
      const r = { ...msg.reactions };
      if (r[emoji]) { r[emoji]--; if (r[emoji] === 0) delete r[emoji]; }
      else r[emoji] = (r[emoji] || 0) + 1;
      return { ...msg, reactions: r };
    }));
    await fetch("/api/community/reactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, member_id: member.id, emoji }),
    });
  }

  // ── Channel List ──────────────────────────────────────────────────────────

  if (view === "channels") {
    return (
      <div style={{ fontFamily: "'Quicksand', sans-serif", background: "#FAFAF8", minHeight: "60vh" }}>
        {/* Header */}
        <div className="py-14 text-center border-b" style={{ background: "linear-gradient(135deg, rgba(23,143,120,0.07) 0%, rgba(232,105,74,0.07) 100%)", borderColor: "rgba(23,143,120,0.12)" }}>
          <div className="text-5xl mb-3">💬</div>
          <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: "'Fredoka', sans-serif", color: PRIMARY }}>
            Evergreen Community Chat
          </h2>
          <p className="text-stone-500 text-sm max-w-sm mx-auto px-4">
            Connect, share ideas, react with emojis, and create AI art — all in one safe space.
          </p>
          {myUser && myUser.user_type !== "community" ? (
            <span className="mt-4 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>
              ✓ Signed in as {myUser.user_type} · {myUser.default_name}
            </span>
          ) : (
            <p className="mt-3 text-xs text-stone-400 px-4">
              <a href="/parent-login" className="font-bold underline" style={{ color: PRIMARY }}>Login as parent</a>
              {" or "}
              <a href="/teacher-login" className="font-bold underline" style={{ color: "#E8694A" }}>as teacher</a>
              {" to unlock all groups"}
            </p>
          )}
        </div>

        {/* 4 Channel Cards */}
        <div className="max-w-3xl mx-auto px-4 py-10 grid sm:grid-cols-2 gap-5">
          {channels.map(ch => {
            const c = CHANNEL_COLORS[ch.slug] || CHANNEL_COLORS.community;
            const accessible = canAccess(ch);
            const lockMsg =
              ch.access === "parents"       ? "Parents only — login to join" :
              ch.access === "staff"         ? "Staff only — teacher login required" :
              ch.access === "parents_staff" ? "Parents & staff only" : "";

            return (
              <button key={ch.id}
                onClick={() => accessible && handleChannelClick(ch)}
                className={`text-left rounded-3xl p-6 border-2 w-full transition-all ${accessible ? "hover:-translate-y-1 hover:shadow-xl cursor-pointer" : "opacity-55 cursor-not-allowed"}`}
                style={{ background: accessible ? c.bg : "#F5F5F5", borderColor: accessible ? c.accent + "40" : "#E0E0E0" }}>

                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{ch.icon}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: accessible ? c.accent + "20" : "rgba(0,0,0,0.06)", color: accessible ? c.accent : "#999" }}>
                    {accessible ? `${ch.message_count} msgs` : "🔒 Locked"}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Fredoka', sans-serif", color: accessible ? c.accent : "#888" }}>
                  {ch.name}
                </h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: accessible ? "#6B7A80" : "#AAA" }}>
                  {accessible ? ch.description : lockMsg}
                </p>

                {accessible && (
                  <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: c.accent }}>
                    Tap to enter →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Label Setup Dialog */}
        {showLabel && channel && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLabel(false)}>
            <div className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">{channel.icon}</div>
                <h3 className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: PRIMARY }}>
                  Joining {channel.name}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {channel.slug === "children"
                    ? "Use your child's name — they'll be known by this label here!"
                    : "Choose how you appear in this group. You can use a different name per group."}
                </p>
              </div>

              {/* Emoji picker */}
              <p className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Pick your emoji</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {(AVATARS[channel.slug === "children" ? "children" : (myUser?.user_type || "community")] || AVATARS.community).map(e => (
                  <button key={e} onClick={() => setLabelEmoji(e)}
                    className="text-xl p-1.5 rounded-xl transition-all"
                    style={{ background: labelEmoji === e ? `${PRIMARY}20` : "transparent", border: `2px solid ${labelEmoji === e ? PRIMARY : "transparent"}` }}>
                    {e}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <p className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">
                {channel.slug === "children" ? "Child's name" : "Your display name"}
              </p>
              <input
                value={labelName}
                onChange={e => setLabelName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder={channel.slug === "children" ? "e.g. Arjun" : "e.g. Priya Sharma"}
                autoFocus
                className="w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none"
                style={{ borderColor: `${PRIMARY}50`, fontFamily: "'Quicksand', sans-serif" }}
              />

              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowLabel(false)}
                  className="flex-1 py-2.5 rounded-2xl border-2 font-bold text-sm text-stone-500"
                  style={{ borderColor: "#E0E0E0" }}>
                  Cancel
                </button>
                <button onClick={handleJoin} disabled={!labelName.trim()}
                  className="flex-1 py-2.5 rounded-2xl font-bold text-sm text-white disabled:opacity-40"
                  style={{ background: PRIMARY }}>
                  {labelEmoji} Enter Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Chat Room ─────────────────────────────────────────────────────────────

  const grouped: Array<{ date: string; msgs: Message[] }> = [];
  messages.forEach(msg => {
    const date = fmtDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) last.msgs.push(msg);
    else grouped.push({ date, msgs: [msg] });
  });

  const isMe = (msg: Message) => member && msg.member_id === member.id;
  const ch = channel!;
  const cc = CHANNEL_COLORS[ch.slug] || CHANNEL_COLORS.community;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 92px)", fontFamily: "'Quicksand', sans-serif" }}
      onClick={() => setPickerFor(null)}>

      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white flex-shrink-0" style={{ borderColor: "#EDE8DF" }}>
        <button onClick={() => { setView("channels"); setMessages([]); setChannel(null); setMember(null); setShowAI(false); }}
          className="p-2 rounded-full hover:bg-stone-100 transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: PRIMARY }} />
        </button>
        <span className="text-2xl">{ch.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate" style={{ fontFamily: "'Fredoka', sans-serif", color: "#1A2F4A" }}>{ch.name}</div>
          <div className="text-xs text-stone-400">You: {member?.avatar_emoji} {member?.display_name}</div>
        </div>
        <button onClick={() => setShowAI(v => !v)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: showAI ? "#8957E5" : "rgba(137,87,229,0.12)", color: showAI ? "white" : "#8957E5" }}>
          <Sparkles className="w-3 h-3" /> Ghibli Art
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: cc.light || "#FAF8F5" }}
        onClick={() => setPickerFor(null)}>

        {loadingMsg && (
          <div className="text-center py-8 text-stone-400 text-sm">Loading messages…</div>
        )}

        {!loadingMsg && messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">{ch.icon}</div>
            <p className="font-bold text-stone-400">No messages yet</p>
            <p className="text-sm text-stone-300 mt-1">Say hello! 👋</p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            <div className="text-center my-4">
              <span className="text-xs px-3 py-1 rounded-full bg-white/80 text-stone-400 font-semibold shadow-sm">{group.date}</span>
            </div>

            {group.msgs.map((msg, i) => {
              const mine = isMe(msg);
              const prev = group.msgs[i - 1];
              const showHead = !prev || prev.member_id !== msg.member_id;

              return (
                <div key={msg.id} className={`flex items-end gap-2 mb-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className="w-8 flex-shrink-0 flex justify-center">
                    {showHead && !mine && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg mb-5"
                        style={{ background: "rgba(255,255,255,0.9)", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        {msg.avatar_emoji}
                      </div>
                    )}
                  </div>

                  {/* Bubble + reactions */}
                  <div className={`max-w-[75%] lg:max-w-md flex flex-col ${mine ? "items-end" : "items-start"}`}>
                    {showHead && !mine && (
                      <div className="text-xs font-bold mb-0.5 px-1" style={{ color: cc.accent }}>{msg.display_name}</div>
                    )}

                    <div onClick={e => { e.stopPropagation(); setPickerFor(pickerFor === msg.id ? null : msg.id); }}
                      className="relative cursor-pointer px-4 py-2.5 rounded-2xl"
                      style={{
                        background: mine ? PRIMARY : "white",
                        color: mine ? "white" : "#1A2F4A",
                        borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.09)",
                      }}>

                      {msg.msg_type === "ai_image" && (
                        <div className="flex items-center gap-1 text-xs mb-1.5 opacity-70">
                          <Sparkles className="w-3 h-3" /> Ghibli Art
                        </div>
                      )}

                      {msg.image_url && (
                        <img src={msg.image_url} alt={msg.content || "image"}
                          className="rounded-xl mb-2 max-w-full"
                          style={{ maxHeight: "220px", objectFit: "cover", width: "100%" }} />
                      )}

                      {msg.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      )}

                      <div className={`text-xs mt-1 ${mine ? "text-white/55" : "text-stone-300"}`}>
                        {fmtTime(msg.created_at)}
                      </div>
                    </div>

                    {/* Reaction counts */}
                    {Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <button key={emoji}
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold hover:scale-110 transition-transform bg-white shadow-sm border border-stone-100">
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Emoji picker */}
                    {pickerFor === msg.id && (
                      <div className={`flex flex-wrap gap-1 mt-1.5 p-2 rounded-2xl shadow-lg bg-white border border-stone-100 z-10 ${mine ? "justify-end" : "justify-start"}`}
                        onClick={e => e.stopPropagation()}>
                        {REACTIONS.map(e => (
                          <button key={e} onClick={() => toggleReaction(msg.id, e)}
                            className="text-xl hover:scale-125 transition-transform p-0.5">
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
        ))}
      </div>

      {/* AI Image Panel */}
      {showAI && (
        <div className="border-t px-4 py-3 bg-white flex-shrink-0" style={{ borderColor: "#EDE8DF" }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" style={{ color: "#8957E5" }} />
            <span className="text-sm font-bold" style={{ color: "#8957E5" }}>AI Ghibli Image Generator</span>
            <button onClick={() => setShowAI(false)} className="ml-auto text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateAIImage()}
              placeholder="e.g. a rabbit playing in the rain…"
              className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: "rgba(137,87,229,0.3)", fontFamily: "'Quicksand',sans-serif" }} />
            <button onClick={generateAIImage} disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 rounded-xl font-bold text-white text-sm disabled:opacity-40 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #8957E5, #E8694A)" }}>
              {aiLoading ? "✨…" : "Create"}
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-1.5">Your image will appear in chat in Ghibli anime style 🎨</p>
        </div>
      )}

      {/* Input Bar */}
      <div className="border-t px-4 py-3 bg-white flex-shrink-0" style={{ borderColor: "#EDE8DF" }}>
        <div className="flex items-end gap-2">
          <button onClick={() => setShowAI(v => !v)} title="AI image"
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors flex-shrink-0">
            <ImageIcon className="w-5 h-5" style={{ color: showAI ? "#8957E5" : "#C4C4C4" }} />
          </button>
          <textarea ref={inputRef} value={input} rows={1}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 border-2 rounded-2xl px-4 py-2.5 text-sm resize-none focus:outline-none overflow-hidden"
            style={{ borderColor: `${PRIMARY}40`, fontFamily: "'Quicksand',sans-serif", maxHeight: "120px", lineHeight: "1.4" }} />
          <button onClick={() => sendMessage()} disabled={sending || !input.trim()}
            className="p-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-40 flex-shrink-0"
            style={{ background: PRIMARY }}>
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
