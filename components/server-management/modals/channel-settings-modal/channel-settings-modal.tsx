"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "../../../ui/modal/modal";
import { Tabs } from "../../../ui/tabs/tabs";
import { Button } from "../../../ui/button/button";
import { Input, Textarea } from "../../../ui/input/input";
import { Dropdown } from "../../../ui/dropdown/dropdown";
import { Toggle } from "../../../ui/toggle/toggle";
import { PermissionOverrideGrid } from "../../permission-grid/permission-grid";
import { useServerManagementStore, type ChannelSettingsTab } from "../../../../store/server-management.store";
import { useServerStore } from "../../../../store/server.store";
import { toast } from "../../../../lib/stores/toast-store";
import { createClient } from "../../../../lib/supabase/client";
import type { Channel } from "../../../../lib/types/server";
import type { Role, PermissionOverride } from "../../../../lib/types/permissions";

const SLOWMODE_OPTIONS = [
  { id: "0", value: "0", label: "Off" },
  { id: "5", value: "5", label: "5 seconds" },
  { id: "10", value: "10", label: "10 seconds" },
  { id: "15", value: "15", label: "15 seconds" },
  { id: "30", value: "30", label: "30 seconds" },
  { id: "60", value: "60", label: "1 minute" },
  { id: "120", value: "120", label: "2 minutes" },
  { id: "300", value: "300", label: "5 minutes" },
  { id: "600", value: "600", label: "10 minutes" },
  { id: "1800", value: "1800", label: "30 minutes" },
  { id: "3600", value: "3600", label: "1 hour" },
  { id: "7200", value: "7200", label: "2 hours" },
  { id: "21600", value: "21600", label: "6 hours" },
];

