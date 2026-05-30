"use client";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Send, RefreshCw, MessageCircle, AlertCircle } from "lucide-react";

interface Props {
  childName?: string;
  phone?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: Date;
  error?: boolean;
}

const QUICK_QUESTIONS = [
  "What is the fee structure?",
  "What are school timings?",
  "What's the refund policy?",
  "How do I update my child's details?",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Ask me anything about Evergreen Preschool — fees, policies, schedule, admissions, and more. My answers are based on our official documents.",
  sources: [],
  timestamp: new Date(),
};

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#178F78",
            display: "inline-block",
            animation: "kbBounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes kbBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function ParentKBChat({ childName, phone }: Props) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuickQ, setShowQuickQ] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(query: string) {
    if (!query.trim() || loading) return;
    setShowQuickQ(false);

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/kb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), target: "parent" }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: data.answer ?? "I'm sorry, I couldn't find an answer for that.",
        sources: Array.isArray(data.sources) ? data.sources : [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "Oops! Something went wrong. Please try again.",
        sources: [],
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function retryLast() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((prev) => prev.filter((m) => !m.error));
      sendMessage(lastUser.content);
    }
  }

  const hasError = messages.some((m) => m.error);

  return (
    <div
      style={{
        fontFamily: "'Quicksand', 'Fredoka', sans-serif",
        maxWidth: "680px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #178F78 0%, #0f6b5a 100%)",
          borderRadius: "16px 16px 0 0",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            flexShrink: 0,
          }}
        >
          💬
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            Ask Evergreen AI
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
            Answers from our official documents
          </div>
        </div>
        {childName && (
          <div
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.18)",
              borderRadius: "20px",
              padding: "4px 12px",
              fontSize: "12px",
              color: "#ffffff",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Hi, {childName.split(" ")[0]}!
          </div>
        )}
      </div>

      {/* Chat Body */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e8edf5",
          borderTop: "none",
          maxHeight: "500px",
          overflowY: "auto",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          scrollbarWidth: "thin",
          scrollbarColor: "#c9d4e8 transparent",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "4px",
            }}
          >
            {/* Bubble */}
            <div
              style={{
                maxWidth: "82%",
                padding: "11px 15px",
                borderRadius:
                  msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: msg.role === "user" ? "#178F78" : "#f7f9fc",
                border: msg.role === "user" ? "none" : `1px solid ${msg.error ? "#fde0d8" : "#e8edf5"}`,
                color: msg.role === "user" ? "#ffffff" : "#1A2F4A",
                fontSize: "14px",
                lineHeight: 1.55,
                wordBreak: "break-word",
                boxShadow:
                  msg.role === "user"
                    ? "0 2px 8px rgba(23,143,120,0.22)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {msg.error && (
                <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#E8694A", marginBottom: "4px", fontSize: "13px" }}>
                  <AlertCircle size={14} /> Something went wrong
                </span>
              )}
              {msg.content}
            </div>

            {/* Sources */}
            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", maxWidth: "82%", paddingLeft: "2px" }}>
                {msg.sources.map((src, si) => (
                  <span
                    key={si}
                    style={{
                      fontSize: "11px",
                      background: "#eef7f5",
                      border: "1px solid #c1e4dd",
                      color: "#178F78",
                      borderRadius: "20px",
                      padding: "2px 10px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Source: {src}
                  </span>
                ))}
              </div>
            )}

            {/* Timestamp + retry */}
            <div
              style={{
                fontSize: "10px",
                color: "#aab4c8",
                paddingLeft: msg.role === "assistant" ? "2px" : "0",
                paddingRight: msg.role === "user" ? "2px" : "0",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {formatTime(msg.timestamp)}
              {msg.error && (
                <button
                  onClick={retryLast}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#E8694A",
                    cursor: "pointer",
                    fontSize: "11px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={11} /> Retry
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
            <div
              style={{
                background: "#f7f9fc",
                border: "1px solid #e8edf5",
                borderRadius: "18px 18px 18px 4px",
                padding: "10px 16px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <TypingDots />
            </div>
          </div>
        )}

        {/* Quick questions */}
        {showQuickQ && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  border: "1.5px solid #178F78",
                  borderRadius: "20px",
                  background: "#eef7f5",
                  color: "#178F78",
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontFamily: "'Quicksand', sans-serif",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#d5efe9")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#eef7f5")}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          background: "#f7f9fc",
          border: "1px solid #e8edf5",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          padding: "12px 14px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your question…"
          disabled={loading}
          style={{
            flex: 1,
            border: "1.5px solid #dde3ef",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "14px",
            fontFamily: "'Quicksand', sans-serif",
            color: "#1A2F4A",
            outline: "none",
            background: loading ? "#f0f2f6" : "#ffffff",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#178F78")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#dde3ef")}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            border: "none",
            background:
              loading || !input.trim()
                ? "#c9d4e8"
                : "linear-gradient(135deg, #178F78, #0f6b5a)",
            color: "#ffffff",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow:
              loading || !input.trim() ? "none" : "0 2px 8px rgba(23,143,120,0.30)",
            transition: "background 0.15s, box-shadow 0.15s",
          }}
          aria-label="Send message"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
