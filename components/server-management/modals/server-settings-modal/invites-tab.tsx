"use client";

import { useState, useEffect } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../../../ui/button/button";
import { Dropdown } from "../../../ui/dropdown/dropdown";
import { Toggle } from "../../../ui/toggle/toggle";
import { InviteItem } from "../../invite-manager/invite-item";
import { useServerManagementStore } from "../../../../store/server-management.store";
import type { Server } from "../../../../lib/types/server";
import type { InviteExpirationOption, InviteMaxUsesOption } from "../../../../lib/types/invites";

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
  const {
    loadInvites,
    getInvitesByServer,
    createInvite,
    deleteInvite,
  } = useServerManagementStore();

  const [isCreating, setIsCreating] = useState(false);
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
  useEffect(() => {
    if (!selectedChannelId && server.channels.length > 0) {
      setSelectedChannelId(server.channels[0].id);
    }
  }, [server.channels]);

  const invites = getInvitesByServer(server.id);

  const channelOptions = server.channels
    .filter((ch) => ch.type === "text" || ch.type === "announcement")
    .map((ch) => ({
      id: ch.id,
      value: ch.id,
      label: `# ${ch.name}`,
    }));

  const handleCreate = async () => {
    if (!selectedChannelId) return;

    setIsLoading(true);
    try {
      await createInvite(
        server.id,
        selectedChannelId,
        "current-user",
        "You",
        "👤",
        {
          expiresAfter: expiresAfter as InviteExpirationOption,
          maxUses: Number.parseInt(maxUses) as InviteMaxUsesOption,
          temporary,
        },
      );

      // Reset form
      setExpiresAfter("7d");
      setMaxUses("0");
      setTemporary(false);
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (inviteId: string) => {
    await deleteInvite(server.id, inviteId);
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

              <Dropdown
                label="Channel"
                items={channelOptions}
                value={selectedChannelId}
                onSelect={setSelectedChannelId}
                placeholder="Select a channel"
              />

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
                  disabled={!selectedChannelId}
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
              const channel = server.channels.find((ch) => ch.id === invite.channelId);
              return (
                <InviteItem
                  key={invite.id}
                  invite={invite}
                  channelName={channel?.name || "Unknown"}
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
