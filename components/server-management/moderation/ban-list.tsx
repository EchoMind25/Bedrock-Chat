"use client";

import { motion, AnimatePresence } from "motion/react";
import { UserX } from "lucide-react";
import { Avatar } from "../../ui/avatar/avatar";
import { Button } from "../../ui/button/button";
import type { Ban } from "../../../lib/types/moderation";

interface BanListProps {
  bans: Ban[];
  onUnban: (userId: string) => void;
}

export function BanList({ bans, onUnban }: BanListProps) {
  const handleUnban = (ban: Ban) => {
    if (confirm(`Are you sure you want to unban ${ban.username}?`)) {
      onUnban(ban.userId);
    }
  };

  if (bans.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
          <UserX className="w-8 h-8 text-slate-500" />
        </div>
        <h4 className="text-lg font-semibold text-slate-200 mb-2">No banned users</h4>
        <p className="text-sm text-slate-400">Users you ban will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {bans.map((ban) => (
          <motion.div
            key={ban.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-lg border border-slate-700/30 bg-slate-800/20 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar src={ban.avatar} fallback={ban.username.slice(0, 2).toUpperCase()} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-100">{ban.displayName}</div>
                  <div className="text-sm text-slate-400">@{ban.username}</div>

                  {ban.reason && (
                    <div className="mt-2 text-sm text-slate-200">
                      <span className="text-slate-400">Reason:</span> {ban.reason}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-400">
                    Banned by {ban.bannedByUsername} on{" "}
                    {ban.bannedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleUnban(ban)}
              >
                Unban
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
