"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "@/store/theme.store";
import type { ThemeColors, ThemeEffects, ThemeLayout, ThemeEnvironment } from "@/lib/themes/types";

interface AppearanceTabProps {
  serverId: string;
}

// ── Color palette keys with human labels ───────────────────

const COLOR_KEYS: { key: keyof ThemeColors; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Text Muted" },
  { key: "border", label: "Border" },
  { key: "atmosphere", label: "Atmosphere" },
];

const DEFAULT_COLORS: ThemeColors = {
  primary: "oklch(0.65 0.25 265)",
  secondary: "oklch(0.55 0.20 300)",
  accent: "oklch(0.70 0.22 150)",
  background: "oklch(0.12 0.02 285)",
  surface: "oklch(0.18 0.02 285)",
  text: "oklch(0.95 0.01 285)",
  textMuted: "oklch(0.65 0.02 285)",
  border: "oklch(0.25 0.02 285)",
  atmosphere: "oklch(0.30 0.10 265)",
};

const DEFAULT_EFFECTS: ThemeEffects = {
  parallax: false,
  particles: false,
  glassBlur: true,
  glow: false,
};

const LAYOUT_OPTIONS: { value: ThemeLayout; label: string; description: string }[] = [
  { value: "compact", label: "Compact", description: "Dense layout with smaller spacing" },
  { value: "spacious", label: "Spacious", description: "Relaxed layout with more breathing room" },
  { value: "minimal", label: "Minimal", description: "Clean layout with reduced visual elements" },
];

const ENVIRONMENT_OPTIONS: { value: ThemeEnvironment; label: string; description: string }[] = [
  { value: "neon", label: "Neon", description: "Vibrant glowing aesthetic" },
  { value: "industrial", label: "Industrial", description: "Raw, metallic textures" },
  { value: "organic", label: "Organic", description: "Natural, soft gradients" },
  { value: "abstract", label: "Abstract", description: "Geometric and artistic" },
];

const EFFECT_LABELS: { key: keyof ThemeEffects; label: string; description: string }[] = [
  { key: "parallax", label: "Parallax", description: "Depth scrolling effect on backgrounds" },
  { key: "particles", label: "Particles", description: "Floating ambient particle effects" },
  { key: "glassBlur", label: "Glass Blur", description: "Frosted glass backdrop blur on surfaces" },
  { key: "glow", label: "Glow", description: "Soft glow on interactive elements" },
];

// ── Color conversion helpers ───────────────────────────────
// Approximate conversions for the native color picker (hex only).

function oklchToHexApprox(oklch: string): string {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return "#6366f1";

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bv = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const rr = Math.round(toSrgb(r) * 255);
  const gg = Math.round(toSrgb(g) * 255);
  const bb = Math.round(toSrgb(bv) * 255);

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}

