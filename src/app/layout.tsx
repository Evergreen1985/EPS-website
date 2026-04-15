import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import site from "@/content/site.json";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  keywords: ["preschool", "daycare", "Bengaluru", "Electronic City", "Playgroup", "Nursery", "KG", "early childhood"],
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
  },
  metadataBase: new URL("https://evergreenpreschool.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
