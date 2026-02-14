export type InviteTargetType = "channel" | "server" | "voice";

export interface ServerInvite {
  id: string;
  code: string; // 8-character code (e.g., "aBc123Xy")
  serverId: string;
  channelId: string | null; // Channel this invite is for (null for server-wide invites)
  targetType: InviteTargetType; // Scope of the invite
  inviterId: string; // User who created invite
  inviterUsername: string;
  inviterAvatar: string;

  // Settings
  maxUses: number; // 0 = unlimited
  expiresAt: Date | null; // null = never expires
  temporary: boolean; // Kick user on disconnect if they joined via this invite

  // Stats
  uses: number;
  createdAt: Date;
}

export type InviteExpirationOption = "30m" | "1h" | "6h" | "12h" | "1d" | "7d" | "never";
export type InviteMaxUsesOption = 0 | 1 | 5 | 10 | 25 | 50 | 100;

export interface InviteSettings {
  expiresAfter: InviteExpirationOption;
  maxUses: InviteMaxUsesOption;
  temporary: boolean;
}

// Helper to calculate expiration date
export const calculateExpirationDate = (option: InviteExpirationOption): Date | null => {
  if (option === "never") return null;

  const now = new Date();
  const durations: Record<Exclude<InviteExpirationOption, "never">, number> = {
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  };

  return new Date(now.getTime() + durations[option]);
};

// Helper to format expiration time remaining
export const formatTimeRemaining = (expiresAt: Date | null): string => {
  if (!expiresAt) return "Never";

  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Helper to check if invite is valid
export const isInviteValid = (invite: ServerInvite): boolean => {
  // Check if expired
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return false;
  }

  // Check if max uses reached
  if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
    return false;
  }

  return true;
};

// Generate random invite code
export const generateInviteCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Default invite settings
export const DEFAULT_INVITE_SETTINGS: InviteSettings = {
  expiresAfter: "7d",
  maxUses: 0,
  temporary: false,
};
