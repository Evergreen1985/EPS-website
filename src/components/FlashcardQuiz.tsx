"use client";
import { useState } from "react";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Props {
  questions: Question[];
  topic: string;
  onClose?: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function FlashcardQuiz({ questions, topic, onClose }: Props) {
  const [mode, setMode] = useState<"quiz" | "flashcard">("quiz");

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  // Flashcard state
  const [fcIndex, setFcIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentQ = questions[qIndex];
  const score = answers.filter((a, i) => a === questions[i].correct).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  function handleOptionClick(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    const updated = [...answers];
    updated[qIndex] = idx;
    setAnswers(updated);
  }

  function handleNext() {
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function handleRetry() {
    setQIndex(0);
    setSelected(null);
    setAnswers(Array(questions.length).fill(null));
    setFinished(false);
  }

  function resetFC() {
    setFcIndex(0);
    setFlipped(false);
  }

  function scoreEmoji() {
    if (pct === 100) return "🏆";
    if (pct >= 70) return "🎉";
    return "📚";
  }

  const containerStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(23,143,120,0.12)",
    overflow: "hidden",
    fontFamily: "'Quicksand', 'Fredoka', sans-serif",
    maxWidth: "640px",
    margin: "0 auto",
  };

  const headerStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #178F78, #3B82F6)",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const modeTabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 18px",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    background: active ? "#fff" : "rgba(255,255,255,0.15)",
    color: active ? "#178F78" : "#fff",
    transition: "all 0.2s",
  });

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, color: "#fff" }}>
            📋 {topic}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", marginTop: "2px" }}>
            {questions.length} questions
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "24px", padding: "3px" }}>
            <button onClick={() => { setMode("quiz"); resetFC(); }} style={modeTabStyle(mode === "quiz")}>Quiz Mode</button>
            <button onClick={() => { setMode("flashcard"); handleRetry(); }} style={modeTabStyle(mode === "flashcard")}>Flashcard Mode</button>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "#fff", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "24px" }}>
        {/* ── QUIZ MODE ── */}
        {mode === "quiz" && !finished && (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6B7A99", marginBottom: "6px" }}>
                <span>Question {qIndex + 1} of {questions.length}</span>
                <span>{answers.filter(a => a !== null).length} answered</span>
              </div>
              <div style={{ height: "6px", background: "#EDE8DF", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((qIndex + (selected !== null ? 1 : 0)) / questions.length) * 100}%`, background: "linear-gradient(90deg, #178F78, #3B82F6)", borderRadius: "3px", transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Question */}
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A2F4A", marginBottom: "20px", lineHeight: "1.5" }}>
              {currentQ.question}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {currentQ.options.map((opt, i) => {
                let bg = "#F8F9FA";
                let border = "1.5px solid #EDE8DF";
                let color = "#1A2F4A";
                if (selected !== null) {
                  if (i === currentQ.correct) { bg = "rgba(23,143,120,0.1)"; border = "1.5px solid #178F78"; color = "#178F78"; }
                  else if (i === selected && i !== currentQ.correct) { bg = "rgba(232,105,74,0.1)"; border = "1.5px solid #E8694A"; color = "#E8694A"; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(i)}
                    style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px", borderRadius: "12px", border, background: bg, cursor: selected !== null ? "default" : "pointer", textAlign: "left", fontFamily: "'Quicksand', sans-serif", fontSize: "14px", color, fontWeight: selected !== null && i === currentQ.correct ? 700 : 500, transition: "all 0.2s" }}
                  >
                    <span style={{ flexShrink: 0, width: "24px", height: "24px", borderRadius: "50%", background: selected !== null && i === currentQ.correct ? "#178F78" : selected !== null && i === selected ? "#E8694A" : "#EDE8DF", color: selected !== null && (i === currentQ.correct || i === selected) ? "#fff" : "#6B7A99", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700 }}>
                      {OPTION_LABELS[i]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {selected !== null && (
              <div style={{ background: selected === currentQ.correct ? "rgba(23,143,120,0.08)" : "rgba(232,105,74,0.08)", border: `1px solid ${selected === currentQ.correct ? "#178F78" : "#E8694A"}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: selected === currentQ.correct ? "#178F78" : "#E8694A", marginBottom: "4px" }}>
                  {selected === currentQ.correct ? "✅ Correct!" : "❌ Not quite."}
                </div>
                <div style={{ fontSize: "13px", color: "#1A2F4A", lineHeight: "1.5" }}>{currentQ.explanation}</div>
              </div>
            )}

            {selected !== null && (
              <button
                onClick={handleNext}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #178F78, #3B82F6)", color: "#fff", fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
              >
                {qIndex < questions.length - 1 ? "Next Question →" : "See Results"}
              </button>
            )}
          </>
        )}

        {/* ── QUIZ FINISHED ── */}
        {mode === "quiz" && finished && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "12px" }}>{scoreEmoji()}</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: "28px", fontWeight: 700, color: "#1A2F4A", marginBottom: "8px" }}>
              {pct}% Score
            </div>
            <div style={{ fontSize: "14px", color: "#6B7A99", marginBottom: "24px" }}>
              You got {score} out of {questions.length} questions correct
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {questions.map((q, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", background: answers[i] === q.correct ? "rgba(23,143,120,0.08)" : "rgba(232,105,74,0.08)", border: `1px solid ${answers[i] === q.correct ? "rgba(23,143,120,0.2)" : "rgba(232,105,74,0.2)"}`, textAlign: "left" }}>
                  <span style={{ fontSize: "16px" }}>{answers[i] === q.correct ? "✅" : "❌"}</span>
                  <span style={{ fontSize: "13px", color: "#1A2F4A", flex: 1 }}>{q.question}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRetry}
              style={{ padding: "12px 32px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #178F78, #3B82F6)", color: "#fff", fontFamily: "'Fredoka', sans-serif", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}
            >
              🔄 Retry Quiz
            </button>
          </div>
        )}

        {/* ── FLASHCARD MODE ── */}
        {mode === "flashcard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", color: "#6B7A99" }}>Card {fcIndex + 1} of {questions.length}</div>
              <div style={{ display: "flex", gap: "6px" }}>
                {questions.map((_, i) => (
                  <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === fcIndex ? "#178F78" : "#EDE8DF", transition: "background 0.2s" }} />
                ))}
              </div>
            </div>

            {/* 3D flip card */}
            <div
              onClick={() => setFlipped(f => !f)}
              style={{ cursor: "pointer", perspective: "1000px", height: "220px", marginBottom: "20px" }}
            >
              <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                {/* Front */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "linear-gradient(135deg, #F8FAFF, #EEF4FF)", border: "1.5px solid #D1DCF0", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>❓</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#1A2F4A", lineHeight: "1.5", marginBottom: "16px" }}>
                    {questions[fcIndex].question}
                  </div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", background: "rgba(59,130,246,0.1)", padding: "4px 12px", borderRadius: "20px" }}>
                    Tap to reveal answer
                  </div>
                </div>
                {/* Back */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #F0FBF8, #E6F9F4)", border: "1.5px solid #A7DDD4", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", marginBottom: "10px" }}>✅</div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#178F78", marginBottom: "10px" }}>
                    {questions[fcIndex].options[questions[fcIndex].correct]}
                  </div>
                  <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.5" }}>
                    {questions[fcIndex].explanation}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => { setFcIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
                disabled={fcIndex === 0}
                style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "1.5px solid #EDE8DF", background: "#fff", color: fcIndex === 0 ? "#C9D0D8" : "#1A2F4A", fontFamily: "'Quicksand', sans-serif", fontSize: "14px", fontWeight: 700, cursor: fcIndex === 0 ? "not-allowed" : "pointer" }}
              >
                ← Previous
              </button>
              <button
                onClick={() => { setFcIndex(i => Math.min(questions.length - 1, i + 1)); setFlipped(false); }}
                disabled={fcIndex === questions.length - 1}
                style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "none", background: fcIndex === questions.length - 1 ? "#EDE8DF" : "linear-gradient(135deg, #178F78, #3B82F6)", color: fcIndex === questions.length - 1 ? "#9CA3AF" : "#fff", fontFamily: "'Quicksand', sans-serif", fontSize: "14px", fontWeight: 700, cursor: fcIndex === questions.length - 1 ? "not-allowed" : "pointer" }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
