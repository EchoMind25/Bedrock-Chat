import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const { botId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`platform-bot-get:${ip}`, 30, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// RLS ensures only own bots
		const { data: bot } = await supabase
			.from("bot_applications")
			.select("*")
			.eq("id", botId)
			.eq("owner_id", user.id)
			.single();

		if (!bot) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		return NextResponse.json({ bot });
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const { botId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`platform-bot-update:${ip}`, 10, 60_000);
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

		// Verify ownership
		const { data: existingBot } = await serviceClient
			.from("bot_applications")
			.select("owner_id")
			.eq("id", botId)
			.single();

		if (!existingBot || existingBot.owner_id !== user.id) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		const body = await request.json();
		const allowedFields = ["name", "description", "webhook_url", "scopes", "privacy_policy_url", "is_teen_safe"];
		const updates: Record<string, unknown> = {};

		for (const field of allowedFields) {
			if (field in body) {
				updates[field] = body[field];
			}
		}

		// Validate name if provided
		if (updates.name && (typeof updates.name !== "string" || updates.name.length < 2 || updates.name.length > 100)) {
			return NextResponse.json({ error: "Bot name must be 2-100 characters" }, { status: 400 });
		}

		// Validate webhook URL if provided
		if (updates.webhook_url) {
			try {
				const url = new URL(updates.webhook_url as string);
				if (url.protocol !== "https:") {
					return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
				}
			} catch {
				return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
			}
			// Reset verification when URL changes
			updates.webhook_verified = false;
		}

		const { data: bot, error: updateError } = await serviceClient
			.from("bot_applications")
			.update(updates)
			.eq("id", botId)
			.select()
			.single();

		if (updateError || !bot) {
			return NextResponse.json({ error: "Failed to update bot" }, { status: 500 });
		}

		return NextResponse.json({ bot });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Developer access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const { botId } = await params;
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`platform-bot-delete:${ip}`, 5, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const serviceClient = createServiceClient();

		// Verify ownership and status
		const { data: bot } = await serviceClient
			.from("bot_applications")
			.select("owner_id, status")
			.eq("id", botId)
			.single();

		if (!bot || bot.owner_id !== user.id) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		// Can only delete pending or rejected bots
		if (!["pending", "rejected"].includes(bot.status)) {
			return NextResponse.json(
				{ error: "Can only delete bots with pending or rejected status" },
				{ status: 400 },
			);
		}

		const { error: deleteError } = await serviceClient
			.from("bot_applications")
			.delete()
			.eq("id", botId);

		if (deleteError) {
			return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
