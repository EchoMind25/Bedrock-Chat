"use client";

import { useState } from "react";
import { Copy, Trash2, Clock, Users, Hash } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../../ui/button/button";
import { Avatar } from "../../ui/avatar/avatar";
import { cn } from "../../../lib/utils/cn";
import type { ServerInvite } from "../../../lib/types/invites";
import { formatTimeRemaining, isInviteValid } from "../../../lib/types/invites";
import { toast } from "../../../lib/stores/toast-store";

interface InviteItemProps {
  invite: ServerInvite;
  channelName: string;
  onDelete: () => void;
}

export function InviteItem({ invite, channelName, onDelete }: InviteItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopy = () => {
    const inviteUrl = `https://bedrock.chat/invite/${invite.code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite Copied", "Invite link copied to clipboard");
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this invite?")) {
      setIsDeleting(true);
      await onDelete();
      setIsDeleting(false);
    }
  };

  const isValid = isInviteValid(invite);
  const timeRemaining = formatTimeRemaining(invite.expiresAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn(
        "p-4 rounded-lg border transition-colors",
        isValid
          ? "border-white/10 bg-white/5"
          : "border-red-500/30 bg-red-500/10",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Invite Code */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <code className="px-2 py-1 rounded bg-black/30 text-blue-400 font-mono text-sm">
                {invite.code}
              </code>
              {!isValid && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                  Expired
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {channelName}
            </p>
          </div>

          {/* Invite Info */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {invite.uses}
              {invite.maxUses > 0 ? ` / ${invite.maxUses}` : ""} uses
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires: {timeRemaining}
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2">
            <Avatar
              src={invite.inviterAvatar}
              fallback={invite.inviterUsername.slice(0, 2).toUpperCase()}
              size="xs"
            />
            <span className="text-xs text-white/60">
              Created by {invite.inviterUsername}
            </span>
          </div>

          {invite.temporary && (
            <div className="text-xs text-yellow-400">
              ⚠️ Temporary (users will be kicked when they disconnect)
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            disabled={!isValid}
            className="gap-1"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleDelete}
            loading={isDeleting}
            className="gap-1"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
