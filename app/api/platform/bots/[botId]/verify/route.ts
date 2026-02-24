import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const { botId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`webhook-verify:${ip}`, 3, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await requirePlatformRole(user.id, "developer");

		const serviceClient = createServiceClient();

		// Get bot and verify ownership
		const { data: bot } = await serviceClient
			.from("bot_applications")
			.select("owner_id, webhook_url, webhook_secret")
			.eq("id", botId)
			.single();

		if (!bot || bot.owner_id !== user.id) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		if (!bot.webhook_url) {
			return NextResponse.json({ error: "No webhook URL configured" }, { status: 400 });
		}

		// Verify HTTPS
		try {
			const url = new URL(bot.webhook_url);
			if (url.protocol !== "https:") {
				return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
			}
		} catch {
			return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
		}

		// Send verification challenge
		const challenge = crypto.randomUUID();

		try {
			const response = await fetch(bot.webhook_url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Bedrock-Signature": bot.webhook_secret,
				},
				body: JSON.stringify({
					type: "verification",
					challenge,
				}),
				signal: AbortSignal.timeout(10_000),
			});

			if (!response.ok) {
				return NextResponse.json(
					{ error: `Webhook returned ${response.status}`, verified: false },
					{ status: 200 },
				);
			}

			const responseBody = await response.json();

			if (responseBody.challenge !== challenge) {
				return NextResponse.json(
					{ error: "Challenge response mismatch", verified: false },
					{ status: 200 },
				);
			}

			// Mark as verified
			await serviceClient
				.from("bot_applications")
				.update({ webhook_verified: true })
				.eq("id", botId);

			return NextResponse.json({ verified: true });
		} catch {
			return NextResponse.json(
				{ error: "Failed to reach webhook URL", verified: false },
				{ status: 200 },
			);
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Developer access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
