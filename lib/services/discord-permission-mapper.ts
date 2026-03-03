/**
 * Discord-to-Bedrock Permission Mapper
 *
 * Maps Discord permission bitfield integers to Bedrock's named permission strings.
 *
 * Discord uses a single bigint bitfield where each bit represents a permission.
 * Bedrock uses named string permissions (see BedrockPermission type).
 *
 * IMPORTANT: Some Discord permissions have no Bedrock equivalent.
 * These are returned in the `unmapped` array for the UI to display as warnings.
 *
 * Discord permission reference: https://discord.com/developers/docs/topics/permissions
 */

import type { BedrockPermission } from "../types/server-definition";

// ---------------------------------------------------------------------------
// Discord permission flags (as bigints matching Discord's bitfield positions)
// ---------------------------------------------------------------------------

const DISCORD_PERMISSIONS = {
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS: 1n << 30n,
  USE_SLASH_COMMANDS: 1n << 31n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  USE_SOUNDBOARD: 1n << 42n,
} as const;

// ---------------------------------------------------------------------------
// Mapping: Discord flag name → Bedrock permission(s)
// ---------------------------------------------------------------------------

const PERMISSION_MAP: Partial<Record<string, BedrockPermission[]>> = {
  ADMINISTRATOR: [
    "manage_server",
    "manage_channels",
    "manage_roles",
    "manage_messages",
    "moderate_members",
    "view_audit_log",
  ],
  MANAGE_CHANNELS: ["manage_channels"],
  MANAGE_GUILD: ["manage_server"],
  VIEW_AUDIT_LOG: ["view_audit_log"],
  SEND_MESSAGES: ["send_messages"],
  MANAGE_MESSAGES: ["manage_messages"],
  EMBED_LINKS: ["embed_links"],
  ATTACH_FILES: ["attach_files"],
  READ_MESSAGE_HISTORY: ["read_messages"],
  MENTION_EVERYONE: ["mention_everyone"],
  ADD_REACTIONS: ["add_reactions"],
  CONNECT: ["connect_voice"],
  SPEAK: ["speak_voice"],
  MANAGE_ROLES: ["manage_roles"],
  MANAGE_WEBHOOKS: ["manage_webhooks"],
  USE_SLASH_COMMANDS: ["use_slash_commands"],
  KICK_MEMBERS: ["moderate_members"],
  BAN_MEMBERS: ["moderate_members"],
  VIEW_CHANNEL: ["read_messages"],
  SEND_MESSAGES_IN_THREADS: ["send_messages"],
  MANAGE_THREADS: ["manage_messages"],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PermissionMapResult {
  /** Bedrock permissions successfully mapped (deduplicated) */
  permissions: BedrockPermission[];
  /** Discord permission names that have no Bedrock equivalent */
  unmapped: string[];
}

/**
 * Decomposes a Discord permission bitfield into individual flags,
 * maps each to Bedrock equivalents, deduplicates, and returns both
 * the mapped permissions and any unmapped Discord-only permissions.
 *
 * @param bitfield Discord permission bitfield (bigint or numeric string)
 */
export function mapDiscordPermissions(
  bitfield: bigint | string,
): PermissionMapResult {
  const bits = typeof bitfield === "string" ? BigInt(bitfield) : bitfield;

  const permissions = new Set<BedrockPermission>();
  const unmapped: string[] = [];

  for (const [name, flag] of Object.entries(DISCORD_PERMISSIONS)) {
    // Check if this permission bit is set
    if ((bits & flag) !== 0n) {
      const mapped = PERMISSION_MAP[name];
      if (mapped) {
        for (const perm of mapped) {
          permissions.add(perm);
        }
      } else {
        unmapped.push(formatPermissionName(name));
      }
    }
  }

  return {
    permissions: [...permissions],
    unmapped,
  };
}

/**
 * Formats a SCREAMING_SNAKE_CASE permission name into a readable label.
 * "MANAGE_EMOJIS" → "Manage Emojis"
 */
function formatPermissionName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * All known Bedrock permissions for use in permission checkboxes.
 */
export const ALL_BEDROCK_PERMISSIONS: {
  value: BedrockPermission;
  label: string;
  category: "general" | "text" | "voice" | "moderation";
}[] = [
  { value: "read_messages", label: "Read Messages", category: "text" },
  { value: "send_messages", label: "Send Messages", category: "text" },
  { value: "embed_links", label: "Embed Links", category: "text" },
  { value: "attach_files", label: "Attach Files", category: "text" },
  { value: "add_reactions", label: "Add Reactions", category: "text" },
  { value: "mention_everyone", label: "Mention Everyone", category: "text" },
  {
    value: "use_slash_commands",
    label: "Use Slash Commands",
    category: "text",
  },
  { value: "connect_voice", label: "Connect to Voice", category: "voice" },
  { value: "speak_voice", label: "Speak in Voice", category: "voice" },
  {
    value: "manage_messages",
    label: "Manage Messages",
    category: "moderation",
  },
  {
    value: "moderate_members",
    label: "Moderate Members",
    category: "moderation",
  },
  {
    value: "manage_channels",
    label: "Manage Channels",
    category: "general",
  },
  { value: "manage_roles", label: "Manage Roles", category: "general" },
  { value: "manage_server", label: "Manage Server", category: "general" },
  {
    value: "manage_webhooks",
    label: "Manage Webhooks",
    category: "general",
  },
  {
    value: "view_audit_log",
    label: "View Audit Log",
    category: "general",
  },
];
