import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CommunityChatBubble from "@/components/CommunityChatBubble";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ThemeProvider from "@/components/ThemeProvider";
import { getSchoolConfig } from "@/lib/getSchoolConfig";

export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolConfig();
  return {
    title: `${school.name} | Preschool & Daycare in ${school.address.city}`,
    description: school.description,
    keywords: `preschool ${school.address.city.toLowerCase()}, daycare ${school.address.city.toLowerCase()}, nursery, junior kg, senior kg, ${school.name.toLowerCase()}`,
    openGraph: {
      title: school.name,
      description: school.tagline,
      url: school.domain,
      siteName: school.name,
      locale: "en_IN",
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const school = await getSchoolConfig();
  const fontFamily = school.theme.fontHeading === "Fredoka"
    ? "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap"
    : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(school.theme.fontHeading)}:wght@400;600;700&family=${encodeURIComponent(school.theme.fontBody)}:wght@400;500;600;700&display=swap`;

  return (
    <html lang="en">
      <head>
        <ThemeProvider />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={fontFamily} rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={school.theme.primaryColor} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={school.shortName} />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Capture beforeinstallprompt before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.__pwaPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaPrompt = e;
            window.dispatchEvent(new Event('pwa-prompt-ready'));
          });
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <ServiceWorkerRegistration />
        <Navbar />
        <main>{children}</main>
        <FooterWrapper><Footer /></FooterWrapper>
        <CommunityChatBubble />
        <WhatsAppButton />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
