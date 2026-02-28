"use client";

import { useCallback } from "react";
import { haptics, type HapticPattern } from "@/lib/utils/haptics";
import { useSettingsStore } from "@/store/settings.store";

/**
 * React hook for haptic feedback.
 *
 * Reads the user's `haptic_feedback` preference from the settings store
 * and gates the haptic engine accordingly. If the preference is off,
 * trigger() is a silent no-op.
 *
 * Returns a stable `trigger` callback (safe to use in dependency arrays)
 * and `isSupported` to conditionally render haptic-related UI.
 */
export function useHaptics() {
  const hapticEnabled = useSettingsStore(
    (s) => s.settings?.haptic_feedback ?? true
  );

  const trigger = useCallback(
    (pattern: HapticPattern) => {
      if (!hapticEnabled) return;
      haptics.trigger(pattern);
    },
    [hapticEnabled]
  );

  return { trigger, isSupported: haptics.isSupported() };
}
