import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MS = 1000;

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ webhookId: string }> },
) {
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) {
		return NextResponse.json(
			{ error: "Server configuration error" },
			{ status: 503 },
		);
	}

	try {
		const { webhookId } = await params;

		// Extract token from query param or Authorization header
		const url = new URL(request.url);
		const queryToken = url.searchParams.get("token");
		const authHeader = request.headers.get("authorization");
		const bearerToken = authHeader?.startsWith("Bearer ")
			? authHeader.slice(7)
			: null;
		const token = queryToken || bearerToken;

		if (!token) {
			return NextResponse.json(
				{ error: "Missing webhook token" },
				{ status: 401 },
			);
		}

		// Parse and validate request body
		const body = await request.json().catch(() => null);

		if (!body || typeof body.content !== "string" || !body.content.trim()) {
			return NextResponse.json(
				{ error: "Request body must include a non-empty 'content' string" },
				{ status: 400 },
			);
		}

		const { content, username, avatar_url, embeds } = body;

		// Validate optional fields
		if (username !== undefined && typeof username !== "string") {
			return NextResponse.json(
				{ error: "'username' must be a string" },
				{ status: 400 },
			);
		}

		if (avatar_url !== undefined && typeof avatar_url !== "string") {
			return NextResponse.json(
				{ error: "'avatar_url' must be a string" },
				{ status: 400 },
			);
		}

		if (embeds !== undefined && !Array.isArray(embeds)) {
			return NextResponse.json(
				{ error: "'embeds' must be an array" },
				{ status: 400 },
			);
		}

		// Service role client bypasses RLS
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			serviceRoleKey,
		);

		// Look up webhook by id
		const { data: webhook, error: webhookError } = await supabase
			.from("server_webhooks")
			.select("id, token, channel_id, created_by, is_active, last_used_at")
			.eq("id", webhookId)
			.single();

		if (webhookError || !webhook) {
			return NextResponse.json(
				{ error: "Webhook not found" },
				{ status: 404 },
			);
		}

		// Validate token
		if (webhook.token !== token) {
			return NextResponse.json(
				{ error: "Invalid webhook token" },
				{ status: 401 },
			);
		}

		// Check active status
		if (!webhook.is_active) {
			return NextResponse.json(
				{ error: "Webhook is inactive" },
				{ status: 403 },
			);
		}

		// Rate limit: reject if last_used_at is less than 1 second ago
		if (webhook.last_used_at) {
			const lastUsed = new Date(webhook.last_used_at).getTime();
			const now = Date.now();
			const elapsed = now - lastUsed;

			if (elapsed < RATE_LIMIT_MS) {
				const retryAfter = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
				return NextResponse.json(
					{ error: "Rate limited. Try again shortly." },
					{
						status: 429,
						headers: { "Retry-After": String(retryAfter || 1) },
					},
				);
			}
		}

		// Insert message into messages table
		const { data: message, error: messageError } = await supabase
			.from("messages")
			.insert({
				channel_id: webhook.channel_id,
				content: content.trim(),
				user_id: webhook.created_by,
				bot_id: null,
				metadata: {
					webhook_id: webhookId,
					...(username ? { webhook_username: username } : {}),
					...(avatar_url ? { webhook_avatar_url: avatar_url } : {}),
					...(embeds?.length ? { embeds } : {}),
				},
			})
			.select("id")
			.single();

		if (messageError || !message) {
			console.error("[webhooks] Failed to insert message:", messageError?.message);
			return NextResponse.json(
				{ error: "Failed to create message" },
				{ status: 500 },
			);
		}

		// Update webhook last_used_at
		const { error: updateError } = await supabase
			.from("server_webhooks")
			.update({ last_used_at: new Date().toISOString() })
			.eq("id", webhookId);

		if (updateError) {
			console.error("[webhooks] Failed to update last_used_at:", updateError.message);
			// Non-fatal: message was already created
		}

		return NextResponse.json({ success: true, messageId: message.id });
	} catch (error) {
		console.error("[webhooks] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
