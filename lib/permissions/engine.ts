/**
 * Bedrock Permission Engine
 *
 * 4-layer hierarchical permission system:
 *   Layer 1: Platform Role (super_admin bypasses everything)
 *   Layer 2: Server Role (owner > admin > moderator > custom > default)
 *   Layer 3: Channel Override (per-channel allow/deny per role)
 *   Layer 4: Family Override (parent monitoring access to teen servers)
 *
 * Every check returns { allowed, reason, layer } for full transparency.
 * This is the GAMER CODE: no hidden permissions, no secret monitoring.
 */

import {
  Permission,
  hasPermission as hasBitfieldPermission,
  calculateHierarchicalPermissions,
  PERMISSION_CATEGORIES,
  type Role,
  type ChannelPermissionOverride,
  type CategoryPermissionOverride,
  type ServerPermission,
} from "@/lib/types/permissions";
import type { BedrockPermission } from "@/lib/types/server-definition";
import type { PlatformRole } from "@/lib/types/platform-role";
import { PLATFORM_ROLE_HIERARCHY } from "@/lib/types/platform-role";
import { getMonitoringPermissions } from "@/lib/family/monitoring";
import type { MonitoringLevel } from "@/lib/types/family";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  layer: 1 | 2 | 3 | 4;
}

export interface PermissionContext {
  /** User's platform role from profiles table */
  platformRole: PlatformRole;
  /** User's server_members.role (owner/admin/moderator/member) */
  serverMemberRole: "owner" | "admin" | "moderator" | "member" | null;
  /** All custom roles the user has in this server */
  userRoles: Role[];
  /** The @everyone default role for this server */
  defaultRole: Role | null;
  /** Channel override data (if checking a specific channel) */
  channelOverrides: ChannelPermissionOverride[];
  /** Category override data (if channel is in a category) */
  categoryOverrides: CategoryPermissionOverride[];
  /** Category ID for the channel (if applicable) */
  categoryId?: string;
  /** Family monitoring: is the current user a parent viewing a teen's server? */
  isParentViewing: boolean;
  /** Family monitoring level (1-4) if parent is viewing teen's server */
  monitoringLevel: MonitoringLevel | null;
  /** The user's own ID (for user-specific overrides) */
  userId: string;
  /** Channel ID being checked (if applicable) */
  channelId: string | null;
}

// ---------------------------------------------------------------------------
// Portable permission → bitfield mapping
// ---------------------------------------------------------------------------

const BEDROCK_TO_BITFIELD: Record<BedrockPermission, number> = {
  manage_server: Permission.MANAGE_SERVER,
  manage_channels: Permission.MANAGE_CHANNELS,
  manage_roles: Permission.MANAGE_ROLES,
  manage_messages: Permission.MANAGE_MESSAGES,
  moderate_members: Permission.KICK_MEMBERS | Permission.BAN_MEMBERS,
  send_messages: Permission.SEND_MESSAGES,
  read_messages: Permission.VIEW_CHANNELS | Permission.READ_MESSAGE_HISTORY,
  connect_voice: Permission.CONNECT,
  speak_voice: Permission.SPEAK,
  view_audit_log: 0, // Handled by Layer 2 server member role check
  manage_webhooks: Permission.MANAGE_WEBHOOKS,
  embed_links: Permission.EMBED_LINKS,
  attach_files: Permission.ATTACH_FILES,
  add_reactions: Permission.ADD_REACTIONS,
  mention_everyone: Permission.MENTION_EVERYONE,
  use_slash_commands: Permission.SEND_MESSAGES, // Maps to send_messages capability
};

/**
 * Convert a BedrockPermission string to its bitmask value.
 * Returns 0 for unknown permissions (forward compatibility).
 */
export function bedrockPermissionToBitfield(perm: BedrockPermission): number {
  return BEDROCK_TO_BITFIELD[perm] ?? 0;
}

// ---------------------------------------------------------------------------
// Core permission check
// ---------------------------------------------------------------------------

/**
 * Check if a user has a specific permission.
 *
 * Evaluates all 4 layers in order:
 *   1. Platform role (super_admin/admin bypass)
 *   2. Server role base permissions
 *   3. Channel overrides (category → channel → user-specific)
 *   4. Family override (parent monitoring)
 *
 * Returns the decision, a human-readable reason, and which layer decided.
 */
