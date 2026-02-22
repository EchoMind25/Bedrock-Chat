"use client";

import { useAuthStore } from "@/store/auth.store";
import { BugReportWidget } from "./BugReportWidget";

export function BugReportWidgetWrapper() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BugReportWidget
      product="bedrock-chat"
      productName="Bedrock Chat"
      userId={user?.id ?? null}
      username={user?.username ?? user?.email ?? null}
      isAuthenticated={isAuthenticated}
      appVersion={process.env.NEXT_PUBLIC_APP_VERSION}
      theme={{ primaryColor: "#3b82f6" }}
    />
  );
}
