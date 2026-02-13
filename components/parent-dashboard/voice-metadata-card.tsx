"use client";

import { useState } from "react";
import {
  Mic,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { PdCard } from "./pd-card";
import type { VoiceCallMetadata } from "@/lib/types/family";

interface VoiceMetadataCardProps {
  call: VoiceCallMetadata;
  onViewDetails?: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function VoiceMetadataCard({
  call,
  onViewDetails,
}: VoiceMetadataCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <PdCard hoverable>
      {/* Main Info */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--pd-accent)",
            color: "var(--pd-primary)",
          }}
        >
          <Mic className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className="truncate text-sm font-semibold"
              style={{ color: "var(--pd-text)" }}
            >
              {call.channelName}
            </h4>
            <span
              className="text-xs"
              style={{ color: "var(--pd-text-muted)" }}
            >
              in {call.serverName}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--pd-text-secondary)" }}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDateTime(call.startTime)}</span>
            </div>
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--pd-text-secondary)" }}
            >
              <span className="font-medium">
                {formatDuration(call.duration)}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--pd-text-secondary)" }}
            >
              <Users className="h-3.5 w-3.5" />
              <span>
                {call.participants.length} participant
                {call.participants.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="rounded-md p-1.5 transition-colors"
              style={{ color: "var(--pd-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--pd-primary)";
                e.currentTarget.style.background = "var(--pd-primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--pd-text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
              aria-label="View details"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-md p-1.5 transition-colors"
            style={{ color: "var(--pd-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--pd-bg-secondary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Participants */}
      {isExpanded && (
        <div className="mt-4">
          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--pd-border)" }}
          >
            <h5
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--pd-text-muted)" }}
            >
              Participants
            </h5>
            <div className="space-y-2">
              {call.participants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: "var(--pd-bg-secondary)" }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--pd-text)" }}
                    >
                      {participant.displayName}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--pd-text-muted)" }}
                    >
                      @{participant.username}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-xs"
                      style={{ color: "var(--pd-text-secondary)" }}
                    >
                      {formatTime(participant.joinedAt)} -{" "}
                      {formatTime(participant.leftAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div
            className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{
              background: "var(--pd-success-light)",
              color: "var(--pd-success)",
            }}
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <p className="text-xs font-medium">
              NO audio content is recorded or stored. Only metadata (time,
              duration, participants) is available.
            </p>
          </div>
        </div>
      )}
    </PdCard>
  );
}

export type { VoiceMetadataCardProps };
