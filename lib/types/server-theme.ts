import type { ThemeColors, ThemeEffects, ThemeLayout, ThemeEnvironment } from "@/lib/themes/types";

export interface ServerThemeConfig {
  id: string;
  serverId: string;
  themePresetId: string | null;
  name: string;
  colors: ThemeColors;
  effects: ThemeEffects;
  layout: ThemeLayout;
  environment: ThemeEnvironment;
  customCss: string | null;
  animatedBannerUrl: string | null;
  splashImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Map DB row to ServerThemeConfig
export const mapDbServerTheme = (row: Record<string, unknown>): ServerThemeConfig => ({
  id: row.id as string,
  serverId: row.server_id as string,
  themePresetId: (row.theme_preset_id as string) || null,
  name: (row.name as string) || "Custom Theme",
  colors: {
    primary: row.color_primary as string,
    secondary: row.color_secondary as string,
    accent: row.color_accent as string,
    background: row.color_background as string,
    surface: row.color_surface as string,
    text: row.color_text as string,
    textMuted: row.color_text_muted as string,
    border: row.color_border as string,
    atmosphere: row.color_atmosphere as string,
  },
  effects: {
    parallax: row.effect_parallax as boolean,
    particles: row.effect_particles as boolean,
    glassBlur: row.effect_glass_blur as boolean,
    glow: row.effect_glow as boolean,
  },
  layout: row.layout as ThemeLayout,
  environment: row.environment as ThemeEnvironment,
  customCss: (row.custom_css as string) || null,
  animatedBannerUrl: (row.animated_banner_url as string) || null,
  splashImageUrl: (row.splash_image_url as string) || null,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

// Convert ServerThemeConfig to DB insert/update format
export const toDbServerTheme = (config: Partial<ServerThemeConfig>) => ({
  ...(config.themePresetId !== undefined && { theme_preset_id: config.themePresetId }),
  ...(config.name !== undefined && { name: config.name }),
  ...(config.colors && {
    color_primary: config.colors.primary,
    color_secondary: config.colors.secondary,
    color_accent: config.colors.accent,
    color_background: config.colors.background,
    color_surface: config.colors.surface,
    color_text: config.colors.text,
    color_text_muted: config.colors.textMuted,
    color_border: config.colors.border,
    color_atmosphere: config.colors.atmosphere,
  }),
  ...(config.effects && {
    effect_parallax: config.effects.parallax,
    effect_particles: config.effects.particles,
    effect_glass_blur: config.effects.glassBlur,
    effect_glow: config.effects.glow,
  }),
  ...(config.layout !== undefined && { layout: config.layout }),
  ...(config.environment !== undefined && { environment: config.environment }),
  ...(config.customCss !== undefined && { custom_css: config.customCss }),
  ...(config.animatedBannerUrl !== undefined && { animated_banner_url: config.animatedBannerUrl }),
  ...(config.splashImageUrl !== undefined && { splash_image_url: config.splashImageUrl }),
});
