/**
 * Layout for /download page providing static metadata.
 * The page itself is a client component, so metadata must live here.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download Bedrock Chat — Privacy-first communication",
  description:
    "Install Bedrock Chat as a web app or download the desktop client. No tracking, no ads — just private communication.",
};

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
