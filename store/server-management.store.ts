import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerInvite, InviteSettings } from "../lib/types/invites";
import type { Ban, AuditLogEntry } from "../lib/types/moderation";
import { generateInviteCode, calculateExpirationDate } from "../lib/types/invites";
import { toast } from "../lib/stores/toast-store";

export type ServerSettingsTab = "overview" | "roles" | "channels" | "moderation" | "invites";
export type ChannelSettingsTab = "overview" | "permissions";

interface ServerManagementState {
  // Modal states
  isServerSettingsOpen: boolean;
  isCreateServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isChannelSettingsOpen: boolean;
  selectedChannelId: string | null;
  preselectedCategoryId: string | null; // For create channel modal

  // Tab states
  serverSettingsTab: ServerSettingsTab;
  channelSettingsTab: ChannelSettingsTab;

  // Data (serverId -> data[])
  invites: Map<string, ServerInvite[]>;
  bans: Map<string, Ban[]>;
  auditLogs: Map<string, AuditLogEntry[]>;

  // Modal actions
  openServerSettings: (tab?: ServerSettingsTab) => void;
  closeServerSettings: () => void;
  setServerSettingsTab: (tab: ServerSettingsTab) => void;

  openCreateServer: () => void;
  closeCreateServer: () => void;

  openCreateChannel: (preselectedCategoryId?: string) => void;
  closeCreateChannel: () => void;

  openChannelSettings: (channelId: string, tab?: ChannelSettingsTab) => void;
  closeChannelSettings: () => void;
  setChannelSettingsTab: (tab: ChannelSettingsTab) => void;

  // Invite operations
  createInvite: (
    serverId: string,
    channelId: string,
    inviterId: string,
    inviterUsername: string,
    inviterAvatar: string,
    settings: InviteSettings,
  ) => Promise<ServerInvite>;
  deleteInvite: (serverId: string, inviteId: string) => Promise<void>;
  loadInvites: (serverId: string, channelIds: string[]) => void;
  getInvitesByServer: (serverId: string) => ServerInvite[];

  // Moderation operations
  banUser: (
    serverId: string,
    userId: string,
    username: string,
    displayName: string,
    avatar: string,
    reason: string,
    bannedBy: string,
    bannedByUsername: string,
  ) => Promise<void>;
  unbanUser: (serverId: string, userId: string) => Promise<void>;
  loadBans: (serverId: string) => void;
  getBansByServer: (serverId: string) => Ban[];

  loadAuditLog: (serverId: string) => void;
  getAuditLogByServer: (serverId: string) => AuditLogEntry[];
  addAuditLogEntry: (
    serverId: string,
    action: string,
    actorId: string,
    actorUsername: string,
    actorAvatar: string,
    targetId?: string,
    targetName?: string,
    targetType?: "channel" | "role" | "user" | "invite" | "server",
    changes?: Record<string, { old: unknown; new: unknown }>,
    reason?: string,
  ) => void;
}

