"use client";

import { useState, useEffect } from "react";
import { Clock, Trash2, Save } from "lucide-react";
import { PdCard } from "./pd-card";
import type { TimeLimitConfig } from "@/lib/types/family";

interface TimeLimitEditorProps {
  config: TimeLimitConfig | undefined;
  onChange: (config: TimeLimitConfig) => void;
  onRemove: () => void;
}

const DEFAULT_CONFIG: TimeLimitConfig = {
  dailyLimitMinutes: 120,
  weekdaySchedule: { start: "08:00", end: "21:00" },
  weekendSchedule: { start: "09:00", end: "22:00" },
  isActive: true,
};

function minutesToDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function TimeLimitEditor({
  config,
  onChange,
  onRemove,
}: TimeLimitEditorProps) {
  const [localConfig, setLocalConfig] = useState<TimeLimitConfig>(
    config || DEFAULT_CONFIG,
  );
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHasChanges(false);
    }
  }, [config]);

  const updateConfig = (updates: Partial<TimeLimitConfig>) => {
    setLocalConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onChange(localConfig);
    setHasChanges(false);
  };

  return (
    <PdCard>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              background: "var(--pd-primary-light)",
              color: "var(--pd-primary)",
            }}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--pd-text)" }}
            >
              Time Limits
            </h3>
            <p
              className="text-sm"
              style={{ color: "var(--pd-text-muted)" }}
            >
              Set daily usage limits and schedules
            </p>
          </div>
        </div>

        {/* Active Toggle */}
        <button
          type="button"
          onClick={() => updateConfig({ isActive: !localConfig.isActive })}
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{
            background: localConfig.isActive
              ? "var(--pd-primary)"
              : "var(--pd-border)",
          }}
          aria-label="Toggle time limits"
        >
          <span
            className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform"
            style={{
              transform: localConfig.isActive
                ? "translateX(20px)"
                : "translateX(0)",
            }}
          />
        </button>
      </div>

      <div
        className="space-y-5"
        style={{ opacity: localConfig.isActive ? 1 : 0.5 }}
      >
        {/* Daily Limit Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-medium"
              style={{ color: "var(--pd-text)" }}
            >
              Daily Limit
            </label>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--pd-primary)" }}
            >
              {minutesToDisplay(localConfig.dailyLimitMinutes)}
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={1440}
            step={15}
            value={localConfig.dailyLimitMinutes}
            onChange={(e) =>
              updateConfig({ dailyLimitMinutes: parseInt(e.target.value) })
            }
            disabled={!localConfig.isActive}
            className="w-full accent-(--pd-primary)"
          />
          <div
            className="flex justify-between text-xs mt-1"
            style={{ color: "var(--pd-text-muted)" }}
          >
            <span>15 min</span>
            <span>24h</span>
          </div>
        </div>

        {/* Weekday Schedule */}
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            style={{ color: "var(--pd-text)" }}
          >
            Weekday Schedule
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Start
              </label>
              <input
                type="time"
                value={localConfig.weekdaySchedule?.start || "08:00"}
                onChange={(e) =>
                  updateConfig({
                    weekdaySchedule: {
                      start: e.target.value,
                      end: localConfig.weekdaySchedule?.end || "21:00",
                    },
                  })
                }
                disabled={!localConfig.isActive}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: "1px solid var(--pd-border)",
                  background: "var(--pd-surface)",
                  color: "var(--pd-text)",
                }}
              />
            </div>
            <span
              className="mt-5 text-sm"
              style={{ color: "var(--pd-text-muted)" }}
            >
              to
            </span>
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--pd-text-muted)" }}
              >
                End
              </label>
              <input
                type="time"
                value={localConfig.weekdaySchedule?.end || "21:00"}
                onChange={(e) =>
                  updateConfig({
                    weekdaySchedule: {
                      start: localConfig.weekdaySchedule?.start || "08:00",
                      end: e.target.value,
                    },
                  })
                }
                disabled={!localConfig.isActive}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: "1px solid var(--pd-border)",
                  background: "var(--pd-surface)",
                  color: "var(--pd-text)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Weekend Schedule */}
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            style={{ color: "var(--pd-text)" }}
          >
            Weekend Schedule
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Start
              </label>
              <input
                type="time"
                value={localConfig.weekendSchedule?.start || "09:00"}
                onChange={(e) =>
                  updateConfig({
                    weekendSchedule: {
                      start: e.target.value,
                      end: localConfig.weekendSchedule?.end || "22:00",
                    },
                  })
                }
                disabled={!localConfig.isActive}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: "1px solid var(--pd-border)",
                  background: "var(--pd-surface)",
                  color: "var(--pd-text)",
                }}
              />
            </div>
            <span
              className="mt-5 text-sm"
              style={{ color: "var(--pd-text-muted)" }}
            >
              to
            </span>
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--pd-text-muted)" }}
              >
                End
              </label>
              <input
                type="time"
                value={localConfig.weekendSchedule?.end || "22:00"}
                onChange={(e) =>
                  updateConfig({
                    weekendSchedule: {
                      start: localConfig.weekendSchedule?.start || "09:00",
                      end: e.target.value,
                    },
                  })
                }
                disabled={!localConfig.isActive}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  border: "1px solid var(--pd-border)",
                  background: "var(--pd-surface)",
                  color: "var(--pd-text)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="mt-6 flex items-center justify-between border-t pt-4"
        style={{ borderColor: "var(--pd-border)" }}
      >
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: "var(--pd-danger)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--pd-danger-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Trash2 className="h-4 w-4" />
          Remove Limits
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: "var(--pd-primary)" }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.background = "var(--pd-primary-hover)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--pd-primary)";
          }}
        >
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>
    </PdCard>
  );
}

export type { TimeLimitEditorProps };
