import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7C3AED",
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
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
