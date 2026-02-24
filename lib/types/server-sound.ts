export interface ServerSound {
  id: string;
  serverId: string;
  name: string;
  audioUrl: string;
  durationMs: number;
  volume: number;
  uploadedBy: string;
  useCount: number;
  emoji: string | null;
  createdAt: Date;
}

export const SOUND_LIMITS = {
  maxPerServer: 50,
  maxFileSize: 1048576, // 1MB
  maxDuration: 10000, // 10 seconds
  allowedMimeTypes: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/webm"],
} as const;

export const mapDbServerSound = (row: Record<string, unknown>): ServerSound => ({
  id: row.id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  audioUrl: row.audio_url as string,
  durationMs: row.duration_ms as number,
  volume: row.volume as number,
  uploadedBy: row.uploaded_by as string,
  useCount: (row.use_count as number) || 0,
  emoji: (row.emoji as string) || null,
  createdAt: new Date(row.created_at as string),
});
