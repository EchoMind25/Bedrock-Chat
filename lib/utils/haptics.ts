"use client";

/**
 * Privacy-first haptic feedback utility.
 *
 * Uses only the native Web Vibration API — no third-party dependencies,
 * no permissions required beyond a user gesture context, and no data
 * collected about haptic events.
 *
 * PLATFORM NOTE: iOS Safari does not implement the Vibration API.
 * Haptics on iOS web apps are silently unavailable. Android Chrome and
 * Firefox fully support this API.
 *
 * COMPLIANCE:
 * - COPPA: No data collection, no tracking of any kind.
 * - GDPR: No personal data processed.
 * - CCPA: No data sold or shared.
 */

export type HapticPattern =
  | "light"      // Quick tap: button press, toggle, item selection
  | "medium"     // Moderate: navigation change, confirm action
  | "heavy"      // Strong: destructive action warning
  | "success"    // Short-pause-long: operation completed
  | "warning"    // Staccato: attention needed
  | "error"      // Long-pause-long: error occurred
  | "selection"; // Barely perceptible: list item selection, scroll snap

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  warning: [30, 30, 30],
  error: [50, 100, 50],
  selection: 5,
};

class HapticEngine {
  private readonly supported: boolean;
  private enabled: boolean = true;

  constructor() {
    this.supported =
      typeof navigator !== "undefined" && "vibrate" in navigator;
  }

  /**
   * Trigger haptic feedback. No-ops silently on unsupported devices
   * or when the user has disabled haptics in their preferences.
   */
  trigger(pattern: HapticPattern): void {
    if (!this.supported || !this.enabled) return;
    try {
      navigator.vibrate(PATTERNS[pattern]);
    } catch {
      // Silently fail — some browsers restrict vibrate() outside a user
      // gesture context. Never throw on haptic failure.
    }
  }

  /** Enable or disable haptic feedback (user preference). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Returns true if the Vibration API is available on this device. */
  isSupported(): boolean {
    return this.supported;
  }
}

// Module-level singleton — safe because HapticEngine holds no user data.
export const haptics = new HapticEngine();
