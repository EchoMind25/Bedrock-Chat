/**
 * lib/family/monitoring.ts
 *
 * Pure-TS utility for family monitoring level logic.
 * No React, no Next.js — safe in both client and server contexts.
 *
 * DB stores monitoring_level as a string enum:
 *   'minimal' | 'moderate' | 'transparent' | 'restricted'
 *
 * TypeScript uses MonitoringLevel = 1 | 2 | 3 | 4
 *   1 = minimal, 2 = moderate, 3 = transparent/supervised, 4 = restricted
 */

import type { MonitoringLevel } from "@/lib/types/family";

export interface MonitoringPermissions {
  canSeeServers: boolean;
  canSeeFriends: boolean;
  canSeeMessageCounts: boolean;
  canSeeOnlineTime: boolean;
  canReadMessages: boolean;
  canViewPresence: boolean;
  requiresServerApproval: boolean;
  requiresFriendApproval: boolean;
  hasKeywordAlerts: boolean;
  hasTimeLimits: boolean;
  isNsfwBlocked: boolean; // always true for teens
}

export function getMonitoringPermissions(level: MonitoringLevel): MonitoringPermissions {
  return {
    canSeeServers: level >= 1,
    canSeeFriends: level >= 1,
    canSeeMessageCounts: level >= 2,
    canSeeOnlineTime: level >= 2,
    canReadMessages: level >= 2,
    canViewPresence: level >= 2,
    requiresServerApproval: level >= 3,
    requiresFriendApproval: level >= 4,
    hasKeywordAlerts: level >= 4,
    hasTimeLimits: level >= 4,
    isNsfwBlocked: true, // always blocked for teen accounts
  };
}

const DB_TO_NUMERIC: Record<string, MonitoringLevel> = {
  minimal: 1,
  moderate: 2,
  transparent: 3,
  supervised: 3, // alias used in some UI labels
  restricted: 4,
};

const NUMERIC_TO_DB: Record<MonitoringLevel, string> = {
  1: "minimal",
  2: "moderate",
  3: "transparent",
  4: "restricted",
};

/** Convert DB string enum to TypeScript numeric MonitoringLevel. Defaults to 1 (minimal). */
export function dbLevelToNumeric(dbLevel: string | null | undefined): MonitoringLevel {
  if (!dbLevel) return 1;
  return DB_TO_NUMERIC[dbLevel.toLowerCase()] ?? 1;
}

/** Convert TypeScript numeric MonitoringLevel to DB string enum. */
export function numericLevelToDb(level: MonitoringLevel): string {
  return NUMERIC_TO_DB[level] ?? "minimal";
}
