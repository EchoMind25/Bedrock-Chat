import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import type { ReportReason } from "@/lib/types/report";

const VALID_REASONS: ReportReason[] = [
  "csam",
  "harassment",
  "spam",
  "hate_speech",
  "violence",
  "self_harm",
  "impersonation",
  "other",
];

export async function POST(request: NextRequest) {
  // Rate limit: 10 reports per hour per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(
    `reports:${ip}`,
    10,
    60 * 60 * 1000,
  );

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reports. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      },
    );
  }

  try {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      message_id,
      channel_id,
      server_id,
      reason,
      description,
      message_content_snapshot,
      message_author_id,
    } = body;

    // Validate required fields
    if (
      !message_id ||
      !channel_id ||
      !server_id ||
      !reason ||
      !message_content_snapshot ||
      !message_author_id
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate reason
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid report reason" },
        { status: 400 },
      );
    }

    // CSAM reports auto-escalate (18 U.S.C. 2258A compliance)
    const status = reason === "csam" ? "escalated" : "pending";

    const { data, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        message_id,
        channel_id,
        server_id,
        reason,
        description: description || "",
        status,
        message_content_snapshot,
        message_author_id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[API] Report insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to submit report" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id, status }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to process report" },
      { status: 500 },
    );
  }
}
