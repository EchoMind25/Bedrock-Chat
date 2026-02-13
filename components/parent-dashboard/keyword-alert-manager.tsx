"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";
import { PdCard } from "./pd-card";
import type { KeywordAlert, KeywordAlertMatch } from "@/lib/types/family";

interface KeywordAlertManagerProps {
  alerts: KeywordAlert[];
  matches: KeywordAlertMatch[];
  onAdd: (keyword: string, severity: "low" | "medium" | "high") => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onDismissMatch: (id: string) => void;
}

const severityConfig: Record<
  "low" | "medium" | "high",
  { label: string; bg: string; text: string }
> = {
  low: {
    label: "Low",
    bg: "var(--pd-primary-light)",
    text: "var(--pd-primary)",
  },
  medium: {
    label: "Medium",
    bg: "var(--pd-warning-light)",
    text: "var(--pd-warning)",
  },
  high: {
    label: "High",
    bg: "var(--pd-danger-light)",
    text: "var(--pd-danger)",
  },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function KeywordAlertManager({
  alerts,
  matches,
  onAdd,
  onRemove,
  onToggle,
  onDismissMatch,
}: KeywordAlertManagerProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newSeverity, setNewSeverity] = useState<"low" | "medium" | "high">(
    "medium",
  );

  const activeMatches = matches.filter((m) => !m.dismissed);

  const handleAdd = () => {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    onAdd(trimmed, newSeverity);
    setNewKeyword("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Keyword */}
      <PdCard>
        <h3
          className="mb-4 text-base font-semibold"
          style={{ color: "var(--pd-text)" }}
        >
          Add Keyword Alert
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--pd-text-muted)" }}
            />
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter keyword or phrase..."
              className="w-full rounded-lg py-2.5 pl-10 pr-3 text-sm"
              style={{
                border: "1px solid var(--pd-border)",
                background: "var(--pd-surface)",
                color: "var(--pd-text)",
              }}
            />
          </div>
          <select
            value={newSeverity}
            onChange={(e) =>
              setNewSeverity(e.target.value as "low" | "medium" | "high")
            }
            className="rounded-lg px-3 py-2.5 text-sm"
            style={{
              border: "1px solid var(--pd-border)",
              background: "var(--pd-surface)",
              color: "var(--pd-text)",
            }}
          >
            <option value="low">Low severity</option>
            <option value="medium">Medium severity</option>
            <option value="high">High severity</option>
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newKeyword.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
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
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </PdCard>

      {/* Alert List */}
      {alerts.length > 0 && (
        <PdCard>
          <h3
            className="mb-4 text-base font-semibold"
            style={{ color: "var(--pd-text)" }}
          >
            Active Alerts ({alerts.length})
          </h3>
          <div className="divide-y" style={{ borderColor: "var(--pd-border)" }}>
            {alerts.map((alert) => {
              const severity = severityConfig[alert.severity];
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggle(alert.id)}
                    className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                    style={{
                      background: alert.isActive
                        ? "var(--pd-primary)"
                        : "var(--pd-border)",
                    }}
                    aria-label={`Toggle ${alert.keyword} alert`}
                  >
                    <span
                      className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
                      style={{
                        transform: alert.isActive
                          ? "translateX(16px)"
                          : "translateX(0)",
                      }}
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-sm font-medium"
                        style={{
                          color: alert.isActive
                            ? "var(--pd-text)"
                            : "var(--pd-text-muted)",
                        }}
                      >
                        {alert.keyword}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          background: severity.bg,
                          color: severity.text,
                        }}
                      >
                        {severity.label}
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      {alert.matchCount} matches
                      {alert.lastMatchAt &&
                        ` - Last: ${formatDate(alert.lastMatchAt)}`}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => onRemove(alert.id)}
                    className="shrink-0 rounded-md p-1.5 transition-colors"
                    style={{ color: "var(--pd-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--pd-danger)";
                      e.currentTarget.style.background =
                        "var(--pd-danger-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--pd-text-muted)";
                      e.currentTarget.style.background = "transparent";
                    }}
                    aria-label={`Remove ${alert.keyword} alert`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </PdCard>
      )}

      {/* Recent Matches */}
      {activeMatches.length > 0 && (
        <PdCard>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: "var(--pd-warning)" }}
            />
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--pd-text)" }}
            >
              Recent Matches ({activeMatches.length})
            </h3>
          </div>
          <div className="space-y-3">
            {activeMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-start gap-3 rounded-lg p-3"
                style={{
                  background: "var(--pd-bg-secondary)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--pd-text)" }}
                    >
                      &ldquo;{match.keyword}&rdquo;
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      in #{match.channelName}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-sm italic"
                    style={{ color: "var(--pd-text-secondary)" }}
                  >
                    &ldquo;{match.snippet}&rdquo;
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--pd-text-muted)" }}
                  >
                    {match.serverName} - {formatDate(match.timestamp)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDismissMatch(match.id)}
                  className="shrink-0 rounded-md p-1 transition-colors"
                  style={{ color: "var(--pd-text-muted)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--pd-bg-secondary)";
                    e.currentTarget.style.color = "var(--pd-text)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--pd-text-muted)";
                  }}
                  aria-label="Dismiss match"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </PdCard>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="py-8 text-center">
          <Search
            className="mx-auto mb-3 h-8 w-8"
            style={{ color: "var(--pd-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--pd-text-muted)" }}>
            No keyword alerts configured. Add keywords above to get notified
            when they appear.
          </p>
        </div>
      )}
    </div>
  );
}

export type { KeywordAlertManagerProps };
