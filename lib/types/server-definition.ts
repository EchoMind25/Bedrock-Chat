/**
 * Bedrock Import Schema v1
 *
 * This schema is the contract for ALL server creation paths:
 * - Pre-built templates
 * - Discord structure imports
 * - Future platform imports (Slack, Telegram, Matrix)
 *
 * PRIVACY: This schema NEVER contains user data, messages, or PII.
 * It describes server STRUCTURE only.
 */

export interface ServerDefinition {
  /** Schema version — ALWAYS check this first */
  schema_version: "1.0";

  /** Source platform identifier */
  source: "template" | "discord" | "slack" | "telegram" | "manual";

  /** Server metadata */
  server: {
    name: string;
    description?: string;
    icon_url?: string;
    /** Is this server expected to have teen members? Triggers family-safe defaults */
    family_safe: boolean;
  };

  /** Channel categories (folders) */
  categories: CategoryDefinition[];

  /** Channels within categories */
  channels: ChannelDefinition[];

  /** Role hierarchy */
  roles: RoleDefinition[];

  /** Platform-specific metadata (non-PII only) */
  metadata?: Record<string, unknown>;
}

export interface CategoryDefinition {
  /** Unique ID within this definition (not a database ID) */
  ref_id: string;
  name: string;
  position: number;
}

export interface ChannelDefinition {
  ref_id: string;
  name: string;
  type: "text" | "voice" | "announcement";
  /** Reference to parent category ref_id */
  category_ref?: string;
  topic?: string;
  position: number;
  /** Voice channel settings */
  voice_config?: {
    bitrate?: number;
    user_limit?: number;
  };
  /** NSFW flag — if true AND server.family_safe, this channel is blocked */
  nsfw?: boolean;
}

export interface RoleDefinition {
  ref_id: string;
  name: string;
  color?: string;
  position: number;
  /** Bedrock permission flags (NOT Discord permission integers) */
  permissions: BedrockPermission[];
  /** Is this the default role for new members? */
  is_default?: boolean;
}

export type BedrockPermission =
  | "manage_server"
  | "manage_channels"
  | "manage_roles"
  | "manage_messages"
  | "moderate_members"
  | "send_messages"
  | "read_messages"
  | "connect_voice"
  | "speak_voice"
  | "view_audit_log"
  | "manage_webhooks"
  | "embed_links"
  | "attach_files"
  | "add_reactions"
  | "mention_everyone"
  | "use_slash_commands";
