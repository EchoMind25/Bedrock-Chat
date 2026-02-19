"use client";

import { useState, useEffect } from "react";
import { Settings, Shield, Hash, Ban, Link as LinkIcon, Folder } from "lucide-react";
import { Modal } from "../../../ui/modal/modal";
import { Button } from "../../../ui/button/button";
import { OverviewTab } from "./overview-tab";
import { RolesTab } from "./roles-tab";
import { ChannelsTab } from "./channels-tab";
import { CategoriesTab } from "./categories-tab";
import { ModerationTab } from "./moderation-tab";
import { InvitesTab } from "./invites-tab";
import { useServerManagementStore } from "../../../../store/server-management.store";
import { useServerStore } from "../../../../store/server.store";
import { toast } from "../../../../lib/stores/toast-store";
import { createClient } from "../../../../lib/supabase/client";
import { uploadServerImage } from "../../../../lib/supabase/upload-server-image";
import type { Server, Channel } from "../../../../lib/types/server";
import type { Role } from "../../../../lib/types/permissions";
import type { AutoModSettings } from "../../../../lib/types/moderation";

export function ServerSettingsModal() {
  const isServerSettingsOpen = useServerManagementStore((s) => s.isServerSettingsOpen);
  const closeServerSettings = useServerManagementStore((s) => s.closeServerSettings);
  const serverSettingsTab = useServerManagementStore((s) => s.serverSettingsTab);
  const setServerSettingsTab = useServerManagementStore((s) => s.setServerSettingsTab);

  const servers = useServerStore((s) => s.servers);
  const currentServerId = useServerStore((s) => s.currentServerId);
  const currentServer = servers.find((s) => s.id === currentServerId);

  // Local state for unsaved changes
  const [editedServer, setEditedServer] = useState<Partial<Server>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pending image files (uploaded on save, not on select)
  const [pendingFiles, setPendingFiles] = useState<{ logo?: File; banner?: File }>({});

  // Key to force OverviewTab remount after save (resets local state from updated props)
  const [overviewKey, setOverviewKey] = useState(0);

  // Reset edited state when modal opens/closes or server changes
  useEffect(() => {
    if (isServerSettingsOpen && currentServer) {
      setEditedServer({});
      setHasChanges(false);
      setPendingFiles({});
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

    const supabase = createClient();
    const dbUpdates: Record<string, unknown> = {};
    const storeUpdates: Partial<Server> = { ...editedServer };
    const errors: string[] = [];

    // Remove blob: URLs from storeUpdates — only real uploaded URLs should be stored
    if (pendingFiles.logo) delete storeUpdates.icon;
    if (pendingFiles.banner) delete storeUpdates.banner;

    // --- Phase 1: Upload images (failures don't block other saves) ---

    if (pendingFiles.logo) {
      try {
        const uploadedIconUrl = await uploadServerImage(
          currentServer.id,
          pendingFiles.logo,
          "logo",
        );
        dbUpdates.icon_url = uploadedIconUrl;
        storeUpdates.icon = uploadedIconUrl;
      } catch (err) {
        errors.push(`Logo upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    if (pendingFiles.banner) {
      try {
        const uploadedBannerUrl = await uploadServerImage(
          currentServer.id,
          pendingFiles.banner,
          "banner",
        );
        dbUpdates.banner_url = uploadedBannerUrl;
        storeUpdates.banner = uploadedBannerUrl;
      } catch (err) {
        errors.push(`Banner upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // --- Phase 2: Text field changes ---

    if (editedServer.name !== undefined) dbUpdates.name = editedServer.name;
    if (editedServer.description !== undefined) dbUpdates.description = editedServer.description;

    // Icon/banner cleared (set to null) without a new file
    if (!pendingFiles.logo && editedServer.icon !== undefined) {
      dbUpdates.icon_url = editedServer.icon;
    }
    if (!pendingFiles.banner && editedServer.banner !== undefined) {
      dbUpdates.banner_url = editedServer.banner;
    }

    if (Object.keys(dbUpdates).length > 0) {
      try {
        const { error } = await supabase
          .from("servers")
          .update(dbUpdates)
          .eq("id", currentServer.id);

        if (error) throw error;
      } catch (err) {
        errors.push(`Settings update failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // --- Phase 3: Role changes ---

    if (editedServer.roles) {
      try {
        const originalRoleIds = new Set((currentServer.roles || []).map((r) => r.id));
        const editedRoleIds = new Set(editedServer.roles.map((r) => r.id));

        // Delete removed roles
        for (const originalRole of (currentServer.roles || [])) {
          if (!editedRoleIds.has(originalRole.id)) {
            await supabase.from("server_roles").delete().eq("id", originalRole.id);
          }
        }

        // Upsert all current roles
        for (const role of editedServer.roles) {
          const isNew = !originalRoleIds.has(role.id) || role.id.includes("-role-");
          const roleData = {
            server_id: currentServer.id,
            name: role.name,
            color: role.color,
            position: role.position,
            permissions: role.permissions,
            is_default: role.isDefault,
          };

          if (isNew && role.id.includes("-role-")) {
            // New role — insert and get real ID
            const { data: inserted, error: insertErr } = await supabase
              .from("server_roles")
              .insert(roleData)
              .select("id")
              .single();
            if (insertErr) throw insertErr;
            // Update the role ID to the real DB ID
            role.id = inserted.id;
          } else {
            // Existing role — update
            const { error: updateErr } = await supabase
              .from("server_roles")
              .update(roleData)
              .eq("id", role.id);
            if (updateErr) throw updateErr;
          }
        }
      } catch (err) {
        errors.push(`Role changes failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // --- Phase 4: Update store with whatever succeeded ---

    // Keep settings.icon / settings.banner in sync with top-level fields
    if (storeUpdates.icon !== undefined || storeUpdates.banner !== undefined) {
      storeUpdates.settings = {
        ...(currentServer.settings || {}),
        ...(storeUpdates.icon !== undefined && { icon: storeUpdates.icon }),
        ...(storeUpdates.banner !== undefined && { banner: storeUpdates.banner }),
      } as Server["settings"];
    }

    // Update server in store
    useServerStore.setState((state) => ({
      servers: state.servers.map((server) =>
        server.id === currentServer.id
          ? { ...server, ...storeUpdates }
          : server
      ),
    }));

    if (errors.length === 0) {
      toast.success("Settings Saved", "Your server settings have been updated");
      setHasChanges(false);
      setEditedServer({});
      setPendingFiles({});
      setOverviewKey((k) => k + 1);
    } else {
      toast.error(
        "Partially Saved",
        errors.join("; "),
      );
      setPendingFiles({});
    }

    setIsSaving(false);
  };

  const handleOverviewChange = (updates: Partial<Server>) => {
    setEditedServer((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handlePendingFile = (type: "logo" | "banner", file: File | null) => {
    setPendingFiles((prev) => {
      const updated = { ...prev };
      if (file) {
        updated[type] = file;
      } else {
        delete updated[type];
      }
      return updated;
    });
    setHasChanges(true);
  };

  const handleRoleCreate = (role: Omit<Role, "id">) => {
    const newRole: Role = {
      ...role,
      id: `${currentServer?.id}-role-${Date.now()}`,
    };

    setEditedServer((prev) => {
      const currentRoles = prev.roles || currentServer?.roles || [];
      return { ...prev, roles: [...currentRoles, newRole] };
    });
    setHasChanges(true);
  };

  const handleRoleUpdate = (roleId: string, updates: Partial<Role>) => {
    setEditedServer((prev) => {
      const currentRoles = prev.roles || currentServer?.roles || [];
      const updatedRoles = currentRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      );
      return { ...prev, roles: updatedRoles };
    });
    setHasChanges(true);
  };

  const handleRoleDelete = (roleId: string) => {
    setEditedServer((prev) => {
      const currentRoles = prev.roles || currentServer?.roles || [];
      return { ...prev, roles: currentRoles.filter((role) => role.id !== roleId) };
    });
    setHasChanges(true);
  };

  const handleRoleReorder = (roleIds: string[]) => {
    setEditedServer((prev) => {
      const currentRoles = prev.roles || currentServer?.roles || [];
      const rolesMap = new Map(currentRoles.map((r) => [r.id, r]));
      const updatedRoles = roleIds.map((id, index) => {
        const role = rolesMap.get(id)!;
        return { ...role, position: roleIds.length - 1 - index };
      });
      return { ...prev, roles: updatedRoles };
    });
    setHasChanges(true);
  };

  const handleChannelReorder = (channels: Channel[]) => {
    setEditedServer((prev) => ({ ...prev, channels }));
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
    { id: "categories" as const, label: "Categories", icon: Folder, count: displayServer.categories.length },
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
          <div className="text-sm text-slate-400">
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
      <div className="flex gap-0 h-[650px]">
        {/* Vertical Tabs - Liquid Glass Sidebar */}
        <div className="w-52 shrink-0 border-r border-slate-700/30 pr-0 overflow-y-auto settings-scrollbar glass-inset rounded-l-lg">
          <div className="p-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = serverSettingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setServerSettingsTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                    isActive
                      ? "text-blue-300 border border-blue-500/30 bg-blue-600/20 shadow-lg shadow-blue-500/10"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
                    }`} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-slate-700/60 text-slate-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto settings-scrollbar pl-6 pr-2">
          {serverSettingsTab === "overview" && (
            <OverviewTab
              key={overviewKey}
              server={displayServer}
              onChange={handleOverviewChange}
              onPendingFile={handlePendingFile}
            />
          )}
          {serverSettingsTab === "roles" && (
            <RolesTab
              serverId={currentServer.id}
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
          {serverSettingsTab === "categories" && (
            <CategoriesTab server={displayServer} />
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