export function checkPermission(
  permission: BedrockPermission,
  context: PermissionContext,
): PermissionCheckResult {
  const bitfield = bedrockPermissionToBitfield(permission);

  // -----------------------------------------------------------------------
  // Layer 1: Platform role
  // -----------------------------------------------------------------------
  if (context.platformRole === "super_admin") {
    return {
      allowed: true,
      reason: "Platform super admin — all permissions granted",
      layer: 1,
    };
  }

  if (
    context.platformRole === "admin" &&
    PLATFORM_ROLE_HIERARCHY[context.platformRole] >= 4
  ) {
    return {
      allowed: true,
      reason: "Platform admin — server permissions bypassed",
      layer: 1,
    };
  }

  // -----------------------------------------------------------------------
  // Layer 2: Server role
  // -----------------------------------------------------------------------

  // Server owner has all permissions
  if (context.serverMemberRole === "owner") {
    return {
      allowed: true,
      reason: "Server owner — all permissions granted",
      layer: 2,
    };
  }

  // No server membership at all → denied (unless family override applies)
  if (!context.serverMemberRole) {
    // Check Layer 4 family override before denying
    if (context.isParentViewing && context.monitoringLevel) {
      return checkFamilyOverride(permission, context);
    }
    return {
      allowed: false,
      reason: "Not a member of this server",
      layer: 2,
    };
  }

  // special case: view_audit_log requires admin role (owner already returned above)
  if (permission === "view_audit_log") {
    const allowed = context.serverMemberRole === "admin";
    return {
      allowed,
      reason: allowed
        ? "Server admin can view audit log"
        : "Only server owners and admins can view the audit log",
      layer: 2,
    };
  }

  // Calculate base permissions from all user roles + default role
  let basePermissions = 0;

  if (context.defaultRole) {
    basePermissions |= context.defaultRole.permissions;
  }

  for (const role of context.userRoles) {
    basePermissions |= role.permissions;
  }

  // Admin bitfield check — ADMINISTRATOR grants everything
  if (hasBitfieldPermission(basePermissions, Permission.ADMINISTRATOR)) {
    return {
      allowed: true,
      reason: "Has Administrator role — all permissions granted",
      layer: 2,
    };
  }

  // -----------------------------------------------------------------------
  // Layer 3: Channel overrides (if checking a specific channel)
  // -----------------------------------------------------------------------
  if (context.channelId && bitfield > 0) {
    // Use the full hierarchical calculation: base → category → channel → user
    const roleIds = context.userRoles.map((r) => r.id);
    if (context.defaultRole) {
      roleIds.push(context.defaultRole.id);
    }

    // Build ServerPermission array from roles
    const serverPermissions: ServerPermission[] = [];
    if (context.defaultRole) {
      serverPermissions.push({
        id: context.defaultRole.id,
        serverId: context.defaultRole.serverId,
        roleId: context.defaultRole.id,
        permissions: context.defaultRole.permissions,
      });
    }
    for (const role of context.userRoles) {
      serverPermissions.push({
        id: role.id,
        serverId: role.serverId,
        roleId: role.id,
        permissions: role.permissions,
      });
    }

    const effectivePermissions = calculateHierarchicalPermissions(
      context.userId,
      context.channelId,
      {
        serverPermissions,
        categoryOverrides: context.categoryOverrides,
        channelOverrides: context.channelOverrides,
        userRoles: roleIds,
        categoryId: context.categoryId,
      },
    );

    const allowed = (effectivePermissions & bitfield) === bitfield;

    return {
      allowed,
      reason: allowed
        ? `Permission granted (channel-level effective permissions)`
        : `Permission denied — not granted by role or channel overrides`,
      layer: 3,
    };
  }

  // -----------------------------------------------------------------------
  // Layer 2 continued: Server-level check (no channel context)
  // -----------------------------------------------------------------------
  if (bitfield > 0) {
    const allowed = (basePermissions & bitfield) === bitfield;

    if (allowed) {
      return {
        allowed: true,
        reason: "Granted by server role permissions",
        layer: 2,
      };
    }
  }

  // -----------------------------------------------------------------------
  // Layer 4: Family override
  // -----------------------------------------------------------------------
  if (context.isParentViewing && context.monitoringLevel) {
    return checkFamilyOverride(permission, context);
  }

  return {
    allowed: false,
    reason: "Permission not granted by any role",
    layer: 2,
  };
}

// ---------------------------------------------------------------------------
// Layer 4: Family override helper
// ---------------------------------------------------------------------------

function checkFamilyOverride(
  permission: BedrockPermission,
  context: PermissionContext,
): PermissionCheckResult {
  if (!context.monitoringLevel) {
    return {
      allowed: false,
      reason: "No family monitoring level set",
      layer: 4,
    };
  }

  const monPerms = getMonitoringPermissions(context.monitoringLevel);

  // Parents can always view — read-only access based on monitoring level
  const readPermissions: BedrockPermission[] = ["read_messages"];
  if (readPermissions.includes(permission) && monPerms.canReadMessages) {
    return {
      allowed: true,
      reason: `Parent monitoring (level ${context.monitoringLevel}) — read access granted`,
      layer: 4,
    };
  }

  // Parents can never write/manage via monitoring override
  return {
    allowed: false,
    reason: `Parent monitoring does not grant "${permission}" — view-only access`,
    layer: 4,
  };
}

// ---------------------------------------------------------------------------
// Batch permission check (for UI — check all permissions at once)
// ---------------------------------------------------------------------------

