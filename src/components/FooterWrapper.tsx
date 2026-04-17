"use client";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  // Homepage uses full-screen scroll snap — no footer needed
  if (pathname === "/") return null;
  return <Footer />;
}
