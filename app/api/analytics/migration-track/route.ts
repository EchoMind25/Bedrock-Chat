import { NextRequest, NextResponse } from "next/server";
import { trackMigrationEvent, type MigrationEvent } from "@/lib/services/migration-analytics";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

const VALID_EVENTS: MigrationEvent[] = [
  "switch_page_view",
  "import_started",
  "import_completed",
  "invite_generated",
  "invite_clicked",
  "invite_signup",
  "invite_join",
];

/**
 * POST /api/analytics/migration-track
 *
 * Server-side endpoint for incrementing migration funnel counters.
 * No auth required (public pages use this), but rate limited.
 *
 * PRIVACY: No cookies set, no user identification, aggregate only.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`migration-track:${ip}`, 30, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
    );
  }

  try {
    const body = await request.json() as { event?: string };
    const event = body.event as MigrationEvent;

    if (!event || !VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const referer = request.headers.get("referer");
    const searchParams = request.nextUrl.search;

    // Fire-and-forget — response returns immediately
    trackMigrationEvent(event, referer, searchParams);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
