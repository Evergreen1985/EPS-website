"use client";
import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [show, setShow]           = useState(false);
  const [isIOS, setIsIOS]         = useState(false);
  const [isInstalled, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    // Detect iOS — iPhone/iPad/iPod OR iPad showing as Mac (iOS 13+ desktop UA)
    const ios = /iphone|ipad|ipod/i.test(ua) ||
                (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (standalone) { setInstalled(true); return; }

    // ?pwa_debug=1 forces the prompt for testing
    const forceShow = new URLSearchParams(window.location.search).get("pwa_debug") === "1";

    const dismissed = localStorage.getItem("pwa_dismissed");
    if (!forceShow && dismissed && Date.now() - Number(dismissed) < 7 * 864e5) return;

    if (ios) {
      // Show for all iOS browsers — Share→Add to Home Screen works in Safari, Chrome iOS, etc.
      setIsIOS(true);
      setShow(true);
      return;
    }

    // Check if prompt already captured globally before React mounted
    if ((window as any).__pwaPrompt) {
      setShow(true);
      return;
    }
    // Also listen for it arriving after mount
    const handler = () => setShow(true);
    window.addEventListener("pwa-prompt-ready", handler);
    return () => window.removeEventListener("pwa-prompt-ready", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa_dismissed", String(Date.now()));
    setShow(false);
    setShowGuide(false);
  };

  const install = async () => {
    const prompt = (window as any).__pwaPrompt;
    if (!prompt) { setShowGuide(true); return; }
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setShow(false);
  };

  if (isInstalled) return null;

  // iOS guide modal
  if (showGuide || (show && isIOS)) return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "flex-end",
      fontFamily: "'Quicksand',sans-serif",
      WebkitTapHighlightColor: "transparent",
    }}>
      {/* tap backdrop to close */}
      <div style={{ position: "absolute", inset: 0, cursor: "pointer" }}
           onClick={dismiss} />
      <div style={{
        position: "relative", width: "100%", background: "white",
        borderRadius: "24px 24px 0 0", padding: "20px 20px 36px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div style={{ fontWeight: 700, fontSize: "17px", color: "#1A2F4A" }}>🌿 Add to Home Screen</div>
          <button
            onClick={dismiss}
            style={{
              minWidth: "44px", minHeight: "44px", borderRadius: "50%",
              background: "#F5F5F5", border: "none", fontSize: "18px",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "#6B7A99",
              WebkitAppearance: "none", touchAction: "manipulation",
            }}>✕</button>
        </div>
        <div style={{ fontSize: "13px", color: "#6B7A99", marginBottom: "18px" }}>
          Follow these steps in Safari to install the app:
        </div>
        {[
          { icon: "1️⃣", text: <>Tap the <strong>Share</strong> button <strong>⬆</strong> at the bottom of Safari</> },
          { icon: "2️⃣", text: <>Scroll down and tap <strong>"Add to Home Screen"</strong></> },
          { icon: "3️⃣", text: <>Tap <strong>"Add"</strong> — the Evergreen app icon appears on your home screen!</> },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "#EEF8F6", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: "22px", flexShrink: 0,
            }}>{s.icon}</div>
            <div style={{ fontSize: "14px", color: "#1A2F4A", paddingTop: "10px", lineHeight: "1.5" }}>{s.text}</div>
          </div>
        ))}
        <div style={{ fontSize: "12px", color: "#9CA8BB", textAlign: "center", margin: "8px 0 12px" }}>
          After adding, open from your home screen for the full app experience
        </div>
        <button
          onClick={() => { setShow(false); setShowGuide(false); }}
          style={{
            width: "100%", padding: "15px",
            borderRadius: "14px", border: "none", background: "#F0F0F0",
            fontSize: "15px", fontWeight: 600, color: "#6B7A99",
            cursor: "pointer", touchAction: "manipulation",
            WebkitAppearance: "none",
          }}>
          Dismiss
        </button>
      </div>
    </div>
  );

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: "white", borderTop: "1px solid #EDE8DF",
      boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
      padding: "16px 20px 24px",
      fontFamily: "'Quicksand',sans-serif",
    }}>
      <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", gap: "14px", alignItems: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#178F78", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>🌿</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#1A2F4A" }}>Install Evergreen App</div>
          <div style={{ fontSize: "12px", color: "#6B7A99", marginTop: "2px" }}>Works offline • Push notifications • Home screen shortcut</div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <button onClick={dismiss}
            style={{ padding: "9px 14px", borderRadius: "12px", border: "1px solid #EDE8DF", background: "white", fontSize: "12px", fontWeight: 600, color: "#6B7A99", cursor: "pointer" }}>
            Later
          </button>
          <button onClick={install}
            style={{ padding: "9px 16px", borderRadius: "12px", border: "none", background: "#178F78", fontSize: "13px", fontWeight: 700, color: "white", cursor: "pointer", boxShadow: "0 3px 10px rgba(23,143,120,0.3)" }}>
            Install ↓
          </button>
        </div>
      </div>
    </div>
  );
}
