"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TransportStaffView  from "@/components/TransportStaffView";
import TransportParentView from "@/components/TransportParentView";

export default function TransportPage() {
  const router = useRouter();
  const [role, setRole]       = useState<"staff" | "parent" | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setRole("staff"); setSession(data); return; }
        const ps = localStorage.getItem("ep_parent_session");
        if (ps) {
          const s = JSON.parse(ps);
          if (Date.now() - s.loginTime < 7 * 24 * 60 * 60 * 1000) { setRole("parent"); setSession(s); return; }
          localStorage.removeItem("ep_parent_session");
        }
        const ts = localStorage.getItem("ep_teacher_session");
        if (ts) { setRole("staff"); setSession(JSON.parse(ts)); return; }
        router.replace("/");
      })
      .catch(() => router.replace("/"));
  }, [router]);

  if (!role) return (
    <div style={{ minHeight: "100vh", background: "#FEFCF8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #EDE8DF", borderTopColor: "#178F78", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#6B7A99" }}>Loading…</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#FEFCF8", fontFamily: "'Quicksand',sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#178F78,#0f6b5a)", padding: "14px 20px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Fredoka',sans-serif", fontSize: "18px", fontWeight: 700, color: "white" }}>🚌 Transportation</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>
              {role === "staff" ? `Staff · ${session?.name || session?.email || ""}` : `Parent · ${session?.phone || ""}`}
            </div>
          </div>
          <button onClick={() => router.back()}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "20px", padding: "6px 14px", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            ← Back
          </button>
        </div>
      </div>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px" }}>
        {role === "staff"  && <TransportStaffView  session={session} />}
        {role === "parent" && <TransportParentView session={session} />}
      </div>
    </div>
  );
}
