export const DEFAULT_THEME_COLOR = "oklch(0.65 0.25 265)";

/**
 * Deterministic theme color from server name.
 * Simple hash -> hue rotation in OKLCH space.
 */
export function deriveThemeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `oklch(0.65 0.2 ${hue})`;
}