export const useServerManagementStore = create<ServerManagementState>()(
  conditionalDevtools(
    persist(
      (set, get) => ({
        // Initial state
        isServerSettingsOpen: false,
        isCreateServerOpen: false,
        isCreateChannelOpen: false,
        isChannelSettingsOpen: false,
        selectedChannelId: null,
        preselectedCategoryId: null,
        serverSettingsTab: "overview",
        channelSettingsTab: "overview",
        invites: new Map(),
        bans: new Map(),
        auditLogs: new Map(),

        // Modal actions
        openServerSettings: (tab = "overview") => {
          set({
            isServerSettingsOpen: true,
            serverSettingsTab: tab,
          });
        },

        closeServerSettings: () => {
          set({ isServerSettingsOpen: false });
        },

        setServerSettingsTab: (tab) => {
          set({ serverSettingsTab: tab });
        },

        openCreateServer: () => {
          set({ isCreateServerOpen: true });
        },

        closeCreateServer: () => {
          set({ isCreateServerOpen: false });
        },

        openCreateChannel: (preselectedCategoryId) => {
          set({
            isCreateChannelOpen: true,
            preselectedCategoryId,
          });
        },

        closeCreateChannel: () => {
          set({
            isCreateChannelOpen: false,
            preselectedCategoryId: null,
          });
        },

        openChannelSettings: (channelId, tab = "overview") => {
          set({
            isChannelSettingsOpen: true,
            selectedChannelId: channelId,
            channelSettingsTab: tab,
          });
        },

        closeChannelSettings: () => {
          set({
            isChannelSettingsOpen: false,
            selectedChannelId: null,
          });
        },

        setChannelSettingsTab: (tab) => {
          set({ channelSettingsTab: tab });
        },

        // Invite operations
        createInvite: async (serverId, channelId, inviterId, inviterUsername, inviterAvatar, settings) => {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const newInvite: ServerInvite = {
            id: `invite-${Date.now()}`,
            code: generateInviteCode(),
            serverId,
            channelId,
            inviterId,
            inviterUsername,
            inviterAvatar,
            maxUses: settings.maxUses,
            expiresAt: calculateExpirationDate(settings.expiresAfter),
            temporary: settings.temporary,
            uses: 0,
            createdAt: new Date(),
          };

          set((state) => {
            const serverInvites = state.invites.get(serverId) || [];
            const newInvites = new Map(state.invites);
            newInvites.set(serverId, [...serverInvites, newInvite]);
            return { invites: newInvites };
          });

          // Add audit log entry
          get().addAuditLogEntry(
            serverId,
            "invite_create",
            inviterId,
            inviterUsername,
            inviterAvatar,
            newInvite.id,
            newInvite.code,
            "invite",
          );

          toast.success("Invite Created", `Invite code: ${newInvite.code}`);

          return newInvite;
        },

        deleteInvite: async (serverId, inviteId) => {
          // Mock API delay
          await new Promise((resolve) => setTimeout(resolve, 500));

          set((state) => {
            const serverInvites = state.invites.get(serverId) || [];
            const invite = serverInvites.find((inv) => inv.id === inviteId);
            const newInvites = new Map(state.invites);
            newInvites.set(
              serverId,
              serverInvites.filter((inv) => inv.id !== inviteId),
            );

            if (invite) {
              get().addAuditLogEntry(
                serverId,
                "invite_delete",
                "current-user",
                "You",
                "👤",
                invite.id,
                invite.code,
                "invite",
              );
            }

            return { invites: newInvites };
          });

          toast.success("Invite Deleted", "The invite has been removed");
        },

        loadInvites: (serverId, _channelIds) => {
          const state = get();
          if (!state.invites.has(serverId)) {
            const newInvites = new Map(state.invites);
            newInvites.set(serverId, []);
            set({ invites: newInvites });
          }
        },

        getInvitesByServer: (serverId) => {
          return get().invites.get(serverId) || [];
        },

        // Moderation operations
        banUser: async (serverId, userId, username, displayName, avatar, reason, bannedBy, bannedByUsername) => {
          await new Promise((resolve) => setTimeout(resolve, 700));

          const newBan: Ban = {
            id: `ban-${Date.now()}`,
            serverId,
            userId,
            username,
            displayName,
            avatar,
            reason,
            bannedBy,
            bannedByUsername,
            bannedAt: new Date(),
          };

          set((state) => {
            const serverBans = state.bans.get(serverId) || [];
            const newBans = new Map(state.bans);
            newBans.set(serverId, [...serverBans, newBan]);
            return { bans: newBans };
          });

          // Add audit log entry
          get().addAuditLogEntry(
            serverId,
            "member_ban",
            bannedBy,
            bannedByUsername,
            "👤",
            userId,
            username,
            "user",
            undefined,
            reason,
          );

          toast.success("User Banned", `${username} has been banned from the server`);
        },

        unbanUser: async (serverId, userId) => {
          // Mock API delay
          await new Promise((resolve) => setTimeout(resolve, 500));

          set((state) => {
            const serverBans = state.bans.get(serverId) || [];
            const ban = serverBans.find((b) => b.userId === userId);
            const newBans = new Map(state.bans);
            newBans.set(
              serverId,
              serverBans.filter((b) => b.userId !== userId),
            );

            if (ban) {
              get().addAuditLogEntry(
                serverId,
                "member_unban",
                "current-user",
                "You",
                "👤",
                userId,
                ban.username,
                "user",
              );
            }

            return { bans: newBans };
          });

          toast.success("User Unbanned", "The user can now rejoin the server");
        },

        loadBans: (serverId) => {
          const state = get();
          if (!state.bans.has(serverId)) {
            const newBans = new Map(state.bans);
            newBans.set(serverId, []);
            set({ bans: newBans });
          }
        },

        getBansByServer: (serverId) => {
          return get().bans.get(serverId) || [];
        },

        loadAuditLog: (serverId) => {
          const state = get();
          if (!state.auditLogs.has(serverId)) {
            const newLogs = new Map(state.auditLogs);
            newLogs.set(serverId, []);
            set({ auditLogs: newLogs });
          }
        },

        getAuditLogByServer: (serverId) => {
          return get().auditLogs.get(serverId) || [];
        },

        addAuditLogEntry: (serverId, action, actorId, actorUsername, actorAvatar, targetId, targetName, targetType, changes, reason) => {
          const newEntry: AuditLogEntry = {
            id: `audit-${Date.now()}`,
            serverId,
            action: action as AuditLogEntry["action"],
            actorId,
            actorUsername,
            actorAvatar,
            targetId,
            targetName,
            targetType,
            changes,
            reason,
            createdAt: new Date(),
          };

          set((state) => {
            const serverLogs = state.auditLogs.get(serverId) || [];
            const newLogs = new Map(state.auditLogs);
            newLogs.set(serverId, [newEntry, ...serverLogs]); // Prepend new entries
            return { auditLogs: newLogs };
          });
        },
      }),
      {
        name: "bedrock-server-management",
        partialize: (state) => ({
          // Only persist modal states and tab preferences
          serverSettingsTab: state.serverSettingsTab,
          channelSettingsTab: state.channelSettingsTab,
        }),
      },
    ),
    { name: "ServerManagement" },
  ),
);
