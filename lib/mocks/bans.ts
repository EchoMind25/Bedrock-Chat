import type { Ban } from "../types/moderation";

export function generateMockBans(serverId: string): Ban[] {
  const now = new Date();

  // Some servers have bans, some don't
  if (Math.random() > 0.7) {
    return [];
  }

  const bannedUsers = [
    {
      userId: "banned-1",
      username: "spammer_bot",
      displayName: "Spammer Bot",
      avatar: "🤖",
      reason: "Automated spamming in multiple channels",
      bannedBy: "current-user",
      bannedByUsername: "You",
      daysAgo: 14,
    },
    {
      userId: "banned-2",
      username: "toxic_user",
      displayName: "Toxic User",
      avatar: "😠",
      reason: "Harassment and toxic behavior toward other members",
      bannedBy: "user-123",
      bannedByUsername: "alice_dev",
      daysAgo: 7,
    },
    {
      userId: "banned-3",
      username: "rule_breaker",
      displayName: "Rule Breaker",
      avatar: "⚠️",
      reason: "Repeated violations of server rules after multiple warnings",
      bannedBy: "user-456",
      bannedByUsername: "bob_admin",
      daysAgo: 3,
    },
  ];

  // Return 0-3 bans randomly
  const count = Math.floor(Math.random() * 3) + 1;

  return bannedUsers.slice(0, count).map((user, index) => ({
    id: `${serverId}-ban-${index}`,
    serverId,
    userId: user.userId,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    reason: user.reason,
    bannedBy: user.bannedBy,
    bannedByUsername: user.bannedByUsername,
    bannedAt: new Date(now.getTime() - user.daysAgo * 24 * 60 * 60 * 1000),
  }));
}

// Create a new ban entry
export function createMockBan(
  serverId: string,
  userId: string,
  username: string,
  displayName: string,
  avatar: string,
  reason: string,
  bannedBy: string,
  bannedByUsername: string,
): Ban {
  return {
    id: `${serverId}-ban-${Date.now()}`,
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
}
