"use client";

import { Check } from "lucide-react";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";

interface MonitoringLevelSelectorProps {
  currentLevel: MonitoringLevel;
  onLevelChange: (level: MonitoringLevel) => void;
  teenName?: string;
}

export function MonitoringLevelSelector({
  currentLevel,
  onLevelChange,
  teenName,
}: MonitoringLevelSelectorProps) {
  const levels = Object.values(MONITORING_LEVELS);

  return (
    <div>
      {teenName && (
        <p
          className="mb-4 text-sm"
          style={{ color: "var(--pd-text-muted)" }}
        >
          Select a monitoring level for {teenName}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((levelInfo) => {
          const isActive = currentLevel === levelInfo.level;
          return (
            <button
              key={levelInfo.level}
              type="button"
              onClick={() => onLevelChange(levelInfo.level)}
              className="relative rounded-lg p-5 text-left transition-all"
              style={{
                border: isActive
                  ? "2px solid var(--pd-primary)"
                  : "2px solid var(--pd-border)",
                background: isActive
                  ? "var(--pd-primary-light)"
                  : "var(--pd-surface)",
                color: "var(--pd-text)",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--pd-border-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "var(--pd-border)";
                }
              }}
            >
              {isActive && (
                <div
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: "var(--pd-primary)",
                    color: "white",
                  }}
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div
                className="mb-2 text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--pd-text-muted)" }}
              >
                Level {levelInfo.level}
              </div>
              <h3 className="text-lg font-semibold">{levelInfo.name}</h3>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--pd-text-secondary)" }}
              >
                {levelInfo.description}
              </p>
              <ul className="mt-4 space-y-2">
                {levelInfo.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--pd-text-secondary)" }}
                  >
                    <span
                      className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        background: isActive
                          ? "var(--pd-primary)"
                          : "var(--pd-text-muted)",
                      }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export type { MonitoringLevelSelectorProps };
