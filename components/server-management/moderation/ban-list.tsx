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
      <div className="text-center py-12 text-white/40">
        <UserX className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No banned users</p>
        <p className="text-sm mt-1">Users you ban will appear here</p>
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
            className="p-4 rounded-lg border border-white/10 bg-white/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Avatar src={ban.avatar} fallback={ban.username.slice(0, 2).toUpperCase()} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{ban.displayName}</div>
                  <div className="text-sm text-white/60">@{ban.username}</div>

                  {ban.reason && (
                    <div className="mt-2 text-sm">
                      <span className="text-white/60">Reason:</span> {ban.reason}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-white/40">
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
