/**
 * Performance Budget — Bedrock Chat
 *
 * Hard limits enforced during development and CI.
 * Every metric has a target (ideal) and a ceiling (must not exceed).
 * Violation of any ceiling is a blocking issue.
 *
 * Context: Bedrock Chat runs alongside games — RAM and CPU overhead
 * directly compete with game performance. These budgets reflect that.
 */
export const PERFORMANCE_BUDGET = {
  // ── Memory ────────────────────────────────────────────────
  /** Idle with one server open, one channel active */
  MAX_RAM_IDLE_MB: 100,
  /** While in a voice channel with video */
  MAX_RAM_VOICE_MB: 150,
  /** Maximum cached message channels (LRU eviction) */
  MAX_CACHED_MESSAGE_CHANNELS: 5,

  // ── Bundle ────────────────────────────────────────────────
  /** First-load JS for any route (gzipped) */
  MAX_FIRST_LOAD_JS_KB: 200,
  /** Per-route JS chunk (gzipped) */
  MAX_ROUTE_JS_KB: 100,
  /** Landing page first-load (must not include auth/app code) */
  MAX_LANDING_JS_KB: 150,

  // ── Core Web Vitals ───────────────────────────────────────
  MAX_LCP_MS: 2500,
  MAX_INP_MS: 100,
  MAX_CLS: 0.1,
  MAX_FCP_MS: 1800,
  MAX_TTFB_MS: 600,

  // ── Animation ─────────────────────────────────────────────
  /** Target framerate for all animations */
  MIN_FPS: 60,
  /** Absolute minimum before flagging as jank */
  MIN_ACCEPTABLE_FPS: 45,
  /** Max concurrent CSS/JS animations before throttling */
  MAX_CONCURRENT_ANIMATIONS: 20,

  // ── Network ───────────────────────────────────────────────
  /** Max API response payload (before pagination) */
  MAX_API_RESPONSE_KB: 50,
  /** Max concurrent fetch requests */
  MAX_CONCURRENT_REQUESTS: 6,
  /** Max Supabase Realtime subscriptions per session */
  MAX_REALTIME_SUBSCRIPTIONS: 10,

  // ── Rendering ─────────────────────────────────────────────
  /** Components that re-render when a message is sent */
  MAX_MESSAGE_SEND_RERENDERS: 3,
  /** Time to switch between channels (perceived) */
  MAX_CHANNEL_SWITCH_MS: 200,
  /** Max DOM nodes before performance degrades */
  MAX_DOM_NODES: 3000,

  // ── CPU ───────────────────────────────────────────────────
  /** Idle CPU usage (no user interaction, no animations) */
  MAX_CPU_IDLE_PERCENT: 2,
  /** Active CPU during normal use (typing, scrolling) */
  MAX_CPU_ACTIVE_PERCENT: 15,
} as const;

export type PerformanceBudget = typeof PERFORMANCE_BUDGET;
