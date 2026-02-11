"use client";

import { motion } from "motion/react";
import { ScrollText } from "lucide-react";
import * as Icons from "lucide-react";
import { Avatar } from "../../ui/avatar/avatar";
import type { AuditLogEntry } from "../../../lib/types/moderation";
import { getAuditLogActionName, getAuditLogActionIcon, formatAuditLogChanges } from "../../../lib/types/moderation";

interface AuditLogListProps {
  logs: AuditLogEntry[];
}

export function AuditLogList({ logs }: AuditLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No audit log entries</p>
        <p className="text-sm mt-1">Server actions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const iconName = getAuditLogActionIcon(log.action);
        const Icon = (Icons as any)[iconName] || Icons.FileText;

        return (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg border border-white/10 bg-white/5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {getAuditLogActionName(log.action)}
                  </span>
                  {log.targetName && (
                    <span className="text-sm text-white/60">
                      • {log.targetName}
                    </span>
                  )}
                </div>

                {log.changes && (
                  <div className="text-sm text-white/60 mb-1">
                    {formatAuditLogChanges(log.changes)}
                  </div>
                )}

                {log.reason && (
                  <div className="text-sm mb-1">
                    <span className="text-white/60">Reason:</span> {log.reason}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Avatar
                    src={log.actorAvatar}
                    fallback={log.actorUsername.slice(0, 2).toUpperCase()}
                    size="xs"
                  />
                  <span className="text-xs text-white/40">
                    {log.actorUsername} • {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
