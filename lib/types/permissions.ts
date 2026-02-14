// Permission system using bitfield pattern (Discord-style)
export enum Permission {
  // General Server Permissions
  VIEW_CHANNELS = 1 << 0, // 1
  MANAGE_CHANNELS = 1 << 1, // 2
  MANAGE_SERVER = 1 << 2, // 4
  CREATE_INVITE = 1 << 3, // 8
  CHANGE_NICKNAME = 1 << 4, // 16
  MANAGE_NICKNAMES = 1 << 5, // 32
  KICK_MEMBERS = 1 << 6, // 64
  BAN_MEMBERS = 1 << 7, // 128
  MANAGE_ROLES = 1 << 8, // 256

  // Text Channel Permissions
  SEND_MESSAGES = 1 << 9, // 512
  MANAGE_MESSAGES = 1 << 10, // 1024
  EMBED_LINKS = 1 << 11, // 2048
  ATTACH_FILES = 1 << 12, // 4096
  READ_MESSAGE_HISTORY = 1 << 13, // 8192
  MENTION_EVERYONE = 1 << 14, // 16384
  ADD_REACTIONS = 1 << 15, // 32768

  // Voice Channel Permissions
  CONNECT = 1 << 16, // 65536
  SPEAK = 1 << 17, // 131072
  VIDEO = 1 << 18, // 262144
  MUTE_MEMBERS = 1 << 19, // 524288
  DEAFEN_MEMBERS = 1 << 20, // 1048576
  MOVE_MEMBERS = 1 << 21, // 2097152

  // Advanced Permissions
  ADMINISTRATOR = 1 << 22, // 4194304
}

export type PermissionValue = "allow" | "neutral" | "deny";

export interface PermissionOverride {
  id: string;
  targetType: "role" | "user";
  targetId: string;
  allow: number; // Bitfield of allowed permissions
  deny: number; // Bitfield of denied permissions
}

export interface Role {
  id: string;
  serverId: string;
  name: string;
  color: string; // OKLCH color string
  permissions: number; // Bitfield
  position: number; // Higher = more important
  mentionable: boolean;
  memberCount: number;
  memberIds?: string[]; // IDs of members assigned to this role
  isDefault: boolean; // @everyone role
  createdAt: Date;
}

// Helper functions for permission calculations
export const hasPermission = (permissions: number, permission: Permission): boolean => {
  // Administrator permission grants all permissions
  if ((permissions & Permission.ADMINISTRATOR) === Permission.ADMINISTRATOR) {
    return true;
  }
  return (permissions & permission) === permission;
};

export const addPermission = (permissions: number, permission: Permission): number => {
  return permissions | permission;
};

export const removePermission = (permissions: number, permission: Permission): number => {
  return permissions & ~permission;
};

export const togglePermission = (permissions: number, permission: Permission): number => {
  return permissions ^ permission;
};

// Permission categories for UI grouping
export const PERMISSION_CATEGORIES = {
  GENERAL: [
    { permission: Permission.VIEW_CHANNELS, name: "View Channels", description: "Allows members to view channels" },
    { permission: Permission.MANAGE_CHANNELS, name: "Manage Channels", description: "Allows members to create, edit, and delete channels" },
    { permission: Permission.MANAGE_SERVER, name: "Manage Server", description: "Allows members to change server settings" },
    { permission: Permission.CREATE_INVITE, name: "Create Invite", description: "Allows members to invite new people to the server" },
    { permission: Permission.CHANGE_NICKNAME, name: "Change Nickname", description: "Allows members to change their own nickname" },
    { permission: Permission.MANAGE_NICKNAMES, name: "Manage Nicknames", description: "Allows members to change other members' nicknames" },
    { permission: Permission.MANAGE_ROLES, name: "Manage Roles", description: "Allows members to create, edit, and delete roles" },
  ],
  MODERATION: [
    { permission: Permission.KICK_MEMBERS, name: "Kick Members", description: "Allows members to remove members from the server" },
    { permission: Permission.BAN_MEMBERS, name: "Ban Members", description: "Allows members to permanently ban members from the server" },
    { permission: Permission.MANAGE_MESSAGES, name: "Manage Messages", description: "Allows members to delete messages from other members" },
  ],
  TEXT: [
    { permission: Permission.SEND_MESSAGES, name: "Send Messages", description: "Allows members to send messages in text channels" },
    { permission: Permission.EMBED_LINKS, name: "Embed Links", description: "Allows links to be embedded in messages" },
    { permission: Permission.ATTACH_FILES, name: "Attach Files", description: "Allows members to upload files and images" },
    { permission: Permission.READ_MESSAGE_HISTORY, name: "Read Message History", description: "Allows members to read previous messages" },
    { permission: Permission.MENTION_EVERYONE, name: "Mention @everyone", description: "Allows members to use @everyone and @here" },
    { permission: Permission.ADD_REACTIONS, name: "Add Reactions", description: "Allows members to add reactions to messages" },
  ],
  VOICE: [
    { permission: Permission.CONNECT, name: "Connect", description: "Allows members to join voice channels" },
    { permission: Permission.SPEAK, name: "Speak", description: "Allows members to speak in voice channels" },
    { permission: Permission.VIDEO, name: "Video", description: "Allows members to share video in voice channels" },
    { permission: Permission.MUTE_MEMBERS, name: "Mute Members", description: "Allows members to mute other members in voice channels" },
    { permission: Permission.DEAFEN_MEMBERS, name: "Deafen Members", description: "Allows members to deafen other members in voice channels" },
    { permission: Permission.MOVE_MEMBERS, name: "Move Members", description: "Allows members to move members between voice channels" },
  ],
  ADVANCED: [
    { permission: Permission.ADMINISTRATOR, name: "Administrator", description: "Grants all permissions and bypasses all channel-specific permissions" },
  ],
} as const;

// Get all permissions from a category
export const getPermissionsFromCategory = (category: keyof typeof PERMISSION_CATEGORIES): Permission[] => {
  return PERMISSION_CATEGORIES[category].map((p) => p.permission);
};

// Calculate effective permissions with overrides
export const calculateEffectivePermissions = (
  rolePermissions: number,
  overrides?: PermissionOverride,
): number => {
  if (!overrides) return rolePermissions;

  // Administrator bypasses overrides
  if ((rolePermissions & Permission.ADMINISTRATOR) === Permission.ADMINISTRATOR) {
    return rolePermissions;
  }

  // Apply deny first, then allow
  let effective = rolePermissions;
  effective = effective & ~overrides.deny; // Remove denied permissions
  effective = effective | overrides.allow; // Add allowed permissions

  return effective;
};
