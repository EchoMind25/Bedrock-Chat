import { Permission } from "../types/permissions";
import type { BedrockPermission } from "../types/server-definition";

/**
 * Maps portable BedrockPermission strings to the internal Permission bitmask.
 *
 * Some permissions map to multiple flags (e.g. moderate_members → KICK | BAN).
 * Some are reserved for future use and map to 0 (view_audit_log, use_slash_commands).
 */
const PERMISSION_MAP: Record<BedrockPermission, number> = {
  manage_server: Permission.MANAGE_SERVER,
  manage_channels: Permission.MANAGE_CHANNELS,
  manage_roles: Permission.MANAGE_ROLES,
  manage_messages: Permission.MANAGE_MESSAGES,
  moderate_members: Permission.KICK_MEMBERS | Permission.BAN_MEMBERS,
  send_messages: Permission.SEND_MESSAGES,
  read_messages: Permission.VIEW_CHANNELS | Permission.READ_MESSAGE_HISTORY,
  connect_voice: Permission.CONNECT,
  speak_voice: Permission.SPEAK,
  view_audit_log: 0, // Reserved for future implementation
  manage_webhooks: Permission.MANAGE_WEBHOOKS,
  embed_links: Permission.EMBED_LINKS,
  attach_files: Permission.ATTACH_FILES,
  add_reactions: Permission.ADD_REACTIONS,
  mention_everyone: Permission.MENTION_EVERYONE,
  use_slash_commands: 0, // Reserved for future implementation
};

/**
 * Converts an array of BedrockPermission strings into a bitmask number.
 * Unknown permissions are silently skipped (graceful degradation for forward compatibility).
 */
export function resolvePermissions(permissions: BedrockPermission[]): number {
  let bitmask = 0;
  for (const perm of permissions) {
    const value = PERMISSION_MAP[perm];
    if (value !== undefined) {
      bitmask |= value;
    }
  }
  return bitmask;
}
