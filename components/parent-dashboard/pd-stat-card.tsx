"use client";

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PdCard } from "./pd-card";

type ColorScheme = "blue" | "green" | "amber" | "red" | "gray";

interface PdStatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "flat";
  };
  colorScheme?: ColorScheme;
}

const colorSchemeStyles: Record<
  ColorScheme,
  { bg: string; text: string; trendUp: string; trendDown: string }
> = {
  blue: {
    bg: "var(--pd-primary-light)",
    text: "var(--pd-primary)",
    trendUp: "var(--pd-success)",
    trendDown: "var(--pd-danger)",
  },
  green: {
    bg: "var(--pd-success-light)",
    text: "var(--pd-success)",
    trendUp: "var(--pd-success)",
    trendDown: "var(--pd-danger)",
  },
  amber: {
    bg: "var(--pd-warning-light)",
    text: "var(--pd-warning)",
    trendUp: "var(--pd-warning)",
    trendDown: "var(--pd-success)",
  },
  red: {
    bg: "var(--pd-danger-light)",
    text: "var(--pd-danger)",
    trendUp: "var(--pd-danger)",
    trendDown: "var(--pd-success)",
  },
  gray: {
    bg: "var(--pd-bg-secondary)",
    text: "var(--pd-text-muted)",
    trendUp: "var(--pd-success)",
    trendDown: "var(--pd-danger)",
  },
};

export function PdStatCard({
  icon,
  value,
  label,
  trend,
  colorScheme = "blue",
}: PdStatCardProps) {
  const colors = colorSchemeStyles[colorScheme];

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
        ? TrendingDown
        : Minus;

  const trendColor =
    trend?.direction === "up"
      ? colors.trendUp
      : trend?.direction === "down"
        ? colors.trendDown
        : "var(--pd-text-muted)";

  return (
    <PdCard>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: colors.bg, color: colors.text }}
          >
            {icon}
          </div>
          <div className="mt-2">
            <p
              className="text-2xl font-bold"
              style={{ color: "var(--pd-text)" }}
            >
              {value}
            </p>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--pd-text-muted)" }}
            >
              {label}
            </p>
          </div>
        </div>
        {trend && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium"
            style={{ color: trendColor }}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </PdCard>
  );
}

export type { PdStatCardProps, ColorScheme };
