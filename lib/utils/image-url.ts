/**
 * Supabase Image Transformation utility.
 *
 * Converts a Supabase Storage public URL into a transform URL that
 * serves a resized variant via CDN. Non-Supabase URLs (blob:, data:,
 * external) pass through unchanged so local previews still work.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

interface TransformOptions {
  width?: number;
  height?: number;
  /** 1-100, default 80 */
  quality?: number;
}

/**
 * Returns a Supabase Image Transform URL for the given storage URL.
 * Blob/data URLs and non-Supabase URLs pass through unchanged.
 */
export function getImageUrl(
  url: string | null | undefined,
  options?: TransformOptions,
): string | undefined {
  if (!url) return undefined;

  // Local previews — pass through
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;

  // No transforms requested — return as-is
  if (!options?.width && !options?.height) return url;

  // Only transform Supabase storage URLs
  if (!url.includes("/storage/v1/object/")) return url;

  try {
    const u = new URL(url);
    // Swap the /object/ segment for /render/image/ (Supabase transform endpoint)
    u.pathname = u.pathname.replace(
      "/storage/v1/object/",
      "/storage/v1/render/image/",
    );
    if (options.width) u.searchParams.set("width", String(options.width));
    if (options.height) u.searchParams.set("height", String(options.height));
    if (options.quality) u.searchParams.set("quality", String(options.quality));
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Pixel sizes used for Supabase Image Transforms.
 * Values are 2x the CSS size for retina/HiDPI displays.
 */
export const AVATAR_TRANSFORM = {
  /** 24px display (xs) */
  xs: { width: 48, height: 48 },
  /** 32px display (sm) */
  sm: { width: 64, height: 64 },
  /** 40px display (md) */
  md: { width: 80, height: 80 },
  /** 48px display (lg) */
  lg: { width: 96, height: 96 },
  /** 64px display (xl) */
  xl: { width: 128, height: 128 },
} as const;

export const SERVER_ICON_TRANSFORM = { width: 96, height: 96 } as const;

export const BANNER_TRANSFORM = {
  /** Profile card / small banners */
  card: { width: 576, height: 192 },
  /** Full-width banners */
  full: { width: 1920, height: 480 },
} as const;
