export interface Ban {
  id: string;
  serverId: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  reason: string;
  bannedBy: string;
  bannedByUsername: string;
  bannedAt: Date;
}

export interface AuditLogEntry {
  id: string;
  serverId: string;
  action: AuditLogAction;
  actorId: string;
  actorUsername: string;
  actorAvatar: string;
  targetId?: string;
  targetName?: string;
  targetType?: "channel" | "role" | "user" | "invite" | "server";
  changes?: Record<string, { old: unknown; new: unknown }>;
  reason?: string;
  createdAt: Date;
}

export type AuditLogAction =
  | "server_update"
  | "server_delete"
  | "channel_create"
  | "channel_update"
  | "channel_delete"
  | "role_create"
  | "role_update"
  | "role_delete"
  | "member_kick"
  | "member_ban"
  | "member_unban"
  | "invite_create"
  | "invite_delete"
  | "message_delete"
  | "message_pin"
  | "message_unpin";

export interface AutoModSettings {
  enabled: boolean;
  filterProfanity: boolean;
  filterSpam: boolean;
  filterLinks: boolean;
  filterInvites: boolean;
  filterMentionSpam: boolean;
  mentionLimit: number; // Max mentions per message (e.g., 5)
}

// Default AutoMod settings
export const DEFAULT_AUTOMOD_SETTINGS: AutoModSettings = {
  enabled: true,
  filterProfanity: true,
  filterSpam: true,
  filterLinks: false,
  filterInvites: false,
  filterMentionSpam: true,
  mentionLimit: 5,
};

// Helper to get action display name
export const getAuditLogActionName = (action: AuditLogAction): string => {
  const names: Record<AuditLogAction, string> = {
    server_update: "Server Updated",
    server_delete: "Server Deleted",
    channel_create: "Channel Created",
    channel_update: "Channel Updated",
    channel_delete: "Channel Deleted",
    role_create: "Role Created",
    role_update: "Role Updated",
    role_delete: "Role Deleted",
    member_kick: "Member Kicked",
    member_ban: "Member Banned",
    member_unban: "Member Unbanned",
    invite_create: "Invite Created",
    invite_delete: "Invite Deleted",
    message_delete: "Message Deleted",
    message_pin: "Message Pinned",
    message_unpin: "Message Unpinned",
  };
  return names[action];
};

// Helper to get action icon (emoji or lucide-react icon name)
export const getAuditLogActionIcon = (action: AuditLogAction): string => {
  const icons: Record<AuditLogAction, string> = {
    server_update: "Settings",
    server_delete: "Trash2",
    channel_create: "Plus",
    channel_update: "Edit",
    channel_delete: "Trash2",
    role_create: "Plus",
    role_update: "Edit",
    role_delete: "Trash2",
    member_kick: "UserMinus",
    member_ban: "Ban",
    member_unban: "UserPlus",
    invite_create: "Plus",
    invite_delete: "Trash2",
    message_delete: "Trash2",
    message_pin: "Pin",
    message_unpin: "PinOff",
  };
  return icons[action];
};

// Helper to format changes for display
export const formatAuditLogChanges = (changes: Record<string, { old: unknown; new: unknown }>): string => {
  const entries = Object.entries(changes);
  if (entries.length === 0) return "";

  return entries
    .map(([key, { old: oldVal, new: newVal }]) => {
      const formattedKey = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      return `${formattedKey}: ${oldVal} → ${newVal}`;
    })
    .join(", ");
};
