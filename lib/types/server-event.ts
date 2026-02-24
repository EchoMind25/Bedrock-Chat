export type EventStatus = "scheduled" | "active" | "completed" | "cancelled";
export type EventType = "voice" | "stage" | "external";
export type RSVPStatus = "interested" | "going" | "not_going";

export interface ServerEvent {
  id: string;
  serverId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  eventType: EventType;
  channelId: string | null;
  externalLocation: string | null;
  startsAt: Date;
  endsAt: Date | null;
  status: EventStatus;
  createdBy: string;
  interestedCount: number;
  recurrenceRule: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Client-side enrichment
  currentUserRsvp?: RSVPStatus;
}

export interface EventRSVP {
  eventId: string;
  userId: string;
  status: RSVPStatus;
  createdAt: Date;
}

export const mapDbServerEvent = (row: Record<string, unknown>): ServerEvent => ({
  id: row.id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  description: (row.description as string) || null,
  imageUrl: (row.image_url as string) || null,
  eventType: row.event_type as EventType,
  channelId: (row.channel_id as string) || null,
  externalLocation: (row.external_location as string) || null,
  startsAt: new Date(row.starts_at as string),
  endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
  status: row.status as EventStatus,
  createdBy: row.created_by as string,
  interestedCount: (row.interested_count as number) || 0,
  recurrenceRule: (row.recurrence_rule as string) || null,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});
