/**
 * PRIVACY-FIRST MIGRATION ANALYTICS
 *
 * Rules:
 * 1. Server-side ONLY — no client-side tracking scripts
 * 2. Aggregate counters ONLY — no per-user records
 * 3. No persistent identifiers — no cookies, no device IDs
 * 4. Source detection via HTTP Referer header only (categorized, not stored)
 * 5. 90-day retention on aggregates
 * 6. ZERO data sent to third parties
 *
 * HOW SOURCE DETECTION WORKS (without tracking):
 * - Direct: No Referer header
 * - Search: Referer contains google.com, bing.com, duckduckgo.com
 * - Discord: Referer contains discord.com or discordapp.com
 * - QR Code: URL has ?src=qr parameter (set by QR code generator)
 * - Other: Any other Referer
 *
 * The Referer header is NOT stored. It's read once, categorized, then the
 * aggregate counter is incremented. No PII is retained.
 */

import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MigrationEvent =
  | "switch_page_view"
  | "import_started"
  | "import_completed"
  | "invite_generated"
  | "invite_clicked"
  | "invite_signup"
  | "invite_join";

type SourceCategory =
  | "source_direct"
  | "source_search"
  | "source_discord_link"
  | "source_qr_code"
  | "source_other";

/** Maps event names to DB column names */
const EVENT_TO_COLUMN: Record<MigrationEvent, string> = {
  switch_page_view: "switch_page_views",
  import_started: "import_started",
  import_completed: "import_completed",
  invite_generated: "invite_links_generated",
  invite_clicked: "invite_links_clicked",
  invite_signup: "invite_signups",
  invite_join: "invite_joins",
};

// ---------------------------------------------------------------------------
// Source categorization (from Referer header — NOT stored)
// ---------------------------------------------------------------------------

const SEARCH_DOMAINS = [
  "google.com",
  "google.co",
  "bing.com",
  "duckduckgo.com",
  "yahoo.com",
  "ecosia.org",
  "startpage.com",
];

const DISCORD_DOMAINS = ["discord.com", "discordapp.com", "discord.gg"];

export function categorizeSource(
  referer: string | null | undefined,
  searchParams?: string | null,
): SourceCategory {
  // QR code source takes priority (explicit marker in URL)
  if (searchParams?.includes("src=qr")) {
    return "source_qr_code";
  }

  if (!referer) {
    return "source_direct";
  }

  const lower = referer.toLowerCase();

  for (const domain of DISCORD_DOMAINS) {
    if (lower.includes(domain)) return "source_discord_link";
  }

  for (const domain of SEARCH_DOMAINS) {
    if (lower.includes(domain)) return "source_search";
  }

  return "source_other";
}

// ---------------------------------------------------------------------------
// Track event (fire-and-forget — NEVER blocks user flows)
// ---------------------------------------------------------------------------

export async function trackMigrationEvent(
  event: MigrationEvent,
  referer?: string | null,
  searchParams?: string | null,
): Promise<void> {
  try {
    const column = EVENT_TO_COLUMN[event];
    if (!column) return;

    const source = categorizeSource(referer, searchParams);
    const service = createServiceClient();

    await service.rpc("increment_migration_stat", {
      stat_name: column,
      source_category: source,
    });
  } catch (err) {
    // Analytics must NEVER block user flows or throw
    console.error("[migration-analytics] Failed to track event:", err);
  }
}

// ---------------------------------------------------------------------------
// Query funnel data (admin only — called from API route)
// ---------------------------------------------------------------------------

export interface FunnelRow {
  date: string;
  switch_page_views: number;
  import_started: number;
  import_completed: number;
  invite_links_generated: number;
  invite_links_clicked: number;
  invite_signups: number;
  invite_joins: number;
  source_direct: number;
  source_search: number;
  source_discord_link: number;
  source_qr_code: number;
  source_other: number;
}

export async function getMigrationFunnelData(
  startDate: string,
  endDate: string,
): Promise<FunnelRow[]> {
  const service = createServiceClient();

  const { data, error } = await service
    .from("migration_funnel_stats")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.date,
    switch_page_views: row.switch_page_views ?? 0,
    import_started: row.import_started ?? 0,
    import_completed: row.import_completed ?? 0,
    invite_links_generated: row.invite_links_generated ?? 0,
    invite_links_clicked: row.invite_links_clicked ?? 0,
    invite_signups: row.invite_signups ?? 0,
    invite_joins: row.invite_joins ?? 0,
    source_direct: row.source_direct ?? 0,
    source_search: row.source_search ?? 0,
    source_discord_link: row.source_discord_link ?? 0,
    source_qr_code: row.source_qr_code ?? 0,
    source_other: row.source_other ?? 0,
  }));
}
