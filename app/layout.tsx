import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
