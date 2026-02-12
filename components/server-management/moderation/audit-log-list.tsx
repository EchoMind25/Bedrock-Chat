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
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <ScrollText className="w-8 h-8 text-slate-500" />
        </div>
        <h4 className="text-lg font-semibold text-slate-200 mb-2">No audit log entries</h4>
        <p className="text-sm text-slate-400">Server actions will appear here</p>
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
            className="p-4 rounded-lg border border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/20">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-100">
                    {getAuditLogActionName(log.action)}
                  </span>
                  {log.targetName && (
                    <span className="text-sm text-slate-400">
                      &bull; {log.targetName}
                    </span>
                  )}
                </div>

                {log.changes && (
                  <div className="text-sm text-slate-300 mb-1">
                    {formatAuditLogChanges(log.changes)}
                  </div>
                )}

                {log.reason && (
                  <div className="text-sm text-slate-200 mb-1">
                    <span className="text-slate-400">Reason:</span> {log.reason}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <Avatar
                    src={log.actorAvatar}
                    fallback={log.actorUsername.slice(0, 2).toUpperCase()}
                    size="xs"
                  />
                  <span className="text-xs text-slate-400">
                    {log.actorUsername} &bull; {formatRelativeTime(log.createdAt)}
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
