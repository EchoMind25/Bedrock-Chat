"use client";

import { Shield, AlertTriangle } from "lucide-react";

interface PrivacyNoticeProps {
  message?: string;
  variant?: "info" | "warning";
}

const DEFAULT_MESSAGE =
  "All dashboard views are logged. Your teen can see when and what you access.";

export function PrivacyNotice({
  message = DEFAULT_MESSAGE,
  variant = "info",
}: PrivacyNoticeProps) {
  const isWarning = variant === "warning";

  const Icon = isWarning ? AlertTriangle : Shield;

  return (
    <div
      className="flex items-start gap-3 rounded-lg p-4"
      style={{
        border: `1px solid ${isWarning ? "var(--pd-warning)" : "var(--pd-primary)"}`,
        background: isWarning
          ? "var(--pd-warning-light)"
          : "var(--pd-primary-light)",
        color: isWarning ? "var(--pd-warning)" : "var(--pd-primary)",
      }}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export type { PrivacyNoticeProps };
