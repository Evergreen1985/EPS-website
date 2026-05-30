"use client";
import { usePathname } from "next/navigation";

const FULLSCREEN_PAGES = [
  "/",
  "/ai-tools",
  "/admin",
  "/owner",
  "/owner-login",
  "/parent-dashboard",
  "/teacher-dashboard",
];

export default function FooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = FULLSCREEN_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (hide) return null;
  return <>{children}</>;
}
