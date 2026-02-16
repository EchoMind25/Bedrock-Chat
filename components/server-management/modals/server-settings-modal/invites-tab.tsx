"use client";

import { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Hash, Volume2, Server as ServerIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../../ui/button/button";
import { Dropdown } from "../../../ui/dropdown/dropdown";
import { Toggle } from "../../../ui/toggle/toggle";
import { InviteItem } from "../../invite-manager/invite-item";
import { useServerManagementStore } from "../../../../store/server-management.store";
import { cn } from "../../../../lib/utils/cn";
import { createClient } from "../../../../lib/supabase/client";
import type { Server } from "../../../../lib/types/server";
import type { InviteExpirationOption, InviteMaxUsesOption, InviteTargetType } from "../../../../lib/types/invites";

interface InvitesTabProps {
  server: Server;
}

const EXPIRATION_OPTIONS = [
  { id: "30m", value: "30m", label: "30 minutes" },
  { id: "1h", value: "1h", label: "1 hour" },
  { id: "6h", value: "6h", label: "6 hours" },
  { id: "12h", value: "12h", label: "12 hours" },
  { id: "1d", value: "1d", label: "1 day" },
  { id: "7d", value: "7d", label: "7 days" },
  { id: "never", value: "never", label: "Never" },
];

const MAX_USES_OPTIONS = [
  { id: "0", value: "0", label: "No limit" },
  { id: "1", value: "1", label: "1 use" },
  { id: "5", value: "5", label: "5 uses" },
  { id: "10", value: "10", label: "10 uses" },
  { id: "25", value: "25", label: "25 uses" },
  { id: "50", value: "50", label: "50 uses" },
  { id: "100", value: "100", label: "100 uses" },
];

export function InvitesTab({ server }: InvitesTabProps) {
  const loadInvites = useServerManagementStore((s) => s.loadInvites);
  const getInvitesByServer = useServerManagementStore((s) => s.getInvitesByServer);
  const createInvite = useServerManagementStore((s) => s.createInvite);
  const deleteInvite = useServerManagementStore((s) => s.deleteInvite);

  const [isCreating, setIsCreating] = useState(false);
  const [targetType, setTargetType] = useState<InviteTargetType>("server");
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [expiresAfter, setExpiresAfter] = useState<string>("7d");
  const [maxUses, setMaxUses] = useState<string>("0");
  const [temporary, setTemporary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load invites on mount
  useEffect(() => {
    loadInvites(server.id, server.channels.map((ch) => ch.id));
  }, [server.id]);

  // Set default channel
  const firstChannelId = server.channels[0]?.id;
  useEffect(() => {
    if (!selectedChannelId && firstChannelId) {
      setSelectedChannelId(firstChannelId);
    }
  }, [firstChannelId, selectedChannelId]);

  const invites = getInvitesByServer(server.id);

  const textChannelOptions = server.channels
    .filter((ch) => ch.type === "text" || ch.type === "announcement")
    .map((ch) => ({
      id: ch.id,
      value: ch.id,
      label: `# ${ch.name}`,
    }));

  const voiceChannelOptions = server.channels
    .filter((ch) => ch.type === "voice")
    .map((ch) => ({
      id: ch.id,
      value: ch.id,
      label: `🔊 ${ch.name}`,
    }));

  const handleCreate = async () => {
    if (targetType !== "server" && !selectedChannelId) {
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      await createInvite(
        server.id,
        targetType,
        targetType === "server" ? null : selectedChannelId,
        user.id,
        user.user_metadata?.username || user.email?.split("@")[0] || "Unknown",
        user.user_metadata?.avatar_url || "",
        {
          expiresAfter: expiresAfter as InviteExpirationOption,
          maxUses: Number.parseInt(maxUses) as InviteMaxUsesOption,
          temporary,
        },
      );

      // Reset form
      setTargetType("server");
      setSelectedChannelId("");
      setExpiresAfter("7d");
      setMaxUses("0");
      setTemporary(false);
      setIsCreating(false);
    } catch (err) {
      console.error("Error creating invite:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (inviteId: string) => {
    try {
      await deleteInvite(server.id, inviteId);
    } catch (err) {
      console.error("Error deleting invite:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Invites</h3>
          <p className="text-sm text-slate-300 mt-1">
            Manage invite links for your server
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Create Invite
        </Button>
      </div>

      {/* Create Invite Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl glass-card space-y-4">
              <h4 className="font-medium text-slate-100">Create New Invite</h4>

              {/* Target Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Invite Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("server");
                      setSelectedChannelId("");
                    }}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      targetType === "server"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <ServerIcon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Server-wide</div>
                    <div className="text-[10px] text-white/60">Full access</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("channel")}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      targetType === "channel"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <Hash className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Text Channel</div>
                    <div className="text-[10px] text-white/60">One channel</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType("voice")}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      targetType === "voice"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <Volume2 className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Voice Channel</div>
                    <div className="text-[10px] text-white/60">Voice only</div>
                  </button>
                </div>
              </div>

              {/* Conditional Channel Selector */}
              {targetType !== "server" && (
                <Dropdown
                  label={targetType === "voice" ? "Voice Channel" : "Text Channel"}
                  items={targetType === "voice" ? voiceChannelOptions : textChannelOptions}
                  value={selectedChannelId}
                  onSelect={setSelectedChannelId}
                  placeholder={`Select a ${targetType} channel`}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <Dropdown
                  label="Expire After"
                  items={EXPIRATION_OPTIONS}
                  value={expiresAfter}
                  onSelect={setExpiresAfter}
                />

                <Dropdown
                  label="Max Uses"
                  items={MAX_USES_OPTIONS}
                  value={maxUses}
                  onSelect={setMaxUses}
                />
              </div>

              <Toggle
                checked={temporary}
                onChange={(e) => setTemporary(e.target.checked)}
                label="Temporary membership (kick on disconnect)"
              />

              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
                <Button
                  onClick={handleCreate}
                  loading={isLoading}
                  disabled={targetType !== "server" && !selectedChannelId}
                >
                  Create Invite
                </Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invites List */}
      <div className="space-y-3">
        <AnimatePresence>
          {invites.length > 0 ? (
            invites.map((invite) => {
              const channel = invite.channelId
                ? server.channels.find((ch) => ch.id === invite.channelId)
                : null;

              const displayName = invite.targetType === "server"
                ? "🌐 Server-wide"
                : invite.targetType === "voice"
                ? `🔊 ${channel?.name || "Unknown"}`
                : `# ${channel?.name || "Unknown"}`;

              return (
                <InviteItem
                  key={invite.id}
                  invite={invite}
                  channelName={displayName}
                  onDelete={() => handleDelete(invite.id)}
                />
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <LinkIcon className="w-10 h-10 text-slate-500" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2">
                No active invites
              </h4>
              <p className="text-sm text-slate-400 mb-6">
                Create an invite link to share your server with others
              </p>
              <Button onClick={() => setIsCreating(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Create First Invite
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
