import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ServerInvite, InviteSettings } from "../lib/types/invites";
import type { Ban, AuditLogEntry } from "../lib/types/moderation";
import { calculateExpirationDate } from "../lib/types/invites";
import { toast } from "../lib/stores/toast-store";
import { createClient } from "../lib/supabase/client";

export type ServerSettingsTab = "overview" | "roles" | "channels" | "moderation" | "invites";
export type ChannelSettingsTab = "overview" | "permissions";

export interface DiscoverableServer {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  member_count: number;
  icon_url: string | null;
  is_public: boolean;
  require_approval: boolean;
}

interface ServerManagementState {
  // Modal states
  isServerSettingsOpen: boolean;
  isCreateServerOpen: boolean;
  isAddServerOpen: boolean;
  isCreateChannelOpen: boolean;
  isChannelSettingsOpen: boolean;
  selectedChannelId: string | null;
  preselectedCategoryId: string | null;

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

  openAddServer: () => void;
  closeAddServer: () => void;

  // Discovery operations
  searchDiscoverableServers: (query: string) => Promise<DiscoverableServer[]>;
  joinPublicServer: (serverId: string) => Promise<void>;
  requestToJoinServer: (serverId: string, message?: string) => Promise<void>;
  joinServerByInvite: (code: string) => Promise<void>;

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
        isAddServerOpen: false,
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
          set({ isServerSettingsOpen: true, serverSettingsTab: tab });
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

        openAddServer: () => {
          set({ isAddServerOpen: true });
        },

        closeAddServer: () => {
          set({ isAddServerOpen: false });
        },

        // Discovery operations
        searchDiscoverableServers: async (query) => {
          const supabase = createClient();

          let q = supabase
            .from("servers")
            .select("id, name, description, category, member_count, icon_url, is_public, require_approval")
            .eq("allow_discovery", true);

          if (query.trim()) {
            q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
          }

          const { data, error } = await q.limit(20);

          if (error) {
            console.error("Error searching servers:", error);
            return [];
          }

          return (data || []) as DiscoverableServer[];
        },

        joinPublicServer: async (serverId) => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const { error } = await supabase
            .from("server_members")
            .insert({ server_id: serverId, user_id: user.id, role: "member" });

          if (error) {
            if (error.code === "23505") {
              toast.info("Already Joined", "You are already a member of this server");
              return;
            }
            toast.error("Error", "Could not join server");
            throw error;
          }

