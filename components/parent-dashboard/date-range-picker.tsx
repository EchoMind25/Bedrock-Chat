"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

type DateRangeValue = "7d" | "14d" | "30d" | "90d" | "custom";

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange?: (start: string, end: string) => void;
}

const presets: { value: DateRangeValue; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "14d", label: "14d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "custom", label: "Custom" },
];

export function DateRangePicker({
  value,
  onChange,
  customStart = "",
  customEnd = "",
  onCustomChange,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value === "custom");

  const handlePresetClick = (preset: DateRangeValue) => {
    if (preset === "custom") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
    }
    onChange(preset);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "var(--pd-bg-secondary)" }}>
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetClick(preset.value)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              background:
                value === preset.value ? "var(--pd-surface)" : "transparent",
              color:
                value === preset.value
                  ? "var(--pd-text)"
                  : "var(--pd-text-muted)",
              boxShadow:
                value === preset.value
                  ? "0 1px 2px rgba(0,0,0,0.05)"
                  : "none",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <Calendar
            className="h-4 w-4 shrink-0"
            style={{ color: "var(--pd-text-muted)" }}
          />
          <input
            type="date"
            value={customStart}
            onChange={(e) =>
              onCustomChange?.(e.target.value, customEnd)
            }
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              border: "1px solid var(--pd-border)",
              background: "var(--pd-surface)",
              color: "var(--pd-text)",
            }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--pd-text-muted)" }}
          >
            to
          </span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) =>
              onCustomChange?.(customStart, e.target.value)
            }
            className="rounded-md px-3 py-1.5 text-sm"
            style={{
              border: "1px solid var(--pd-border)",
              background: "var(--pd-surface)",
              color: "var(--pd-text)",
            }}
          />
        </div>
      )}
    </div>
  );
}

export type { DateRangePickerProps, DateRangeValue };
