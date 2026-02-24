export interface ServerEmoji {
  id: string;
  serverId: string;
  name: string;
  imageUrl: string;
  uploadedBy: string;
  isAnimated: boolean;
  useCount: number;
  createdAt: Date;
}

export const EMOJI_LIMITS = {
  static: 50,
  animated: 50,
  maxFileSize: 262144, // 256KB
  maxDimension: 128,
  minDimension: 32,
  nameMinLength: 2,
  nameMaxLength: 32,
  allowedMimeTypes: ["image/png", "image/gif", "image/webp"],
} as const;

// Custom emoji format in messages: <:name:id>
export const CUSTOM_EMOJI_REGEX = /<:([a-zA-Z0-9_]+):([a-f0-9-]+)>/g;

export const formatCustomEmoji = (name: string, id: string): string =>
  `<:${name}:${id}>`;

export const mapDbServerEmoji = (row: Record<string, unknown>): ServerEmoji => ({
  id: row.id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  imageUrl: row.image_url as string,
  uploadedBy: row.uploaded_by as string,
  isAnimated: row.is_animated as boolean,
  useCount: (row.use_count as number) || 0,
  createdAt: new Date(row.created_at as string),
});