function hexToOklchApprox(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const toLinear = (x: number) =>
    x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);

  const rl = toLinear(r);
  const gl = toLinear(g);
  const bl = toLinear(b);

  const l_ = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
  const m_ = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
  const s_ = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bOk = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + bOk * bOk);
  let H = (Math.atan2(bOk, a) * 180) / Math.PI;
  if (H < 0) H += 360;

  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${Math.round(H)})`;
}

// ── Component ──────────────────────────────────────────────

export function AppearanceTab({ serverId }: AppearanceTabProps) {
  const loadServerThemeConfig = useThemeStore((s) => s.loadServerThemeConfig);
  const saveServerThemeConfig = useThemeStore((s) => s.saveServerThemeConfig);
  const getServerThemeConfig = useThemeStore((s) => s.getServerThemeConfig);

  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [effects, setEffects] = useState<ThemeEffects>(DEFAULT_EFFECTS);
  const [layout, setLayout] = useState<ThemeLayout>("spacious");
  const [environment, setEnvironment] = useState<ThemeEnvironment>("neon");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const hasLoadedRef = useRef(false);

  // Load existing config on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      await loadServerThemeConfig(serverId);
      const config = getServerThemeConfig(serverId);
      if (config) {
        setColors(config.colors);
        setEffects(config.effects);
        setLayout(config.layout);
        setEnvironment(config.environment);
      }
      setIsLoaded(true);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const handleColorChange = useCallback((key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleEffectToggle = useCallback((key: keyof ThemeEffects) => {
    setEffects((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveServerThemeConfig(serverId, {
        colors,
        effects,
        layout,
        environment,
      });
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId, colors, effects, layout, environment]);

  // Live preview gradient built from current colors
  const previewGradient = useMemo(() => {
    return `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 25%, ${colors.primary} 50%, ${colors.accent} 75%, ${colors.atmosphere} 100%)`;
  }, [colors.background, colors.surface, colors.primary, colors.accent, colors.atmosphere]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "oklch(0.65 0.25 265)", borderTopColor: "transparent" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-100 mb-1">Server Appearance</h3>
        <p className="text-sm" style={{ color: "oklch(0.65 0.02 285)" }}>
          Customize your server&apos;s visual theme, effects, and layout.
        </p>
      </div>

      {/* Live Preview Strip */}
      <motion.div
        className="rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div
          className="h-16 w-full rounded-xl relative"
          style={{ background: previewGradient }}
        >
          <div
            className="absolute inset-0 rounded-xl flex items-center justify-center"
            style={{ backdropFilter: effects.glassBlur ? "blur(8px)" : "none" }}
          >
            <span
              className="text-sm font-medium px-4 py-1.5 rounded-lg"
              style={{
                color: colors.text,
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              Live Preview
            </span>
          </div>
        </div>
        {/* Color swatch row */}
        <div className="flex mt-2 gap-1">
          {COLOR_KEYS.map(({ key }) => (
            <div
              key={key}
              className="h-3 flex-1 first:rounded-l-md last:rounded-r-md"
              style={{ backgroundColor: colors[key] }}
              title={key}
            />
          ))}
        </div>
      </motion.div>

      {/* Color Palette Editor */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">Color Palette</h4>
        <div className="grid grid-cols-3 gap-3">
          {COLOR_KEYS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label
                className="text-xs font-medium block"
                style={{ color: "oklch(0.70 0.02 285)" }}
              >
                {label}
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg shrink-0 cursor-pointer relative overflow-hidden"
                  style={{
                    backgroundColor: colors[key],
                    border: "1px solid oklch(0.30 0.02 285 / 0.5)",
                  }}
                >
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    value={oklchToHexApprox(colors[key])}
                    onChange={(e) => handleColorChange(key, hexToOklchApprox(e.target.value))}
                  />
                </div>
                <input
                  type="text"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="flex-1 text-xs px-2 py-1.5 rounded-md outline-hidden"
                  style={{
                    backgroundColor: "oklch(0.10 0.02 285 / 0.8)",
                    color: "oklch(0.85 0.01 285)",
                    border: "1px solid oklch(0.25 0.02 285 / 0.4)",
                  }}
                  spellCheck={false}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Effects Toggles */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">Effects</h4>
        <div className="grid grid-cols-2 gap-3">
          {EFFECT_LABELS.map(({ key, label, description }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleEffectToggle(key)}
              className="flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
              style={{
                backgroundColor: effects[key]
                  ? "oklch(0.30 0.10 265 / 0.3)"
                  : "oklch(0.12 0.02 285 / 0.5)",
                border: effects[key]
                  ? "1px solid oklch(0.50 0.15 265 / 0.5)"
                  : "1px solid oklch(0.25 0.02 285 / 0.3)",
              }}
            >
              <div
                className="h-5 w-5 rounded-md shrink-0 flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: effects[key]
                    ? "oklch(0.65 0.25 265)"
                    : "oklch(0.20 0.02 285)",
                  border: "1px solid oklch(0.35 0.05 285 / 0.5)",
                }}
              >
                <AnimatePresence>
                  {effects[key] && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200">{label}</p>
                <p className="text-xs" style={{ color: "oklch(0.55 0.02 285)" }}>
                  {description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Layout Selector */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">Layout</h4>
        <div className="grid grid-cols-3 gap-3">
          {LAYOUT_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLayout(value)}
              className="p-3 rounded-lg text-left transition-colors"
              style={{
                backgroundColor: layout === value
                  ? "oklch(0.30 0.10 265 / 0.3)"
                  : "oklch(0.12 0.02 285 / 0.5)",
                border: layout === value
                  ? "1px solid oklch(0.50 0.15 265 / 0.5)"
                  : "1px solid oklch(0.25 0.02 285 / 0.3)",
              }}
            >
              <p className="text-sm font-medium text-slate-200">{label}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 285)" }}>
                {description}
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Environment Selector */}
      <motion.div
        className="rounded-xl p-6 space-y-4"
        style={{
          backgroundColor: "oklch(0.15 0.02 285 / 0.7)",
          border: "1px solid oklch(0.25 0.02 285 / 0.5)",
          backdropFilter: "blur(12px)",
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
      >
        <h4 className="text-sm font-semibold text-slate-200">Environment</h4>
        <div className="grid grid-cols-2 gap-3">
          {ENVIRONMENT_OPTIONS.map(({ value, label, description }) => (
            <button
              key={value}
              type="button"
              onClick={() => setEnvironment(value)}
              className="p-3 rounded-lg text-left transition-colors"
              style={{
                backgroundColor: environment === value
                  ? "oklch(0.30 0.10 265 / 0.3)"
                  : "oklch(0.12 0.02 285 / 0.5)",
                border: environment === value
                  ? "1px solid oklch(0.50 0.15 265 / 0.5)"
                  : "1px solid oklch(0.25 0.02 285 / 0.3)",
              }}
            >
              <p className="text-sm font-medium text-slate-200">{label}</p>
              <p className="text-xs mt-1" style={{ color: "oklch(0.55 0.02 285)" }}>
                {description}
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        className="flex justify-end pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <motion.button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.25 265), oklch(0.50 0.20 300))",
            boxShadow: "0 4px 16px oklch(0.40 0.20 265 / 0.3)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? "Saving..." : "Save Appearance"}
        </motion.button>
      </motion.div>
    </div>
  );
}
