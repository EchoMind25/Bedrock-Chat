"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  onClick?: () => void;
  label?: string;
}

export function ExportButton({
  onClick,
  label = "Export PDF",
}: ExportButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      style={{
        border: "1px solid var(--pd-border)",
        color: "var(--pd-text)",
        background: "var(--pd-surface)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--pd-border-hover)";
        e.currentTarget.style.background = "var(--pd-bg-secondary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--pd-border)";
        e.currentTarget.style.background = "var(--pd-surface)";
      }}
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}

export type { ExportButtonProps };
