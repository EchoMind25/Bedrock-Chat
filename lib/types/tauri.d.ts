/**
 * Type-safe Tauri IPC command definitions.
 *
 * Every Tauri command exposed from Rust must have its signature defined here
 * so that TypeScript `invoke()` calls are type-checked.
 */

/** Performance stats snapshot from the Rust backend. */
export interface PerformanceStats {
  cpu_pct: number;
  ram_used_mb: number;
  ram_total_mb: number;
}

/** Activity changed event payload from the "activity-changed" Tauri event. */
export interface ActivityChangedPayload {
  game: string | null;
}

/**
 * Tauri command signatures.
 *
 * Usage with @tauri-apps/api:
 * ```ts
 * import { invoke } from "@tauri-apps/api/core";
 * const game = await invoke<string | null>("get_activity");
 * ```
 */
export interface TauriCommands {
  // Activity detection
  get_activity: () => string | null;
  set_activity_detection_enabled: (args: { enabled: boolean }) => void;

  // Overlay management
  show_overlay: () => void;
  hide_overlay: () => void;
  toggle_overlay: () => void;
  set_overlay_position: (args: { x: number; y: number }) => void;

  // Performance monitoring
  get_performance_stats: () => PerformanceStats;
}

/** Tauri event names and their payload types. */
export interface TauriEvents {
  "activity-changed": ActivityChangedPayload;
  "overlay-visibility": boolean;
}
