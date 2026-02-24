import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> },
) {
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) {
		return NextResponse.json(
			{ error: "Server configuration error" },
			{ status: 503 },
		);
	}

	try {
		const { botId } = await params;

		// Validate Authorization header
		const authHeader = request.headers.get("authorization");
		const bearerToken = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;

		if (!bearerToken) {
			return NextResponse.json(
				{ error: "Missing or invalid Authorization header" },
				{ status: 401 },
			);
		}

		// Parse and validate request body
		const body = await request.json().catch(() => null);

		if (!body) {
			return NextResponse.json(
				{ error: "Invalid JSON body" },
				{ status: 400 },
			);
		}

		const { channelId, messageContent, triggeredBy } = body;

		if (!channelId || typeof channelId !== "string") {
			return NextResponse.json(
				{ error: "'channelId' is required and must be a string" },
				{ status: 400 },
			);
		}

		if (!messageContent || typeof messageContent !== "string") {
			return NextResponse.json(
				{ error: "'messageContent' is required and must be a string" },
				{ status: 400 },
			);
		}

		if (!triggeredBy || typeof triggeredBy !== "string") {
			return NextResponse.json(
				{ error: "'triggeredBy' is required and must be a string" },
				{ status: 400 },
			);
		}

		// Service role client bypasses RLS
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			serviceRoleKey,
		);

		// Look up bot by id
		const { data: bot, error: botError } = await supabase
			.from("server_bots")
			.select("id, token, bot_type, is_active, messages_sent")
			.eq("id", botId)
			.single();

		if (botError || !bot) {
			return NextResponse.json(
				{ error: "Bot not found" },
				{ status: 404 },
			);
		}

		// Validate token
		if (bot.token !== bearerToken) {
			return NextResponse.json(
				{ error: "Invalid bot token" },
				{ status: 401 },
			);
		}

		// Check active status
		if (!bot.is_active) {
			return NextResponse.json(
				{ error: "Bot is currently inactive" },
				{ status: 503 },
			);
		}

		// Generate response based on bot type
		let response: string;
		let status: string;

		if (bot.bot_type === "claude") {
			response = `Claude API integration coming soon. Bot received: ${messageContent}`;
			status = "pending_integration";
		} else {
			// "custom" or "webhook" bot types
			response = "Custom bot processing not yet implemented";
			status = "pending_implementation";
		}

		// Increment messages_sent counter
		const { error: updateError } = await supabase
			.from("server_bots")
			.update({ messages_sent: (bot.messages_sent || 0) + 1 })
			.eq("id", botId);

		if (updateError) {
			console.error("[bots/respond] Failed to increment messages_sent:", updateError.message);
			// Non-fatal: response was already generated
		}

		return NextResponse.json({
			response,
			status,
			botId: bot.id,
			channelId,
			triggeredBy,
		});
	} catch (error) {
		console.error("[bots/respond] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
