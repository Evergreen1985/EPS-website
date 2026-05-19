"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutAll() {
  const router = useRouter();

  useEffect(() => {
    // Clear all localStorage sessions
    localStorage.removeItem("ep_teacher_session");
    localStorage.removeItem("ep_parent_session");

    // Clear parent JWT cookie via API
    fetch("/api/auth/parent-logout", { method: "POST" }).finally(() => {
      router.replace("/");
    });
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Quicksand',sans-serif", background: "#F0F4F8" }}>
      <div style={{ textAlign: "center", color: "#6B7A99", fontSize: "14px" }}>
        Clearing all sessions…
      </div>
    </div>
  );
}