/** All BedrockPermissions in defined order */
export const ALL_BEDROCK_PERMISSIONS: BedrockPermission[] = [
  "read_messages",
  "send_messages",
  "embed_links",
  "attach_files",
  "add_reactions",
  "mention_everyone",
  "manage_messages",
  "manage_channels",
  "manage_server",
  "manage_roles",
  "moderate_members",
  "connect_voice",
  "speak_voice",
  "view_audit_log",
  "manage_webhooks",
  "use_slash_commands",
];

/** Group permissions by category for UI display */
export const BEDROCK_PERMISSION_GROUPS = {
  General: [
    "read_messages",
    "manage_channels",
    "manage_server",
    "manage_roles",
    "view_audit_log",
  ] as BedrockPermission[],
  Text: [
    "send_messages",
    "embed_links",
    "attach_files",
    "add_reactions",
    "mention_everyone",
    "manage_messages",
    "use_slash_commands",
  ] as BedrockPermission[],
  Voice: ["connect_voice", "speak_voice"] as BedrockPermission[],
  Moderation: ["moderate_members", "manage_webhooks"] as BedrockPermission[],
} as const;

/** Plain-language descriptions for each permission (parent-friendly) */
export const PERMISSION_DESCRIPTIONS: Record<BedrockPermission, string> = {
  manage_server: "Can change server settings like name, icon, and description",
  manage_channels: "Can create, edit, and delete channels",
  manage_roles: "Can create, edit, and delete roles and their permissions",
  manage_messages: "Can delete or edit other people's messages",
  moderate_members: "Can mute, kick, or ban members from the server",
  send_messages: "Can send messages in text channels",
  read_messages: "Can see channels and read messages",
  connect_voice: "Can join voice channels",
  speak_voice: "Can talk in voice channels",
  view_audit_log: "Can see a history of all changes made to the server",
  manage_webhooks: "Can create and manage webhook integrations",
  embed_links: "Links they share will show a preview",
  attach_files: "Can upload images and files",
  add_reactions: "Can add emoji reactions to messages",
  mention_everyone: "Can use @everyone to notify all members",
  use_slash_commands: "Can use slash commands in channels",
};

/**
 * Check all permissions at once and return a map.
 * Used by the my-permissions UI to show what a user can/cannot do.
 */
export function checkAllPermissions(
  context: PermissionContext,
): Map<BedrockPermission, PermissionCheckResult> {
  const results = new Map<BedrockPermission, PermissionCheckResult>();
  for (const perm of ALL_BEDROCK_PERMISSIONS) {
    results.set(perm, checkPermission(perm, context));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Effective permissions for a bitmask (quick check without context building)
// ---------------------------------------------------------------------------

/**
 * Get the list of BedrockPermission strings that a bitmask grants.
 * Useful for displaying what a role can do in plain English.
 */
export function bitmaskToBedrockPermissions(bitmask: number): BedrockPermission[] {
  const result: BedrockPermission[] = [];

  // ADMINISTRATOR grants everything
  if (hasBitfieldPermission(bitmask, Permission.ADMINISTRATOR)) {
    return [...ALL_BEDROCK_PERMISSIONS];
  }

  for (const perm of ALL_BEDROCK_PERMISSIONS) {
    const bits = BEDROCK_TO_BITFIELD[perm];
    if (bits > 0 && (bitmask & bits) === bits) {
      result.push(perm);
    }
  }

  return result;
}

/**
 * Get the highest role for display purposes.
 * Returns the role with the highest position value.
 */
export function getHighestRole(roles: Role[]): Role | null {
  if (roles.length === 0) return null;
  return roles.reduce((highest, role) =>
    role.position > highest.position ? role : highest,
  );
}

// ---------------------------------------------------------------------------
// Audit log types (for API route serialization)
// ---------------------------------------------------------------------------

export interface PermissionAuditEntry {
  id: string;
  serverId: string;
  changedBy: string;
  action:
    | "role_created"
    | "role_updated"
    | "role_deleted"
    | "role_assigned"
    | "role_removed"
    | "override_set"
    | "override_removed"
    | "member_permissions_changed";
  targetType: "role" | "channel_override" | "category_override" | "member";
  targetId: string;
  changes: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    [key: string]: unknown;
  };
  createdAt: Date;
}

/**
 * Map a raw DB row to a typed PermissionAuditEntry.
 */
export function mapAuditEntry(row: Record<string, unknown>): PermissionAuditEntry {
  return {
    id: row.id as string,
    serverId: row.server_id as string,
    changedBy: row.changed_by as string,
    action: row.action as PermissionAuditEntry["action"],
    targetType: row.target_type as PermissionAuditEntry["targetType"],
    targetId: row.target_id as string,
    changes: (row.changes as PermissionAuditEntry["changes"]) ?? {},
    createdAt: new Date(row.created_at as string),
  };
}
