import type { AuditLogEntry, AuditLogAction } from "../types/moderation";

export function generateMockAuditLog(serverId: string): AuditLogEntry[] {
  const now = new Date();

  const actions: Array<{
    action: AuditLogAction;
    targetName: string;
    targetType: "channel" | "role" | "user" | "invite" | "server";
    reason?: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
  }> = [
    {
      action: "server_update",
      targetName: "Server",
      targetType: "server",
      changes: {
        name: { old: "Old Server Name", new: "Bedrock Community" },
      },
    },
    {
      action: "channel_create",
      targetName: "new-channel",
      targetType: "channel",
    },
    {
      action: "role_update",
      targetName: "Moderator",
      targetType: "role",
      changes: {
        permissions: { old: "Read/Write", new: "Read/Write/Kick" },
      },
    },
    {
      action: "member_ban",
      targetName: "spammer_user",
      targetType: "user",
      reason: "Spamming in general chat",
    },
    {
      action: "invite_create",
      targetName: "abc123XY",
      targetType: "invite",
    },
    {
      action: "channel_delete",
      targetName: "old-channel",
      targetType: "channel",
      reason: "Channel no longer needed",
    },
    {
      action: "role_create",
      targetName: "VIP",
      targetType: "role",
    },
    {
      action: "member_kick",
      targetName: "troublemaker",
      targetType: "user",
      reason: "Breaking server rules",
    },
    {
      action: "message_delete",
      targetName: "Message in #general",
      targetType: "channel",
      reason: "Inappropriate content",
    },
    {
      action: "member_unban",
      targetName: "reformed_user",
      targetType: "user",
      reason: "Ban appeal accepted",
    },
    {
      action: "channel_update",
      targetName: "general",
      targetType: "channel",
      changes: {
        slowmode: { old: "Off", new: "5 seconds" },
      },
    },
    {
      action: "invite_delete",
      targetName: "xyz789AB",
      targetType: "invite",
      reason: "Expired invite",
    },
  ];

  const actors = [
    { id: "current-user", username: "You", avatar: "👤" },
    { id: "user-123", username: "alice_dev", avatar: "👩‍💻" },
    { id: "user-456", username: "bob_admin", avatar: "🔧" },
  ];

  return actions.map((entry, index) => {
    const actor = actors[index % actors.length];
    const hoursAgo = index * 2 + 1; // Spread out over time

    return {
      id: `${serverId}-audit-${index}`,
      serverId,
      action: entry.action,
      actorId: actor.id,
      actorUsername: actor.username,
      actorAvatar: actor.avatar,
      targetId: `target-${index}`,
      targetName: entry.targetName,
      targetType: entry.targetType,
      changes: entry.changes,
      reason: entry.reason,
      createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
    };
  });
}

// Create a new audit log entry
export function createAuditLogEntry(
  serverId: string,
  action: AuditLogAction,
  actorId: string,
  actorUsername: string,
  actorAvatar: string,
  targetId?: string,
  targetName?: string,
  targetType?: "channel" | "role" | "user" | "invite" | "server",
  changes?: Record<string, { old: unknown; new: unknown }>,
  reason?: string,
): AuditLogEntry {
  return {
    id: `${serverId}-audit-${Date.now()}`,
    serverId,
    action,
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
}
