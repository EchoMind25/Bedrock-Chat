import type { ServerInvite } from "../types/invites";
import { generateInviteCode, calculateExpirationDate } from "../types/invites";

export function generateMockInvites(serverId: string, channelIds: string[]): ServerInvite[] {
  if (channelIds.length === 0) return [];

  const now = new Date();

  const invites: ServerInvite[] = [
    {
      id: `${serverId}-invite-1`,
      code: generateInviteCode(),
      serverId,
      channelId: channelIds[0],
      inviterId: "current-user",
      inviterUsername: "You",
      inviterAvatar: "👤",
      maxUses: 0, // Unlimited
      expiresAt: calculateExpirationDate("7d"),
      temporary: false,
      uses: 12,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: `${serverId}-invite-2`,
      code: generateInviteCode(),
      serverId,
      channelId: channelIds[0],
      inviterId: "user-123",
      inviterUsername: "alice_dev",
      inviterAvatar: "👩‍💻",
      maxUses: 25,
      expiresAt: calculateExpirationDate("1d"),
      temporary: false,
      uses: 8,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  // Add a third invite for larger servers
  if (channelIds.length > 3) {
    invites.push({
      id: `${serverId}-invite-3`,
      code: generateInviteCode(),
      serverId,
      channelId: channelIds[Math.floor(channelIds.length / 2)],
      inviterId: "user-456",
      inviterUsername: "bob_admin",
      inviterAvatar: "🔧",
      maxUses: 10,
      expiresAt: calculateExpirationDate("never"),
      temporary: true,
      uses: 3,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    });
  }

  return invites;
}

// Generate a fresh invite
export function createMockInvite(
  serverId: string,
  channelId: string,
  inviterId: string,
  inviterUsername: string,
  inviterAvatar: string,
  settings: {
    maxUses: number;
    expiresAfter: "30m" | "1h" | "6h" | "12h" | "1d" | "7d" | "never";
    temporary: boolean;
  },
): ServerInvite {
  return {
    id: `${serverId}-invite-${Date.now()}`,
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
}
