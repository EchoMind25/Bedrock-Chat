/**
 * Build-time feature flags.
 *
 * These are compile-time boolean constants so Turbopack can tree-shake
 * unreachable code paths. To toggle a feature, change the value here and
 * rebuild — no env vars or runtime checks required.
 */

/** Family account system: parent/teen accounts, monitoring, approval queues */
export const ENABLE_FAMILY_ACCOUNTS = false as const;
