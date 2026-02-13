"use client";

import { Users, Shield, Clock, Check, X } from "lucide-react";
import { PdCard } from "./pd-card";

interface ServerInfo {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  description?: string;
}

type ServerStatus = "active" | "restricted" | "pending";

interface ServerCardProps {
  server: ServerInfo;
  status: ServerStatus;
  onRestrict?: () => void;
  onUnrestrict?: () => void;
  onApprove?: () => void;
  onDeny?: () => void;
}

const statusConfig: Record<
  ServerStatus,
  { label: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    bg: "var(--pd-success-light)",
    text: "var(--pd-success)",
  },
  restricted: {
    label: "Restricted",
    bg: "var(--pd-danger-light)",
    text: "var(--pd-danger)",
  },
  pending: {
    label: "Pending",
    bg: "var(--pd-warning-light)",
    text: "var(--pd-warning)",
  },
};

export function ServerCard({
  server,
  status,
  onRestrict,
  onUnrestrict,
  onApprove,
  onDeny,
}: ServerCardProps) {
  const statusStyle = statusConfig[status];

  return (
    <PdCard hoverable>
      <div className="flex items-start gap-4">
        {/* Server Icon */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            background: "var(--pd-bg-secondary)",
            color: "var(--pd-text)",
          }}
        >
          {server.icon}
        </div>

        {/* Server Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="truncate text-base font-semibold"
              style={{ color: "var(--pd-text)" }}
            >
              {server.name}
            </h3>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                background: statusStyle.bg,
                color: statusStyle.text,
              }}
            >
              {statusStyle.label}
            </span>
          </div>

          <div
            className="mt-1 flex items-center gap-1 text-sm"
            style={{ color: "var(--pd-text-muted)" }}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{server.memberCount.toLocaleString()} members</span>
          </div>

          {server.description && (
            <p
              className="mt-2 line-clamp-2 text-sm"
              style={{ color: "var(--pd-text-secondary)" }}
            >
              {server.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            {status === "active" && onRestrict && (
              <button
                type="button"
                onClick={onRestrict}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--pd-danger)",
                  color: "var(--pd-danger)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--pd-danger-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Shield className="h-3 w-3" />
                Restrict
              </button>
            )}

            {status === "restricted" && onUnrestrict && (
              <button
                type="button"
                onClick={onUnrestrict}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  border: "1px solid var(--pd-success)",
                  color: "var(--pd-success)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--pd-success-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Check className="h-3 w-3" />
                Unrestrict
              </button>
            )}

            {status === "pending" && (
              <>
                {onApprove && (
                  <button
                    type="button"
                    onClick={onApprove}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    style={{ background: "var(--pd-success)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1";
                    }}
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                )}
                {onDeny && (
                  <button
                    type="button"
                    onClick={onDeny}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      border: "1px solid var(--pd-danger)",
                      color: "var(--pd-danger)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--pd-danger-light)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <X className="h-3 w-3" />
                    Deny
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PdCard>
  );
}

export type { ServerCardProps, ServerInfo, ServerStatus };
