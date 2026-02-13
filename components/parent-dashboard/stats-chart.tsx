"use client";

import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
  Area,
} from "recharts";

interface YKeyConfig {
  key: string;
  color: string;
  label: string;
}

interface StatsChartProps {
  data: Record<string, unknown>[];
  type: "bar" | "line" | "area";
  xKey: string;
  yKeys: YKeyConfig[];
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
}

export function StatsChart({
  data,
  type,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showTooltip = true,
}: StatsChartProps) {
  const commonAxisProps = {
    tick: { fontSize: 12, fill: "var(--pd-text-muted)" },
    axisLine: { stroke: "var(--pd-border)" },
    tickLine: { stroke: "var(--pd-border)" },
  };

  const gridProps = showGrid
    ? {
        strokeDasharray: "3 3",
        stroke: "var(--pd-border)",
        vertical: false,
      }
    : undefined;

  const tooltipProps = showTooltip
    ? {
        contentStyle: {
          background: "var(--pd-surface)",
          border: "1px solid var(--pd-border)",
          borderRadius: "8px",
          fontSize: "13px",
          color: "var(--pd-text)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
        labelStyle: {
          color: "var(--pd-text)",
          fontWeight: 600,
          marginBottom: "4px",
        },
        itemStyle: { color: "var(--pd-text-secondary)" },
      }
    : undefined;

  const renderChart = () => {
    if (type === "bar") {
      return (
        <BarChart data={data}>
          {gridProps && <CartesianGrid {...gridProps} />}
          <XAxis dataKey={xKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          {tooltipProps && <Tooltip {...tooltipProps} />}
          {yKeys.map((yKey) => (
            <Bar
              key={yKey.key}
              dataKey={yKey.key}
              name={yKey.label}
              fill={yKey.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }

    if (type === "line") {
      return (
        <LineChart data={data}>
          {gridProps && <CartesianGrid {...gridProps} />}
          <XAxis dataKey={xKey} {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          {tooltipProps && <Tooltip {...tooltipProps} />}
          {yKeys.map((yKey) => (
            <Line
              key={yKey.key}
              type="monotone"
              dataKey={yKey.key}
              name={yKey.label}
              stroke={yKey.color}
              strokeWidth={2}
              dot={{ r: 3, fill: yKey.color }}
              activeDot={{ r: 5, fill: yKey.color }}
            />
          ))}
        </LineChart>
      );
    }

    return (
      <AreaChart data={data}>
        {gridProps && <CartesianGrid {...gridProps} />}
        <XAxis dataKey={xKey} {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        {tooltipProps && <Tooltip {...tooltipProps} />}
        {yKeys.map((yKey) => (
          <Area
            key={yKey.key}
            type="monotone"
            dataKey={yKey.key}
            name={yKey.label}
            stroke={yKey.color}
            fill={yKey.color}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}

export type { StatsChartProps, YKeyConfig };
