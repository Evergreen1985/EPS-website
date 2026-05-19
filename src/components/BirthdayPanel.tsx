"use client";
import { useState, useEffect } from "react";

interface Child {
  id: string;
  child_name: string;
  dob: string;
  section_name: string;
  program_label: string;
  parent_name: string;
  phone: string;
  daysUntil: number;
  isToday: boolean;
  age: number;
  nextBirthday: string;
  month: number;
}

const MONTHS = ["All","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function BirthdayPanel({ days = 30 }: { days?: number }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading]   = useState(true);
  const [window_, setWindow]    = useState(days);
  const [month, setMonth]       = useState(0);

  const load = () => {
    setLoading(true);
    const url = month > 0 ? `/api/birthdays?month=${month}` : `/api/birthdays?days=${window_}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setChildren(Array.isArray(d) ? d : []))
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [window_, month]);

  const today    = children.filter(c => c.isToday);
  const upcoming = children.filter(c => !c.isToday);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "20px", fontWeight: 700, color: "#178F78" }}>🎂 Birthday Reminders</div>
          <div style={{ fontSize: "12px", color: "#6B7A99" }}>{today.length} today · {upcoming.length} upcoming</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <select value={month} onChange={e => { setMonth(Number(e.target.value)); setWindow(30); }}
            style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "7px 12px", fontSize: "12px", color: "#1A2F4A", outline: "none", cursor: "pointer" }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m === "All" ? "By Days" : m}</option>)}
          </select>
          {month === 0 && (
            <select value={window_} onChange={e => setWindow(Number(e.target.value))}
              style={{ border: "1px solid #EDE8DF", borderRadius: "10px", padding: "7px 12px", fontSize: "12px", color: "#1A2F4A", outline: "none", cursor: "pointer" }}>
              <option value={7}>Next 7 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={365}>Full year</option>
            </select>
          )}
        </div>
      </div>

      {today.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,rgba(245,184,41,0.15),rgba(232,105,74,0.1))", border: "1px solid rgba(245,184,41,0.3)", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#B08000", marginBottom: "10px" }}>🎉 Birthdays Today!</div>
          {today.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: "1px solid rgba(245,184,41,0.2)" }}>
              <div style={{ fontSize: "28px" }}>🎂</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{c.child_name} turns {c.age + 1}!</div>
                <div style={{ fontSize: "11px", color: "#6B7A99" }}>{c.section_name || c.program_label} · {c.parent_name}</div>
              </div>
              {c.phone && (
                <a href={`https://wa.me/${c.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: "#25D366", color: "white", borderRadius: "8px", padding: "5px 10px", fontSize: "11px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                  WhatsApp 🎁
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99" }}>Loading…</div>
      ) : upcoming.length === 0 && today.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B7A99", border: "1px dashed #EDE8DF", borderRadius: "16px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🎂</div>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>No birthdays in this period</div>
          <div style={{ fontSize: "11px" }}>Make sure children have DOB recorded in enquiries.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {upcoming.map(c => (
            <div key={c.id} style={{ border: "1px solid #EDE8DF", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: c.daysUntil <= 7 ? "rgba(232,105,74,0.1)" : "rgba(23,143,120,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "18px" }}>🎂</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>{c.child_name}</div>
                <div style={{ fontSize: "11px", color: "#6B7A99" }}>{c.section_name || c.program_label} · turns {c.age + 1}</div>
                <div style={{ fontSize: "10px", color: "#9CA3AF", marginTop: "2px" }}>
                  {new Date(c.nextBirthday).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} · {c.parent_name}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "16px", color: c.daysUntil <= 7 ? "#E8694A" : "#6B7A99" }}>{c.daysUntil}d</div>
                <div style={{ fontSize: "10px", color: "#9CA3AF" }}>to go</div>
              </div>
              {c.phone && c.daysUntil <= 7 && (
                <a href={`https://wa.me/${c.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: "#25D366", color: "white", borderRadius: "8px", padding: "5px 10px", fontSize: "10px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>
                  Wish 🎁
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
