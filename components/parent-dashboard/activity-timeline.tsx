"use client";

import { useState, useMemo } from "react";
import {
  Eye,
  Users,
  Server,
  Flag,
  Shield,
  CheckCircle,
  XCircle,
  Bell,
  Clock,
  Download,
  Lock,
  Mic,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type {
  TransparencyLogEntry,
  TransparencyLogAction,
} from "@/lib/types/family";

interface ActivityTimelineProps {
  entries: TransparencyLogEntry[];
  maxEntries?: number;
  loading?: boolean;
}

const actionIcons: Record<TransparencyLogAction, typeof Eye> = {
  viewed_messages: Eye,
  viewed_friends: Users,
  viewed_servers: Server,
  viewed_flags: Flag,
  changed_monitoring_level: Shield,
  approved_server: CheckCircle,
  denied_server: XCircle,
  approved_friend: CheckCircle,
  denied_friend: XCircle,
  added_keyword_alert: Bell,
  removed_keyword_alert: Bell,
  changed_time_limit: Clock,
  blocked_category: Lock,
  unblocked_category: Lock,
  viewed_voice_metadata: Mic,
  exported_activity_log: Download,
  changed_data_retention: Clock,
  restricted_server: Lock,
  unrestricted_server: Lock,
  viewed_presence: Eye,
};

function getActionColor(action: TransparencyLogAction): string {
  if (action.startsWith("viewed_")) return "var(--pd-primary)";
  if (action.startsWith("approved_")) return "var(--pd-success)";
  if (action.startsWith("denied_") || action.startsWith("restricted") || action.startsWith("blocked"))
    return "var(--pd-danger)";
  if (action.startsWith("changed_")) return "var(--pd-warning)";
  if (action.startsWith("added_")) return "var(--pd-success)";
  if (action.startsWith("removed_") || action.startsWith("unrestricted") || action.startsWith("unblocked"))
    return "var(--pd-text-muted)";
  return "var(--pd-text-muted)";
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ActivityTimeline({
  entries,
  maxEntries = 20,
  loading = false,
}: ActivityTimelineProps) {
  const [showAll, setShowAll] = useState(false);

  const displayEntries = showAll ? entries : entries.slice(0, maxEntries);
  const hasMore = entries.length > maxEntries && !showAll;

  const groupedEntries = useMemo(() => {
    const groups: Record<string, TransparencyLogEntry[]> = {};
    for (const entry of displayEntries) {
      const dateKey = formatRelativeDate(new Date(entry.timestamp));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    }
    return groups;
  }, [displayEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: "var(--pd-text-muted)" }}
        />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock
          className="mx-auto mb-3 h-8 w-8"
          style={{ color: "var(--pd-text-muted)" }}
        />
        <p className="text-sm" style={{ color: "var(--pd-text-muted)" }}>
          No activity recorded yet
        </p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(groupedEntries).map(([dateLabel, dateEntries]) => (
        <div key={dateLabel} className="mb-6 last:mb-0">
          <h4
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--pd-text-muted)" }}
          >
            {dateLabel}
          </h4>
          <div className="relative ml-3 space-y-0">
            {/* Vertical line */}
            <div
              className="absolute bottom-0 left-0 top-0 w-px"
              style={{ background: "var(--pd-border)" }}
            />

            {dateEntries.map((entry) => {
              const entryDate = new Date(entry.timestamp);
              const IconComponent = actionIcons[entry.action] || Eye;
              const iconColor = getActionColor(entry.action);

              return (
                <div
                  key={entry.id}
                  className="relative flex items-start gap-3 pb-4 pl-6"
                >
                  {/* Dot on the line */}
                  <div
                    className="absolute left-0 top-1.5 -translate-x-1/2"
                  >
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{
                        background: "var(--pd-surface)",
                        border: `2px solid ${iconColor}`,
                      }}
                    >
                      <IconComponent
                        className="h-3 w-3"
                        style={{ color: iconColor }}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{ color: "var(--pd-text)" }}
                    >
                      {entry.details}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      {formatTime(entryDate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition-colors"
          style={{ color: "var(--pd-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--pd-primary-light)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Show more
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export type { ActivityTimelineProps };
