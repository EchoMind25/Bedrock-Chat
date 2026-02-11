import { Permission, type Role } from "../types/permissions";

// Generate default roles for a server
export function generateDefaultRoles(serverId: string): Role[] {
  const now = new Date();

  return [
    {
      id: `${serverId}-role-everyone`,
      serverId,
      name: "@everyone",
      color: "oklch(0.5 0 0)", // Gray
      permissions:
        Permission.VIEW_CHANNELS |
        Permission.SEND_MESSAGES |
        Permission.EMBED_LINKS |
        Permission.ATTACH_FILES |
        Permission.READ_MESSAGE_HISTORY |
        Permission.ADD_REACTIONS |
        Permission.CONNECT |
        Permission.SPEAK,
      position: 0,
      mentionable: false,
      memberCount: 100, // Mock count
      isDefault: true,
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    },
    {
      id: `${serverId}-role-admin`,
      serverId,
      name: "Admin",
      color: "oklch(0.6 0.2 30)", // Red
      permissions: Permission.ADMINISTRATOR,
      position: 2,
      mentionable: true,
      memberCount: 5,
      isDefault: false,
      createdAt: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000), // 80 days ago
    },
    {
      id: `${serverId}-role-mod`,
      serverId,
      name: "Moderator",
      color: "oklch(0.65 0.25 265)", // Purple
      permissions:
        Permission.VIEW_CHANNELS |
        Permission.MANAGE_MESSAGES |
        Permission.KICK_MEMBERS |
        Permission.BAN_MEMBERS |
        Permission.SEND_MESSAGES |
        Permission.EMBED_LINKS |
        Permission.ATTACH_FILES |
        Permission.READ_MESSAGE_HISTORY |
        Permission.MENTION_EVERYONE |
        Permission.ADD_REACTIONS |
        Permission.CONNECT |
        Permission.SPEAK |
        Permission.MUTE_MEMBERS |
        Permission.DEAFEN_MEMBERS,
      position: 1,
      mentionable: true,
      memberCount: 12,
      isDefault: false,
      createdAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000), // 75 days ago
    },
  ];
}

// Generate mock roles with various colors and permissions
export function generateMockRoles(serverId: string, count: number = 3): Role[] {
  const defaultRoles = generateDefaultRoles(serverId);
  if (count <= 3) return defaultRoles;

  const colors = [
    "oklch(0.7 0.25 150)", // Green
    "oklch(0.65 0.25 200)", // Blue
    "oklch(0.7 0.25 50)", // Yellow
    "oklch(0.6 0.25 330)", // Pink
    "oklch(0.65 0.2 100)", // Teal
  ];

  const roleNames = ["Member", "VIP", "Supporter", "Contributor", "Helper"];

  const additionalRoles: Role[] = [];
  const now = new Date();

  for (let i = 0; i < count - 3 && i < roleNames.length; i++) {
    additionalRoles.push({
      id: `${serverId}-role-${roleNames[i].toLowerCase()}`,
      serverId,
      name: roleNames[i],
      color: colors[i % colors.length],
      permissions:
        Permission.VIEW_CHANNELS |
        Permission.SEND_MESSAGES |
        Permission.EMBED_LINKS |
        Permission.ATTACH_FILES |
        Permission.READ_MESSAGE_HISTORY |
        Permission.ADD_REACTIONS |
        Permission.CONNECT |
        Permission.SPEAK,
      position: 0,
      mentionable: i < 2, // First 2 are mentionable
      memberCount: Math.floor(Math.random() * 50) + 10,
      isDefault: false,
      createdAt: new Date(now.getTime() - (70 - i * 10) * 24 * 60 * 60 * 1000),
    });
  }

  return [...defaultRoles, ...additionalRoles];
}

// Preset role colors for color picker
export const PRESET_ROLE_COLORS = [
  { name: "Default", color: "oklch(0.5 0 0)" }, // Gray
  { name: "Red", color: "oklch(0.6 0.2 30)" },
  { name: "Orange", color: "oklch(0.7 0.2 50)" },
  { name: "Yellow", color: "oklch(0.75 0.2 100)" },
  { name: "Green", color: "oklch(0.7 0.25 150)" },
  { name: "Cyan", color: "oklch(0.7 0.2 200)" },
  { name: "Blue", color: "oklch(0.65 0.25 265)" },
  { name: "Purple", color: "oklch(0.65 0.25 300)" },
  { name: "Pink", color: "oklch(0.7 0.25 330)" },
  { name: "Brown", color: "oklch(0.55 0.15 70)" },
  { name: "Black", color: "oklch(0.2 0 0)" },
  { name: "White", color: "oklch(0.95 0 0)" },
] as const;
