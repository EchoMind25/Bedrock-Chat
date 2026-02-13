"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Legend,
} from "recharts";
import type { ScreenTimeEntry } from "@/lib/types/family";

interface ScreenTimeChartProps {
  data: ScreenTimeEntry[];
  height?: number;
}

const COLORS = {
  active: "#3b82f6",
  idle: "#94a3b8",
  voice: "#8b5cf6",
};

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function minutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function ScreenTimeChart({
  data,
  height = 350,
}: ScreenTimeChartProps) {
  const chartData = useMemo(() => {
    return data.map((entry) => ({
      date: formatDateLabel(entry.date),
      "Active Time": entry.activeMinutes,
      "Idle Time": entry.idleMinutes,
      "Voice Time": entry.voiceTotalMinutes,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-12 text-sm"
        style={{ color: "var(--pd-text-muted)", height }}
      >
        No screen time data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--pd-border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "var(--pd-text-muted)" }}
          axisLine={{ stroke: "var(--pd-border)" }}
          tickLine={{ stroke: "var(--pd-border)" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--pd-text-muted)" }}
          axisLine={{ stroke: "var(--pd-border)" }}
          tickLine={{ stroke: "var(--pd-border)" }}
          tickFormatter={(value: number) => {
            const hours = Math.round(value / 60);
            return `${hours}h`;
          }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--pd-surface)",
            border: "1px solid var(--pd-border)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--pd-text)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
          labelStyle={{
            color: "var(--pd-text)",
            fontWeight: 600,
            marginBottom: "4px",
          }}
          formatter={(value: number | undefined) => [minutesToHours(value ?? 0), undefined]}
        />
        <Legend
          wrapperStyle={{ fontSize: "13px", color: "var(--pd-text-secondary)" }}
        />
        <Bar
          dataKey="Active Time"
          stackId="time"
          fill={COLORS.active}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Idle Time"
          stackId="time"
          fill={COLORS.idle}
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="Voice Time"
          stackId="time"
          fill={COLORS.voice}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export type { ScreenTimeChartProps };
