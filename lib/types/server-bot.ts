export type BotType = "custom" | "claude" | "webhook";
export type ClaudeTriggerMode = "mention" | "prefix" | "all_messages";

export interface ClaudeConfig {
  model: string;
  systemPrompt: string;
  triggerMode: ClaudeTriggerMode;
  prefix: string;
  allowedChannels: string[] | null;
  maxTokens: number;
  temperature: number;
  tools: string[] | null;
  personality: {
    name: string;
    traits: string[];
    tone: string;
  };
  rateLimit: {
    maxPerMinute: number;
    maxPerHour: number;
  };
}

export const DEFAULT_CLAUDE_CONFIG: ClaudeConfig = {
  model: "claude-sonnet-4-6",
  systemPrompt: "You are a helpful server assistant.",
  triggerMode: "mention",
  prefix: "!",
  allowedChannels: null,
  maxTokens: 1024,
  temperature: 0.7,
  tools: null,
  personality: {
    name: "Assistant",
    traits: ["helpful", "friendly"],
    tone: "conversational",
  },
  rateLimit: {
    maxPerMinute: 10,
    maxPerHour: 100,
  },
};

export interface ServerBot {
  id: string;
  serverId: string;
  name: string;
  avatarUrl: string | null;
  description: string | null;
  botType: BotType;
  token: string;
  claudeConfig: ClaudeConfig | null;
  permissions: number;
  isActive: boolean;
  createdBy: string;
  messagesSent: number;
  lastActiveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotCommand {
  id: string;
  botId: string;
  name: string;
  description: string | null;
  trigger: string;
  responseType: "text" | "embed" | "action";
  systemPromptOverride: string | null;
  createdAt: Date;
}

export const BOT_LIMITS = {
  maxPerServer: 10,
  maxCommandsPerBot: 50,
  nameMaxLength: 100,
  descriptionMaxLength: 500,
} as const;

export const mapDbServerBot = (row: Record<string, unknown>): ServerBot => ({
  id: row.id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  avatarUrl: (row.avatar_url as string) || null,
  description: (row.description as string) || null,
  botType: row.bot_type as BotType,
  token: row.token as string,
  claudeConfig: (row.claude_config as ClaudeConfig) || null,
  permissions: (row.permissions as number) || 0,
  isActive: row.is_active as boolean,
  createdBy: row.created_by as string,
  messagesSent: (row.messages_sent as number) || 0,
  lastActiveAt: row.last_active_at ? new Date(row.last_active_at as string) : null,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

export const mapDbBotCommand = (row: Record<string, unknown>): BotCommand => ({
  id: row.id as string,
  botId: row.bot_id as string,
  name: row.name as string,
  description: (row.description as string) || null,
  trigger: row.trigger as string,
  responseType: row.response_type as BotCommand["responseType"],
  systemPromptOverride: (row.system_prompt_override as string) || null,
  createdAt: new Date(row.created_at as string),
});
