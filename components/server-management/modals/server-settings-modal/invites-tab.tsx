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
          <h3 className="text-lg font-semibold">Server Invites</h3>
          <p className="text-sm text-white/60">
            Manage invite links for your server
          </p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="gap-1">
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
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
              <h4 className="font-medium">Create New Invite</h4>

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

              <div className="flex items-center gap-2">
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
              className="text-center py-12 text-white/40"
            >
              <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active invites</p>
              <p className="text-sm mt-1">Create an invite to get started</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
