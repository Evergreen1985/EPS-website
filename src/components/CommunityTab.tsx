"use client";
import { useEffect, useRef, useState } from "react";

// Web Community chat — parity with the native app's Community screen.
// Uses the same /api/community/* backend; polls for new messages (no realtime needed on web).
export default function CommunityTab({
  userType, userRef, displayName,
}: {
  userType: "parent" | "teacher";
  userRef: string;
  displayName: string;
}) {
  const [channels, setChannels]   = useState<any[]>([]);
  const [active, setActive]       = useState<any | null>(null);
  const [memberId, setMemberId]   = useState<string | null>(null);
  const [messages, setMessages]   = useState<any[]>([]);
  const [text, setText]           = useState("");
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const poll = useRef<any>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/community/channels").then(r => r.json())
      .then(d => setChannels(d.channels || []))
      .finally(() => setLoading(false));
    return () => { if (poll.current) clearInterval(poll.current); };
  }, []);

  const loadMessages = async (channelId: string) => {
    const d = await fetch(`/api/community/messages?channel_id=${channelId}`).then(r => r.json());
    setMessages(d.messages || []);
    setTimeout(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, 50);
  };

  const openChannel = async (ch: any) => {
    setActive(ch); setMessages([]); setMemberId(null);
    // join as a member (cookie-less: identity passed explicitly)
    try {
      const m = await fetch("/api/community/members", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: ch.id, user_type: userType, user_ref: userRef, display_name: displayName, avatar_emoji: userType === "teacher" ? "👩‍🏫" : "👪" }),
      }).then(r => r.json());
      setMemberId(m.member?.id || null);
    } catch {}
    await loadMessages(ch.id);
    if (poll.current) clearInterval(poll.current);
    poll.current = setInterval(() => loadMessages(ch.id), 4000);
  };

  const send = async () => {
    const content = text.trim();
    if (!content || !active) return;
    setSending(true);
    try {
      await fetch("/api/community/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_id: active.id, member_id: memberId, display_name: displayName, user_type: userType, content, msg_type: "text" }),
      });
      setText("");
      await loadMessages(active.id);
    } catch {} finally { setSending(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6B7A99" }}>Loading community…</div>;

  // ── channel list ──
  if (!active) {
    return (
      <div>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 17, fontWeight: 700, color: "#1A2F4A", marginBottom: 14 }}>Community</div>
        {channels.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6B7A99", background: "white", borderRadius: 16, border: "1px solid #EDE8DF" }}>No channels yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {channels.map(ch => (
              <button key={ch.id} onClick={() => openChannel(ch)} style={{ textAlign: "left", background: "white", border: "1px solid #EDE8DF", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 22 }}>{ch.icon || "💬"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1A2F4A" }}>{ch.name || ch.slug}</div>
                  {ch.description && <div style={{ fontSize: 12, color: "#6B7A99" }}>{ch.description}</div>}
                </div>
                <div style={{ fontSize: 11, color: "#6B7A99" }}>{ch.message_count || 0} msgs</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── chat view ──
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "70vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <button onClick={() => { if (poll.current) clearInterval(poll.current); setActive(null); }} style={{ background: "#EDE8DF", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>← Channels</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1A2F4A" }}>{active.icon || "💬"} {active.name || active.slug}</div>
      </div>
      <div ref={scroller} style={{ flex: 1, overflowY: "auto", background: "white", border: "1px solid #EDE8DF", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#6B7A99", marginTop: 30 }}>No messages yet — say hello! 👋</div>
        ) : messages.map(m => {
          const mine = memberId && m.member_id === memberId;
          return (
            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "75%" }}>
              {!mine && <div style={{ fontSize: 11, fontWeight: 700, color: "#178F78", marginBottom: 2 }}>{m.display_name}</div>}
              <div style={{ background: mine ? "#178F78" : "#F1F5F9", color: mine ? "white" : "#1A2F4A", borderRadius: 12, padding: "8px 12px", fontSize: 14 }}>
                {m.image_url && <img src={m.image_url} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: m.content ? 6 : 0 }} />}
                {m.content}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, textAlign: mine ? "right" : "left" }}>{new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }}
          placeholder="Type a message…" style={{ flex: 1, border: "1px solid #EDE8DF", borderRadius: 10, padding: "10px 12px", fontSize: 14 }} />
        <button onClick={send} disabled={sending || !text.trim()} style={{ background: "#178F78", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
