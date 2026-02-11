import type { AutoModSettings } from "./moderation";

export interface ServerSettings {
  description: string;
  banner: string | null;
  icon: string | null;
  vanityUrl: string | null;
  systemChannelId: string | null; // Where to send welcome messages
  rulesChannelId: string | null;
  autoMod: AutoModSettings;
  verificationLevel: VerificationLevel;
  explicitContentFilter: ExplicitContentFilter;
  defaultNotifications: DefaultNotificationLevel;
}

export type VerificationLevel = "none" | "low" | "medium" | "high";
export type ExplicitContentFilter = "disabled" | "members_without_roles" | "all_members";
export type DefaultNotificationLevel = "all_messages" | "only_mentions";

// Helper to get verification level description
export const getVerificationLevelDescription = (level: VerificationLevel): string => {
  const descriptions: Record<VerificationLevel, string> = {
    none: "Unrestricted - No verification required",
    low: "Low - Members must have a verified email",
    medium: "Medium - Members must be registered on Bedrock for longer than 5 minutes",
    high: "High - Members must be registered on Bedrock for longer than 10 minutes",
  };
  return descriptions[level];
};

// Helper to get explicit content filter description
export const getExplicitContentFilterDescription = (filter: ExplicitContentFilter): string => {
  const descriptions: Record<ExplicitContentFilter, string> = {
    disabled: "Don't scan any media content",
    members_without_roles: "Scan media content from members without a role",
    all_members: "Scan media content from all members",
  };
  return descriptions[filter];
};

// Helper to get default notification description
export const getDefaultNotificationDescription = (level: DefaultNotificationLevel): string => {
  const descriptions: Record<DefaultNotificationLevel, string> = {
    all_messages: "All Messages - Members will receive notifications for all messages",
    only_mentions: "Only @mentions - Members will only receive notifications when they are mentioned",
  };
  return descriptions[level];
};

// Default server settings
export const DEFAULT_SERVER_SETTINGS: Omit<ServerSettings, "icon" | "banner"> = {
  description: "",
  vanityUrl: null,
  systemChannelId: null,
  rulesChannelId: null,
  autoMod: {
    enabled: true,
    filterProfanity: true,
    filterSpam: true,
    filterLinks: false,
    filterInvites: false,
    filterMentionSpam: true,
    mentionLimit: 5,
  },
  verificationLevel: "none",
  explicitContentFilter: "disabled",
  defaultNotifications: "all_messages",
};
