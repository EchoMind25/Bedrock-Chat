import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono, Merriweather } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { GlobalEntranceTransition } from "@/components/transitions/global-entrance-transition";
import "./globals.css";

// Self-host fonts via next/font — downloaded at build time, ZERO runtime
// requests to fonts.googleapis.com. This is critical for privacy.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-merriweather",
  weight: ["400", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#7C3AED",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Bedrock Chat - Privacy-First Communication Platform",
  description:
    "Privacy-first communication that Discord wishes it was. No government IDs. No facial scans. No tracking. End-to-end encrypted conversations that respect your rights.",
  keywords: [
    "privacy",
    "chat",
    "discord alternative",
    "encrypted messaging",
    "secure communication",
  ],
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bedrock Chat",
  },
  openGraph: {
    title: "Bedrock Chat - Privacy-First Communication",
    description:
      "Take back your privacy with a communication platform that actually respects your rights.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased touch-manipulation">
        <ServiceWorkerRegister />
        {children}
        <ConsentBanner />
        <GlobalEntranceTransition />
      </body>
    </html>
  );
}
