"use client";
import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [prompt, setPrompt]   = useState<any>(null);
  const [show, setShow]       = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    // Already dismissed this session
    if (sessionStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
    setPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  };

  if (!show || installed || dismissed) return null;

  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "calc(100% - 32px)", maxWidth: "420px",
      background: "white", borderRadius: "20px", border: "1px solid rgba(23,143,120,0.25)",
      boxShadow: "0 8px 32px rgba(23,143,120,0.2)", padding: "14px 16px",
      display: "flex", alignItems: "center", gap: "12px",
    }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg,#178F78,#0f6b5a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>🌿</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1A2F4A" }}>Install Evergreen App</div>
        <div style={{ fontSize: "11px", color: "#6B7A99", marginTop: "2px" }}>Add to home screen — works offline</div>
      </div>
      <button onClick={install}
        style={{ background: "#178F78", color: "white", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
        Install
      </button>
      <button onClick={dismiss}
        style={{ background: "none", border: "none", color: "#9CA3AF", fontSize: "20px", cursor: "pointer", lineHeight: 1, flexShrink: 0, padding: "0 4px" }}>
        ×
      </button>
    </div>
  );
}
