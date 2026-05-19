"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

// Hide footer only on full-screen snap-scroll and portal/dashboard pages
const FULLSCREEN_PAGES = [
  "/",                  // full-screen snap-scroll design — footer breaks layout
  "/ai-tools",
  "/admin",
  "/owner",
  "/owner-login",
  "/parent-dashboard",
  "/teacher-dashboard",
];

export default function FooterWrapper() {
  const pathname = usePathname();
  const hide = FULLSCREEN_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (hide) return null;
  return <Footer />;
}