export function ChannelSettingsModal() {
  const isChannelSettingsOpen = useServerManagementStore((s) => s.isChannelSettingsOpen);
  const closeChannelSettings = useServerManagementStore((s) => s.closeChannelSettings);
  const selectedChannelId = useServerManagementStore((s) => s.selectedChannelId);
  const channelSettingsTab = useServerManagementStore((s) => s.channelSettingsTab);
  const setChannelSettingsTab = useServerManagementStore((s) => s.setChannelSettingsTab);

  const servers = useServerStore((s) => s.servers);
  const currentServerId = useServerStore((s) => s.currentServerId);
  const currentServer = servers.find((s) => s.id === currentServerId);

  const [editedChannel, setEditedChannel] = useState<Partial<Channel>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentChannel = currentServer?.channels.find((ch) => ch.id === selectedChannelId);

  // Reset edited state when modal opens/closes or channel changes
  useEffect(() => {
    if (isChannelSettingsOpen && currentChannel) {
      setEditedChannel({});
      setHasChanges(false);
    }
  }, [isChannelSettingsOpen, currentChannel?.id]);

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    closeChannelSettings();
  };

  const handleSave = async () => {
    if (!currentServer || !currentChannel) return;

    setIsSaving(true);

    try {
      const supabase = createClient();
      const dbUpdates: Record<string, unknown> = {};
      if (editedChannel.name !== undefined) dbUpdates.name = editedChannel.name;
      if (editedChannel.topic !== undefined) dbUpdates.topic = editedChannel.topic;
      if (editedChannel.slowMode !== undefined) dbUpdates.slow_mode = editedChannel.slowMode;
      if (editedChannel.isNsfw !== undefined) dbUpdates.is_nsfw = editedChannel.isNsfw;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("channels")
          .update(dbUpdates)
          .eq("id", currentChannel.id);

        if (error) throw error;
      }

      // Update channel in store
      useServerStore.setState((state) => ({
        servers: state.servers.map((server) =>
          server.id === currentServer.id
            ? {
                ...server,
                channels: server.channels.map((ch) =>
                  ch.id === currentChannel.id ? { ...ch, ...editedChannel } : ch
                ),
              }
            : server
        ),
      }));

      toast.success("Channel Updated", "Channel settings have been saved");
      setHasChanges(false);
      setEditedChannel({});
    } catch (error) {
      toast.error("Save Failed", "Could not save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentServer || !currentChannel) return;

    if (currentServer.channels.length === 1) {
      toast.error("Cannot Delete", "You cannot delete the last channel in a server");
      return;
    }

    if (!confirm(`Are you sure you want to delete #${currentChannel.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", currentChannel.id);

      if (error) throw error;

      // Remove channel from local store
      useServerStore.setState((state) => ({
        servers: state.servers.map((server) =>
          server.id === currentServer.id
            ? {
                ...server,
                channels: server.channels.filter((ch) => ch.id !== currentChannel.id),
              }
            : server
        ),
        currentChannelId: currentServer.channels.find((ch) => ch.id !== currentChannel.id)?.id || null,
      }));

      toast.success("Channel Deleted", `#${currentChannel.name} has been deleted`);
      closeChannelSettings();

      // Navigate to first remaining channel
      const firstChannel = currentServer.channels.find((ch) => ch.id !== currentChannel.id);
      if (firstChannel) {
        window.location.href = `/servers/${currentServer.id}/${firstChannel.id}`;
      }
    } catch (error) {
      toast.error("Delete Failed", "Could not delete channel. Please try again.");
    }
  };

  const handleChange = (updates: Partial<Channel>) => {
    setEditedChannel((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (!currentServer || !currentChannel) return null;

  // Merge current channel with edits
  const displayChannel: Channel = {
    ...currentChannel,
    ...editedChannel,
  };

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "permissions" as const, label: "Permissions" },
  ];

  return (
    <Modal
      isOpen={isChannelSettingsOpen}
      onClose={handleClose}
      title={`#${currentChannel.name} Settings`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-white/60">
            {hasChanges && "You have unsaved changes"}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <Tabs
          tabs={tabs}
          activeTab={channelSettingsTab}
          onTabChange={(tab) => setChannelSettingsTab(tab as ChannelSettingsTab)}
          variant="pills"
        />

        {/* Overview Tab */}
        {channelSettingsTab === "overview" && (
          <div className="space-y-4">
            <Input
              label="Channel Name"
              value={displayChannel.name}
              onChange={(e) => handleChange({ name: e.target.value })}
              placeholder="channel-name"
              maxLength={100}
            />

            {displayChannel.type === "text" && (
              <>
                <Textarea
                  label="Topic (Optional)"
                  value={displayChannel.topic || ""}
                  onChange={(e) => handleChange({ topic: e.target.value })}
                  placeholder="What's this channel about?"
                  maxLength={1024}
                  rows={2}
                />

                <Dropdown
                  label="Slowmode"
                  items={SLOWMODE_OPTIONS}
                  value={String(displayChannel.slowMode || 0)}
                  onSelect={(value) => handleChange({ slowMode: Number.parseInt(value) })}
                />
              </>
            )}

            <Toggle
              checked={displayChannel.isNsfw}
              onChange={(e) => handleChange({ isNsfw: e.target.checked })}
              label="Mark as NSFW (Not Safe For Work)"
            />

            {/* Danger Zone */}
            <div className="pt-6 border-t border-white/10">
              <h4 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h4>
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Delete Channel</div>
                    <div className="text-xs text-white/60 mt-1">
                      Permanently delete this channel and all its messages
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {channelSettingsTab === "permissions" && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Permission Overrides</h4>
              <p className="text-sm text-white/60 mb-4">
                Configure role-specific permissions for this channel. These override server-level role permissions.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-200">
                <strong>Coming Soon:</strong> Full permission override management. For now, you can
                set channels as private when creating them.
              </p>
            </div>

            {/* Placeholder for permission overrides */}
            {displayChannel.permissionOverrides && displayChannel.permissionOverrides.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Active Overrides</h5>
                {displayChannel.permissionOverrides.map((override) => {
                  const role = currentServer.roles?.find((r) => r.id === override.targetId);
                  return (
                    <div
                      key={override.id}
                      className="p-3 rounded-lg border border-white/10 bg-white/5"
                    >
                      <div className="font-medium text-sm">
                        {override.targetType === "role" ? `@${role?.name || "Unknown Role"}` : "User"}
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        {override.allow > 0 && `Allowed: ${override.allow} `}
                        {override.deny > 0 && `Denied: ${override.deny}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
