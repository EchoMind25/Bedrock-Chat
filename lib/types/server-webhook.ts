export type WebhookType = "incoming" | "outgoing";
export type WebhookEvent = "message_create" | "member_join" | "member_leave" | "event_create";

export interface ServerWebhook {
  id: string;
  serverId: string;
  channelId: string;
  name: string;
  avatarUrl: string | null;
  token: string;
  type: WebhookType;
  url: string | null;
  events: WebhookEvent[];
  createdBy: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const WEBHOOK_LIMITS = {
  maxPerServer: 15,
  nameMaxLength: 100,
  urlMaxLength: 2000,
} as const;

export const mapDbServerWebhook = (row: Record<string, unknown>): ServerWebhook => ({
  id: row.id as string,
  serverId: row.server_id as string,
  channelId: row.channel_id as string,
  name: row.name as string,
  avatarUrl: (row.avatar_url as string) || null,
  token: row.token as string,
  type: row.type as WebhookType,
  url: (row.url as string) || null,
  events: (row.events as WebhookEvent[]) || [],
  createdBy: row.created_by as string,
  isActive: row.is_active as boolean,
  lastUsedAt: row.last_used_at ? new Date(row.last_used_at as string) : null,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});
