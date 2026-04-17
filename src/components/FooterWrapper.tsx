"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

// These pages are full-screen — no footer or body scroll
const FULLSCREEN_PAGES = ["/", "/ai-tools"];

export default function FooterWrapper() {
  const pathname = usePathname();
  if (FULLSCREEN_PAGES.includes(pathname)) return null;
  return <Footer />;
}
