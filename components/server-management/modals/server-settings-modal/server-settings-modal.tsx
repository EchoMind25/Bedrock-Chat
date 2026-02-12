"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, Hash, Ban, Link as LinkIcon } from "lucide-react";
import { Modal } from "../../../ui/modal/modal";
import { Tabs } from "../../../ui/tabs/tabs";
import { Button } from "../../../ui/button/button";
import { OverviewTab } from "./overview-tab";
import { RolesTab } from "./roles-tab";
import { ChannelsTab } from "./channels-tab";
import { ModerationTab } from "./moderation-tab";
import { InvitesTab } from "./invites-tab";
import { useServerManagementStore } from "../../../../store/server-management.store";
import { useServerStore } from "../../../../store/server.store";
import { toast } from "../../../../lib/stores/toast-store";
import { createClient } from "../../../../lib/supabase/client";
import type { Server } from "../../../../lib/types/server";
import type { Role } from "../../../../lib/types/permissions";
import type { AutoModSettings } from "../../../../lib/types/moderation";

export function ServerSettingsModal() {
  const {
    isServerSettingsOpen,
    closeServerSettings,
    serverSettingsTab,
    setServerSettingsTab,
  } = useServerManagementStore();

  const servers = useServerStore((s) => s.servers);
  const currentServerId = useServerStore((s) => s.currentServerId);
  const currentServer = servers.find((s) => s.id === currentServerId);

  // Local state for unsaved changes
  const [editedServer, setEditedServer] = useState<Partial<Server>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset edited state when modal opens/closes or server changes
  useEffect(() => {
    if (isServerSettingsOpen && currentServer) {
      setEditedServer({});
      setHasChanges(false);
    }
  }, [isServerSettingsOpen, currentServer?.id]);

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    closeServerSettings();
  };

  const handleSave = async () => {
    if (!currentServer) return;

    setIsSaving(true);

    try {
      const supabase = createClient();
      const dbUpdates: Record<string, unknown> = {};
      if (editedServer.name !== undefined) dbUpdates.name = editedServer.name;
      if (editedServer.icon !== undefined) dbUpdates.icon = editedServer.icon;
      if (editedServer.description !== undefined) dbUpdates.description = editedServer.description;

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase
          .from("servers")
          .update(dbUpdates)
          .eq("id", currentServer.id);

        if (error) throw error;
      }

      // Update server in store
      useServerStore.setState((state) => ({
        servers: state.servers.map((server) =>
          server.id === currentServer.id
            ? { ...server, ...editedServer }
            : server
        ),
      }));

      toast.success("Settings Saved", "Your server settings have been updated");
      setHasChanges(false);
      setEditedServer({});
    } catch (error) {
      toast.error("Save Failed", "Could not save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverviewChange = (updates: Partial<Server>) => {
    setEditedServer((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleRoleCreate = (role: Omit<Role, "id">) => {
    const newRole: Role = {
      ...role,
      id: `${currentServer?.id}-role-${Date.now()}`,
    };

    const updatedRoles = [...(currentServer?.roles || []), newRole];
    setEditedServer((prev) => ({ ...prev, roles: updatedRoles }));
    setHasChanges(true);
  };

  const handleRoleUpdate = (roleId: string, updates: Partial<Role>) => {
    const updatedRoles = (currentServer?.roles || []).map((role) =>
      role.id === roleId ? { ...role, ...updates } : role
    );
    setEditedServer((prev) => ({ ...prev, roles: updatedRoles }));
    setHasChanges(true);
  };

  const handleRoleDelete = (roleId: string) => {
    const updatedRoles = (currentServer?.roles || []).filter((role) => role.id !== roleId);
    setEditedServer((prev) => ({ ...prev, roles: updatedRoles }));
    setHasChanges(true);
  };

  const handleRoleReorder = (roleIds: string[]) => {
    const rolesMap = new Map((currentServer?.roles || []).map((r) => [r.id, r]));
    const updatedRoles = roleIds.map((id, index) => {
      const role = rolesMap.get(id)!;
      return { ...role, position: roleIds.length - 1 - index };
    });
    setEditedServer((prev) => ({ ...prev, roles: updatedRoles }));
    setHasChanges(true);
  };

  const handleChannelReorder = (channelIds: string[]) => {
    const channelsMap = new Map(currentServer?.channels.map((ch) => [ch.id, ch]));
    const updatedChannels = channelIds.map((id, index) => {
      const channel = channelsMap.get(id)!;
      return { ...channel, position: index };
    });
    setEditedServer((prev) => ({ ...prev, channels: updatedChannels }));
    setHasChanges(true);
  };

  const handleAutoModUpdate = (autoModSettings: AutoModSettings) => {
    setEditedServer((prev) => ({
      ...prev,
      settings: {
        ...(currentServer?.settings || {}),
        autoMod: autoModSettings,
      } as any,
    }));
    setHasChanges(true);
  };

  if (!currentServer) return null;

  // Merge current server with edits
  const displayServer: Server = {
    ...currentServer,
    ...editedServer,
    roles: editedServer.roles || currentServer.roles,
    channels: editedServer.channels || currentServer.channels,
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Settings },
    { id: "roles" as const, label: "Roles", icon: Shield, count: displayServer.roles?.length },
    { id: "channels" as const, label: "Channels", icon: Hash, count: displayServer.channels.length },
    { id: "moderation" as const, label: "Moderation", icon: Ban },
    { id: "invites" as const, label: "Invites", icon: LinkIcon },
  ];

  return (
    <Modal
      isOpen={isServerSettingsOpen}
      onClose={handleClose}
      title={`${currentServer.name} Settings`}
      size="xl"
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
      <div className="flex gap-6 h-[650px]">
        {/* Vertical Tabs */}
        <div className="w-48 flex-shrink-0 border-r border-white/10 pr-4 overflow-y-auto scrollbar-thin">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setServerSettingsTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    serverSettingsTab === tab.id
                      ? "bg-blue-500/20 text-blue-400"
                      : "hover:bg-white/5 text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className="text-xs text-white/60">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
          {serverSettingsTab === "overview" && (
            <OverviewTab server={displayServer} onChange={handleOverviewChange} />
          )}
          {serverSettingsTab === "roles" && (
            <RolesTab
              roles={displayServer.roles || []}
              onRoleCreate={handleRoleCreate}
              onRoleUpdate={handleRoleUpdate}
              onRoleDelete={handleRoleDelete}
              onRoleReorder={handleRoleReorder}
            />
          )}
          {serverSettingsTab === "channels" && (
            <ChannelsTab
              server={displayServer}
              onChannelReorder={handleChannelReorder}
            />
          )}
          {serverSettingsTab === "moderation" && (
            <ModerationTab
              server={displayServer}
              onAutoModUpdate={handleAutoModUpdate}
            />
          )}
          {serverSettingsTab === "invites" && (
            <InvitesTab server={displayServer} />
          )}
        </div>
      </div>
    </Modal>
  );
}
