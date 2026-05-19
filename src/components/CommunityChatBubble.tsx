"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MESSAGES = [
  { text: "Parents are chatting! 💬",    emoji: "👨‍👩‍👧" },
  { text: "Kids sharing Ghibli art! 🎨", emoji: "🦁"    },
  { text: "Join your community →",       emoji: "🌟"    },
  { text: "New message in Parent Circle",emoji: "💌"    },
  { text: "Children's Corner is live!",  emoji: "🐯"    },
  { text: "Create AI art together! ✨",  emoji: "🚀"    },
];

const FLOATERS = ["👩","🦁","👨‍🏫","🐸","🌸","⭐","🦊","👶"];

export default function CommunityChatBubble() {
  const [msgIdx,   setMsgIdx]   = useState(0);
  const [visible,  setVisible]  = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [floaters, setFloaters] = useState<Array<{ e: string; x: number; delay: number; dur: number }>>([]);
  const router = useRouter();

  // Appear after 2 s so it doesn't compete with page load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Cycle messages every 3 s
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, [visible]);

  // Generate random floater positions once
  useEffect(() => {
    setFloaters(
      FLOATERS.map((e, i) => ({
        e,
        x: -30 + (i % 4) * 22,
        delay: i * 0.4,
        dur: 2.2 + (i % 3) * 0.6,
      }))
    );
  }, []);

  if (!visible) return null;

  const cur = MESSAGES[msgIdx];

  return (
    <div className="fixed z-40"
      style={{ bottom: "100px", right: "16px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>

      {/* Floating tooltip card — shown when expanded */}
      {expanded && (
        <div className="mb-3 rounded-2xl shadow-2xl overflow-hidden animate-in"
          style={{ width: "210px", background: "white", border: "2px solid rgba(137,87,229,0.2)", animation: "slideUp 0.25s ease" }}>

          {/* Card header */}
          <div className="px-4 py-3 text-white text-center"
            style={{ background: "linear-gradient(135deg, #8957E5 0%, #E8694A 100%)" }}>
            <div className="text-xl mb-0.5">💬</div>
            <div className="font-bold text-sm" style={{ fontFamily: "'Fredoka', sans-serif" }}>Community Chat</div>
            <div className="text-xs opacity-80">Live · {MESSAGES.length} groups active</div>
          </div>

          {/* Avatars row */}
          <div className="flex justify-center gap-1 py-2.5" style={{ background: "rgba(137,87,229,0.05)" }}>
            {["🦁","👩","👨‍🏫","🐸","👶","🦊"].map((e, i) => (
              <span key={i} className="text-xl w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.1)", fontSize: "16px" }}>
                {e}
              </span>
            ))}
          </div>

          {/* Messages preview */}
          <div className="px-3 py-2 space-y-1.5">
            {[
              { e: "🦁", name: "Arjun", msg: "Look at my Ghibli art! 🎨" },
              { e: "👩", name: "Priya Mom", msg: "So cute! ❤️" },
              { e: "👨‍🏫", name: "Ms. Lakshmi", msg: "Wonderful creativity! 🌟" },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-sm">{m.e}</span>
                <div className="text-xs leading-snug">
                  <span className="font-bold" style={{ color: "#8957E5" }}>{m.name}: </span>
                  <span className="text-stone-500">{m.msg}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="px-3 pb-3">
            <button
              onClick={() => { setExpanded(false); router.push("/community"); }}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #8957E5, #E8694A)", fontFamily: "'Quicksand', sans-serif" }}>
              Join the Chat →
            </button>
          </div>
        </div>
      )}

      {/* Main floating button */}
      <div className="relative cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
        style={{ filter: "drop-shadow(0 8px 24px rgba(137,87,229,0.45))" }}>

        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(137,87,229,0.35)", animationDuration: "1.8s" }} />
        <span className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(232,105,74,0.2)", animationDuration: "2.4s", animationDelay: "0.6s" }} />

        {/* Button body */}
        <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: "linear-gradient(135deg, #8957E5 0%, #E8694A 100%)" }}>
          <span className="text-2xl" style={{ animation: "bounce 2s infinite" }}>💬</span>

          {/* LIVE badge */}
          <div className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white"
            style={{ background: "#E8694A", fontSize: "9px", fontWeight: 800, fontFamily: "'Quicksand',sans-serif", boxShadow: "0 2px 6px rgba(232,105,74,0.5)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"
              style={{ animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />
            LIVE
          </div>
        </div>
      </div>

      {/* Rotating message tag */}
      {!expanded && (
        <div key={msgIdx}
          className="mt-2 px-3 py-1.5 rounded-full text-white text-xs font-bold whitespace-nowrap shadow-lg"
          style={{
            background: "linear-gradient(135deg, #8957E5, #E8694A)",
            fontFamily: "'Quicksand',sans-serif",
            animation: "fadeSlide 0.5s ease",
            maxWidth: "180px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
          {cur.emoji} {cur.text}
        </div>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
