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
  targetType?: "channel" | "role" | "user" | "invite" | "server" | "emoji" | "sticker" | "sound" | "event" | "webhook" | "bot" | "theme" | "welcome" | "template";
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
  | "invite_deactivate"
  | "message_delete"
  | "message_pin"
  | "message_unpin"
  // Server customization actions
  | "emoji_create"
  | "emoji_delete"
  | "sticker_create"
  | "sticker_delete"
  | "sound_create"
  | "sound_delete"
  | "event_create"
  | "event_update"
  | "event_cancel"
  | "webhook_create"
  | "webhook_update"
  | "webhook_delete"
  | "bot_create"
  | "bot_update"
  | "bot_delete"
  | "theme_update"
  | "welcome_screen_update"
  | "template_create";

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
    invite_deactivate: "Invite Deactivated",
    message_delete: "Message Deleted",
    message_pin: "Message Pinned",
    message_unpin: "Message Unpinned",
    emoji_create: "Emoji Created",
    emoji_delete: "Emoji Deleted",
    sticker_create: "Sticker Created",
    sticker_delete: "Sticker Deleted",
    sound_create: "Sound Created",
    sound_delete: "Sound Deleted",
    event_create: "Event Created",
    event_update: "Event Updated",
    event_cancel: "Event Cancelled",
    webhook_create: "Webhook Created",
    webhook_update: "Webhook Updated",
    webhook_delete: "Webhook Deleted",
    bot_create: "Bot Created",
    bot_update: "Bot Updated",
    bot_delete: "Bot Deleted",
    theme_update: "Theme Updated",
    welcome_screen_update: "Welcome Screen Updated",
    template_create: "Template Created",
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
    invite_deactivate: "XCircle",
    message_delete: "Trash2",
    message_pin: "Pin",
    message_unpin: "PinOff",
    emoji_create: "Smile",
    emoji_delete: "Trash2",
    sticker_create: "Sticker",
    sticker_delete: "Trash2",
    sound_create: "Volume2",
    sound_delete: "Trash2",
    event_create: "CalendarPlus",
    event_update: "CalendarCog",
    event_cancel: "CalendarX",
    webhook_create: "Webhook",
    webhook_update: "Edit",
    webhook_delete: "Trash2",
    bot_create: "Bot",
    bot_update: "Edit",
    bot_delete: "Trash2",
    theme_update: "Palette",
    welcome_screen_update: "PartyPopper",
    template_create: "Copy",
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