          toast.success("Joined Server", "You have joined the server");
        },

        requestToJoinServer: async (serverId, message) => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          const { error } = await supabase
            .from("server_join_requests")
            .insert({
              server_id: serverId,
              user_id: user.id,
              message: message || null,
            });

          if (error) {
            if (error.code === "23505") {
              toast.info("Already Requested", "You already have a pending request for this server");
              return;
            }
            toast.error("Error", "Could not send join request");
            throw error;
          }

          toast.success("Request Sent", "The server owner will review your request");
        },

        joinServerByInvite: async (code) => {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          // Look up the invite
          const { data: invite, error: inviteError } = await supabase
            .from("server_invites")
            .select("*")
            .eq("code", code.trim())
            .single();

          if (inviteError || !invite) {
            throw new Error("Invalid or expired invite code");
          }

          // Check expiration
          if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            throw new Error("This invite has expired");
          }

          // Check max uses
          if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
            throw new Error("This invite has reached its maximum uses");
          }

          // Join server
          const { error: memberError } = await supabase
            .from("server_members")
            .insert({ server_id: invite.server_id, user_id: user.id, role: "member" });

          if (memberError) {
            if (memberError.code === "23505") {
              toast.info("Already Joined", "You are already a member of this server");
              return;
            }
            toast.error("Error", "Could not join server");
            throw memberError;
          }

          // Increment uses
          await supabase
            .from("server_invites")
            .update({ uses: invite.uses + 1 })
            .eq("id", invite.id);

          toast.success("Joined Server", "You have joined the server via invite");
        },

        openCreateChannel: (preselectedCategoryId) => {
          set({ isCreateChannelOpen: true, preselectedCategoryId });
        },

        closeCreateChannel: () => {
          set({ isCreateChannelOpen: false, preselectedCategoryId: null });
        },

        openChannelSettings: (channelId, tab = "overview") => {
          set({ isChannelSettingsOpen: true, selectedChannelId: channelId, channelSettingsTab: tab });
        },

        closeChannelSettings: () => {
          set({ isChannelSettingsOpen: false, selectedChannelId: null });
        },

        setChannelSettingsTab: (tab) => {
          set({ channelSettingsTab: tab });
        },

        // Invite operations
        createInvite: async (serverId, channelId, inviterId, inviterUsername, inviterAvatar, settings) => {
          const supabase = createClient();

          const { data, error } = await supabase
            .from("server_invites")
            .insert({
              server_id: serverId,
              channel_id: channelId || null,
              inviter_id: inviterId,
              max_uses: settings.maxUses,
              expires_at: calculateExpirationDate(settings.expiresAfter)?.toISOString() || null,
              is_temporary: settings.temporary,
            })
            .select()
            .single();

          if (error) {
            toast.error("Error", "Could not create invite");
            throw error;
          }

          const newInvite: ServerInvite = {
            id: data.id,
            code: data.code,
            serverId,
            channelId,
            inviterId,
            inviterUsername,
            inviterAvatar,
            maxUses: data.max_uses,
            expiresAt: data.expires_at ? new Date(data.expires_at) : null,
            temporary: data.is_temporary,
            uses: 0,
            createdAt: new Date(data.created_at),
          };

          set((state) => {
            const serverInvites = state.invites.get(serverId) || [];
            const newInvites = new Map(state.invites);
            newInvites.set(serverId, [...serverInvites, newInvite]);
            return { invites: newInvites };
          });

          get().addAuditLogEntry(
            serverId, "invite_create", inviterId, inviterUsername, inviterAvatar,
            newInvite.id, newInvite.code, "invite",
          );

          toast.success("Invite Created", `Invite code: ${newInvite.code}`);
          return newInvite;
        },

        deleteInvite: async (serverId, inviteId) => {
          const supabase = createClient();
          const { error } = await supabase.from("server_invites").delete().eq("id", inviteId);

          if (error) {
            toast.error("Error", "Could not delete invite");
            throw error;
          }

          set((state) => {
            const serverInvites = state.invites.get(serverId) || [];
            const newInvites = new Map(state.invites);
            newInvites.set(serverId, serverInvites.filter((inv) => inv.id !== inviteId));
            return { invites: newInvites };
          });

          toast.success("Invite Deleted", "The invite has been removed");
        },

        loadInvites: async (serverId) => {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from("server_invites")
              .select(`*, inviter:profiles!server_invites_inviter_id_fkey(id, username, avatar_url)`)
              .eq("server_id", serverId);

            if (error) throw error;

            const invites: ServerInvite[] = (data || []).map((inv) => {
              const inviter = inv.inviter as unknown as Record<string, unknown>;
              return {
                id: inv.id, code: inv.code, serverId: inv.server_id,
                channelId: inv.channel_id, inviterId: inv.inviter_id,
                inviterUsername: (inviter?.username as string) || "Unknown",
                inviterAvatar: (inviter?.avatar_url as string) || "",
                maxUses: inv.max_uses,
                expiresAt: inv.expires_at ? new Date(inv.expires_at) : null,
                temporary: inv.is_temporary, uses: inv.uses,
                createdAt: new Date(inv.created_at),
              };
            });

            set((state) => {
              const newInvites = new Map(state.invites);
              newInvites.set(serverId, invites);
              return { invites: newInvites };
            });
          } catch (err) {
            console.error("Error loading invites:", err);
          }
        },

        getInvitesByServer: (serverId) => {
          return get().invites.get(serverId) || [];
        },

        // Moderation operations
        banUser: async (serverId, userId, username, displayName, avatar, reason, bannedBy, bannedByUsername) => {
          const supabase = createClient();

          const { error } = await supabase.from("server_bans").insert({
            server_id: serverId, user_id: userId, banned_by: bannedBy,
            reason: reason || null,
          });

          if (error) {
            toast.error("Error", "Could not ban user");
            throw error;
          }

          // Remove from server_members
          await supabase.from("server_members").delete()
            .eq("server_id", serverId).eq("user_id", userId);

          const newBan: Ban = {
            id: `ban-${Date.now()}`, serverId, userId, username, displayName,
            avatar, reason, bannedBy, bannedByUsername, bannedAt: new Date(),
          };

          set((state) => {
            const serverBans = state.bans.get(serverId) || [];
            const newBans = new Map(state.bans);
            newBans.set(serverId, [...serverBans, newBan]);
            return { bans: newBans };
          });

          get().addAuditLogEntry(
            serverId, "member_ban", bannedBy, bannedByUsername, "",
            userId, username, "user", undefined, reason,
          );

          toast.success("User Banned", `${username} has been banned from the server`);
        },

        unbanUser: async (serverId, userId) => {
          const supabase = createClient();

          const { error } = await supabase.from("server_bans").delete()
            .eq("server_id", serverId).eq("user_id", userId);

          if (error) {
            toast.error("Error", "Could not unban user");
            throw error;
          }

          set((state) => {
            const serverBans = state.bans.get(serverId) || [];
            const newBans = new Map(state.bans);
            newBans.set(serverId, serverBans.filter((b) => b.userId !== userId));
            return { bans: newBans };
          });

          toast.success("User Unbanned", "The user can now rejoin the server");
        },

        loadBans: async (serverId) => {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from("server_bans")
              .select(`*, user:profiles!server_bans_user_id_fkey(id, username, display_name, avatar_url), banner:profiles!server_bans_banned_by_fkey(id, username)`)
              .eq("server_id", serverId);

            if (error) throw error;

            const bans: Ban[] = (data || []).map((b) => {
              const user = b.user as unknown as Record<string, unknown>;
              const banner = b.banner as unknown as Record<string, unknown>;
              return {
                id: b.id, serverId: b.server_id, userId: b.user_id,
                username: (user?.username as string) || "Unknown",
                displayName: (user?.display_name as string) || "Unknown",
                avatar: (user?.avatar_url as string) || "",
                reason: b.reason || "", bannedBy: b.banned_by,
                bannedByUsername: (banner?.username as string) || "Unknown",
                bannedAt: new Date(b.banned_at),
              };
            });

            set((state) => {
              const newBans = new Map(state.bans);
              newBans.set(serverId, bans);
              return { bans: newBans };
            });
          } catch (err) {
            console.error("Error loading bans:", err);
          }
        },

        getBansByServer: (serverId) => {
          return get().bans.get(serverId) || [];
        },

        loadAuditLog: async (serverId) => {
          try {
            const supabase = createClient();
            const { data, error } = await supabase
              .from("audit_log")
              .select(`*, actor:profiles!audit_log_actor_id_fkey(id, username, avatar_url)`)
              .eq("server_id", serverId)
              .order("created_at", { ascending: false })
              .limit(100);

            if (error) throw error;

            const logs: AuditLogEntry[] = (data || []).map((entry) => {
              const actor = entry.actor as unknown as Record<string, unknown>;
              return {
                id: entry.id, serverId: entry.server_id,
                action: entry.action as AuditLogEntry["action"],
                actorId: entry.actor_id,
                actorUsername: (actor?.username as string) || "Unknown",
                actorAvatar: (actor?.avatar_url as string) || "",
                targetId: entry.target_id, targetName: entry.target_name,
                targetType: entry.target_type,
                changes: entry.changes as Record<string, { old: unknown; new: unknown }> | undefined,
                reason: entry.reason,
                createdAt: new Date(entry.created_at),
              };
            });

            set((state) => {
              const newLogs = new Map(state.auditLogs);
              newLogs.set(serverId, logs);
              return { auditLogs: newLogs };
            });
          } catch (err) {
            console.error("Error loading audit log:", err);
          }
        },

        getAuditLogByServer: (serverId) => {
          return get().auditLogs.get(serverId) || [];
        },

        addAuditLogEntry: async (serverId, action, actorId, actorUsername, actorAvatar, targetId, targetName, targetType, changes, reason) => {
          try {
            const supabase = createClient();
            const { data } = await supabase
              .from("audit_log")
              .insert({
                server_id: serverId, actor_id: actorId, action,
                target_id: targetId || null, target_name: targetName || null,
                target_type: targetType || null,
                changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
                reason: reason || null,
              })
              .select()
              .single();

            const newEntry: AuditLogEntry = {
              id: data?.id || `audit-${Date.now()}`, serverId,
              action: action as AuditLogEntry["action"],
              actorId, actorUsername, actorAvatar,
              targetId, targetName, targetType,
              changes, reason, createdAt: new Date(),
            };

            set((state) => {
              const serverLogs = state.auditLogs.get(serverId) || [];
              const newLogs = new Map(state.auditLogs);
              newLogs.set(serverId, [newEntry, ...serverLogs]);
              return { auditLogs: newLogs };
            });
          } catch (err) {
            console.error("Error adding audit log:", err);
          }
        },
      }),
      {
        name: "bedrock-server-management",
        partialize: (state) => ({
          serverSettingsTab: state.serverSettingsTab,
          channelSettingsTab: state.channelSettingsTab,
        }),
      },
    ),
    { name: "ServerManagement" },
  ),
);
