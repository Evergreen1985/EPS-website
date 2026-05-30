"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ActivityPlanner from "@/components/ActivityPlanner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ActivityPlannerPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("ep_teacher_session") || "null");
      if (!s || (Date.now() - (s.loginTime || 0)) > 12 * 60 * 60 * 1000) {
        router.replace("/teacher-login");
      }
    } catch {
      router.replace("/teacher-login");
    }
  }, [router]);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0D1B2A 0%,#1A2F4A 40%,#0D2318 100%)", fontFamily:"'Quicksand',sans-serif" }}>
      <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:"12px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/ai-tools/teacher" style={{ display:"flex", alignItems:"center", gap:"6px", color:"rgba(255,255,255,0.6)", fontSize:"13px", textDecoration:"none", background:"rgba(255,255,255,0.08)", borderRadius:"20px", padding:"6px 12px" }}>
          <ArrowLeft style={{ width:"14px", height:"14px" }} /> Back to Tools
        </Link>
        <div style={{ fontFamily:"'Fredoka',sans-serif", fontSize:"16px", fontWeight:700, color:"white" }}>
          🎯 RAG Activity Planner
        </div>
        <div style={{ marginLeft:"auto", background:"rgba(23,143,120,0.2)", border:"1px solid rgba(23,143,120,0.4)", borderRadius:"20px", padding:"4px 12px", fontSize:"10px", color:"#7EFCE1", fontWeight:700 }}>
          Grounded in NCF-FS & Curriculum
        </div>
      </div>
      <div style={{ padding:"20px" }}>
        <ActivityPlanner />
      </div>
    </div>
  );
}
