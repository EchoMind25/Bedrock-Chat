"use client";

import { useSettingsStore } from "@/store/settings.store";

/**
 * Returns true when the user has enabled "Reduced Motion" in their
 * Bedrock settings. Use this to conditionally disable or simplify
 * animations in JS-driven components.
 *
 * For CSS-only animations, the global stylesheet already includes a
 * `@media (prefers-reduced-motion: reduce)` block that handles this
 * at the OS level. This hook bridges the in-app setting to component logic.
 */
export function useReducedMotion(): boolean {
  return useSettingsStore((s) => s.settings?.reduced_motion ?? false);
}
