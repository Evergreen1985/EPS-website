"use client";
import { useState, useEffect, useRef } from "react";
import FlashcardQuiz from "./FlashcardQuiz";

interface TeacherSession {
  id: string;
  name: string;
  role: string;
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: string[];
  topic?: string;
  quiz?: QuizQuestion[];
  quizLoading?: boolean;
  quizOpen?: boolean;
  documentContent?: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QUICK_QUESTIONS = [
  "What are the POCSO guidelines?",
  "NEP Foundational Stage key points?",
  "Emergency evacuation procedure?",
  "Developmental milestones for 3-year-olds?",
];

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function StaffTrainingChat() {
  const [teacher, setTeacher] = useState<TeacherSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Welcome to Staff Training Hub! Ask me about SOPs, child safety, NEP guidelines, developmental milestones, or anything from our training materials.",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ep_teacher_session");
      if (raw) setTeacher(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: genId(), role: "user", text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const aiId = genId();
    setMessages(prev => [...prev, { id: aiId, role: "ai", text: "…", sources: [] }]);

    try {
      const res = await fetch("/api/kb/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text.trim(), target: "staff" }),
      });
      const data = await res.json();
      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, text: data.answer ?? "Sorry, I could not find an answer.", sources: data.sources ?? [], topic: text.trim(), documentContent: data.documentContent ?? "" }
            : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiId ? { ...m, text: "Something went wrong. Please try again." } : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz(msgId: string, topic: string, documentContent: string) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, quizLoading: true } : m));
    try {
      const res = await fetch("/api/kb/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, documentContent }),
      });
      const data = await res.json();
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId
            ? { ...m, quizLoading: false, quiz: data.questions ?? [], quizOpen: true }
            : m
        )
      );
    } catch {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, quizLoading: false } : m));
    }
  }

  function toggleQuiz(msgId: string) {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, quizOpen: !m.quizOpen } : m));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "520px", maxHeight: "800px", background: "#F5F7FA", borderRadius: "20px", overflow: "hidden", fontFamily: "'Quicksand', 'Fredoka', sans-serif", boxShadow: "0 4px 24px rgba(23,143,120,0.10)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #178F78 0%, #3B82F6 100%)", padding: "16px 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>🎓</span>
            <div>
              <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                Staff Training Hub
              </div>
              {teacher && (
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)" }}>
                  Welcome, {teacher.name} · {teacher.role}
                </div>
              )}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
            📄 Powered by school documents
          </div>
        </div>
      </div>

      {/* Quick questions */}
      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px" }}>
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #178F78", background: "#fff", color: "#178F78", fontFamily: "'Quicksand', sans-serif", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "6px" }}>
            {/* Bubble */}
            <div style={{ maxWidth: "82%", padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "#3B82F6" : "#fff", color: msg.role === "user" ? "#fff" : "#1A2F4A", fontSize: "14px", lineHeight: "1.6", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", wordBreak: "break-word" }}>
              {msg.text === "…" ? (
                <span style={{ display: "inline-flex", gap: "4px", alignItems: "center" }}>
                  <span style={{ animation: "bounce 1.2s infinite 0s", display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#9CA3AF" }} />
                  <span style={{ animation: "bounce 1.2s infinite 0.2s", display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#9CA3AF" }} />
                  <span style={{ animation: "bounce 1.2s infinite 0.4s", display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", background: "#9CA3AF" }} />
                  <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                </span>
              ) : msg.text}
            </div>

            {/* Sources */}
            {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "82%" }}>
                {msg.sources.map((src, i) => (
                  <span key={i} style={{ padding: "3px 10px", borderRadius: "20px", background: "rgba(23,143,120,0.1)", color: "#178F78", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(23,143,120,0.2)" }}>
                    📎 {src}
                  </span>
                ))}
              </div>
            )}

            {/* Quiz button */}
            {msg.role === "ai" && msg.topic && msg.text !== "…" && msg.text !== "Something went wrong. Please try again." && (
              <div style={{ maxWidth: "82%" }}>
                {!msg.quiz ? (
                  <button
                    onClick={() => generateQuiz(msg.id, msg.topic!, msg.documentContent ?? "")}
                    disabled={!!msg.quizLoading}
                    style={{ padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #8957E5", background: msg.quizLoading ? "#F3EEFF" : "#fff", color: "#8957E5", fontFamily: "'Quicksand', sans-serif", fontSize: "12px", fontWeight: 700, cursor: msg.quizLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {msg.quizLoading ? (
                      <><span style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #8957E5", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />Generating quiz…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></>
                    ) : "✨ Generate Quiz on this topic"}
                  </button>
                ) : (
                  <button
                    onClick={() => toggleQuiz(msg.id)}
                    style={{ padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #8957E5", background: "#8957E5", color: "#fff", fontFamily: "'Quicksand', sans-serif", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {msg.quizOpen ? "Hide Quiz" : "Show Quiz"} ({msg.quiz.length} questions)
                  </button>
                )}

                {msg.quiz && msg.quiz.length > 0 && msg.quizOpen && (
                  <div style={{ marginTop: "12px" }}>
                    <FlashcardQuiz
                      questions={msg.quiz}
                      topic={msg.topic!}
                      onClose={() => toggleQuiz(msg.id)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #EDE8DF", flexShrink: 0 }}>
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about SOPs, safety, NEP, milestones…"
            disabled={loading}
            style={{ flex: 1, padding: "11px 16px", borderRadius: "24px", border: "1.5px solid #EDE8DF", outline: "none", fontFamily: "'Quicksand', sans-serif", fontSize: "14px", color: "#1A2F4A", background: "#F8F9FA" }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{ width: "42px", height: "42px", borderRadius: "50%", border: "none", background: loading || !input.trim() ? "#EDE8DF" : "linear-gradient(135deg, #178F78, #3B82F6)", color: "#fff", fontSize: "18px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
