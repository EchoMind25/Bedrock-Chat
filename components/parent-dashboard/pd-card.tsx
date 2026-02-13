"use client";

import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface PdCardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
} as const;

export function PdCard({
  children,
  className,
  hoverable = false,
  padding = "md",
}: PdCardProps) {
  return (
    <div
      className={cn(
        "pd-card",
        hoverable && "pd-card-hover",
        paddingMap[padding],
        className,
      )}
      style={{ background: "var(--pd-surface)", color: "var(--pd-text)" }}
    >
      {children}
    </div>
  );
}

export type { PdCardProps };
