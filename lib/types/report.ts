export type ReportReason =
  | "csam"
  | "harassment"
  | "spam"
  | "hate_speech"
  | "violence"
  | "self_harm"
  | "impersonation"
  | "other";

export interface Report {
  id: string;
  reporter_id: string;
  message_id: string;
  channel_id: string;
  server_id: string;
  reason: ReportReason;
  description: string;
  status: "pending" | "reviewing" | "resolved" | "escalated";
  message_content_snapshot: string;
  message_author_id: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  resolution?: string;
}
