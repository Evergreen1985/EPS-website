import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import WhatsAppButton from "@/components/WhatsAppButton";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: `${site.name} | Preschool & Daycare in Electronic City, Bengaluru`,
  description: `${site.name} is a leading preschool and daycare centre in Electronic City, Bengaluru. Rated ${site.rating.score}★ on Google.`,
  keywords: "preschool bengaluru, daycare electronic city, nursery bangalore, infant care bangalore, junior kg, senior kg, evergreen preschool",
  openGraph: {
    title: site.name,
    description: "Nurturing young minds through play-based learning in Electronic City, Bengaluru.",
    url: "https://evergreenprepschools.com",
    siteName: site.name,
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin:0, padding:0 }}>
        <Navbar />
        <main>{children}</main>
        <FooterWrapper />
        <WhatsAppButton />
      </body>
    </html>
  );
}
