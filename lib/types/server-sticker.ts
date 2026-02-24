export interface StickerPack {
  id: string;
  serverId: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  createdBy: string;
  stickers: Sticker[];
  createdAt: Date;
}

export interface Sticker {
  id: string;
  packId: string;
  serverId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  isAnimated: boolean;
  uploadedBy: string;
  useCount: number;
  createdAt: Date;
}

export const STICKER_LIMITS = {
  packsPerServer: 10,
  stickersPerPack: 30,
  maxFileSize: 524288, // 512KB
  maxDimension: 320,
  minDimension: 64,
  allowedMimeTypes: ["image/png", "image/gif", "image/webp", "application/json"],
} as const;

export const mapDbStickerPack = (row: Record<string, unknown>): Omit<StickerPack, "stickers"> => ({
  id: row.id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  description: (row.description as string) || null,
  bannerImageUrl: (row.banner_image_url as string) || null,
  createdBy: row.created_by as string,
  createdAt: new Date(row.created_at as string),
});

export const mapDbSticker = (row: Record<string, unknown>): Sticker => ({
  id: row.id as string,
  packId: row.pack_id as string,
  serverId: row.server_id as string,
  name: row.name as string,
  description: (row.description as string) || null,
  imageUrl: row.image_url as string,
  isAnimated: row.is_animated as boolean,
  uploadedBy: row.uploaded_by as string,
  useCount: (row.use_count as number) || 0,
  createdAt: new Date(row.created_at as string),
});
