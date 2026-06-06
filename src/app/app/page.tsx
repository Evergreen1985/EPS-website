import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Install the iVa App",
  description: "Download and install the iVa Android app for Evergreen Prep teachers and parents.",
};

// Hosted on GitHub Releases (free, no file-size cap; stable "latest" URL).
const APK_URL =
  "https://github.com/Evergreen1985/iVaApp/releases/latest/download/iVa-v1.0.1-test.apk";
const VERSION = "v1.0.1";
const SIZE = "≈ 51 MB";

const steps = [
  "Tap the Download button above. The file iVa-v1.0.1-test.apk will save to your phone.",
  "Open the downloaded file (from the notification, or Files → Downloads).",
  "Android will ask to allow installs from this source — tap Settings and turn on “Allow from this source”, then go back.",
  "Tap Install, then Open. Log in with your teacher or parent credentials.",
];

export default function InstallAppPage() {
  return (
    <main style={s.page}>
      <div style={s.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="iVa" style={s.logo} />
        <h1 style={s.h1}>Install the iVa App</h1>
        <p style={s.sub}>Evergreen Prep — for teachers &amp; parents · Android</p>

        <a href={APK_URL} download style={s.btn}>
          ⬇  Download APK ({VERSION})
        </a>
        <p style={s.meta}>{SIZE} · Android 8.0+ · safe to install</p>

        <div style={s.qrWrap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/iva-app-qr.png" alt="Scan to open this page on your phone" style={s.qr} />
          <p style={s.qrCap}>On a computer? Scan this with your phone camera to open this page there.</p>
        </div>

        <div style={s.stepsBox}>
          <h2 style={s.h2}>How to install</h2>
          <ol style={s.ol}>
            {steps.map((t, i) => (
              <li key={i} style={s.li}>{t}</li>
            ))}
          </ol>
        </div>

        <p style={s.note}>
          📱 This is the Android app. <strong>iPhone / iPad users</strong> don&apos;t need to install anything —
          just open the web app and log in from your browser.
        </p>
        <p style={s.foot}>If a teacher already has an older iVa installed, uninstall it first, then install this one.</p>
      </div>
    </main>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100dvh", background: "linear-gradient(160deg,#f5f3ff 0%,#eef2ff 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif", color: "#1e293b" },
  card: { width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, padding: "32px 24px", boxShadow: "0 12px 40px rgba(79,70,229,0.12)", textAlign: "center" },
  logo: { width: 64, height: 64, objectFit: "contain", marginBottom: 8 },
  h1: { fontSize: 26, fontWeight: 800, margin: "4px 0 2px" },
  sub: { fontSize: 14, color: "#64748b", margin: "0 0 22px" },
  btn: { display: "inline-block", width: "100%", boxSizing: "border-box", background: "#4f46e5", color: "#fff", fontSize: 17, fontWeight: 700, textDecoration: "none", padding: "16px 20px", borderRadius: 14, boxShadow: "0 6px 16px rgba(79,70,229,0.35)" },
  meta: { fontSize: 12.5, color: "#94a3b8", margin: "10px 0 0" },
  qrWrap: { marginTop: 24, paddingTop: 22, borderTop: "1px solid #eef2ff" },
  qr: { width: 200, height: 200, borderRadius: 12, border: "1px solid #e2e8f0" },
  qrCap: { fontSize: 12.5, color: "#64748b", margin: "10px auto 0", maxWidth: 320 },
  stepsBox: { textAlign: "left", marginTop: 24, background: "#f8fafc", borderRadius: 16, padding: "18px 20px", border: "1px solid #eef2ff" },
  h2: { fontSize: 15, fontWeight: 700, margin: "0 0 10px", color: "#334155" },
  ol: { margin: 0, paddingLeft: 20 },
  li: { fontSize: 14, lineHeight: 1.6, marginBottom: 8, color: "#475569" },
  note: { fontSize: 13, color: "#475569", marginTop: 20, lineHeight: 1.6, background: "#fefce8", border: "1px solid #fef08a", borderRadius: 12, padding: "12px 14px" },
  foot: { fontSize: 12, color: "#94a3b8", marginTop: 14, lineHeight: 1.5 },
};
