import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole, auditLog } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`platform-bots-list:${ip}`, 30, 60_000);
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

		// RLS ensures only own bots are returned
		const { data: bots, error } = await supabase
			.from("bot_applications")
			.select("*")
			.eq("owner_id", user.id)
			.order("created_at", { ascending: false });

		if (error) {
			return NextResponse.json({ error: "Failed to fetch bots" }, { status: 500 });
		}

		return NextResponse.json({ bots: bots ?? [] });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Developer access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`platform-bots-create:${ip}`, 5, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const actorRole = await requirePlatformRole(user.id, "developer");

		const body = await request.json();
		const { name, description, botType, webhookUrl, scopes, privacyPolicyUrl, dpaAccepted, isTeenSafe } = body as {
			name: string;
			description?: string;
			botType: "custom" | "claude" | "webhook";
			webhookUrl?: string;
			scopes?: string[];
			privacyPolicyUrl?: string;
			dpaAccepted: boolean;
			isTeenSafe?: boolean;
		};

		// Validate required fields
		if (!name || name.length < 2 || name.length > 100) {
			return NextResponse.json({ error: "Bot name must be 2-100 characters" }, { status: 400 });
		}

		if (!botType || !["custom", "claude", "webhook"].includes(botType)) {
			return NextResponse.json({ error: "Invalid bot type" }, { status: 400 });
		}

		if (description && description.length > 500) {
			return NextResponse.json({ error: "Description must be 500 characters or less" }, { status: 400 });
		}

		// Webhook URL must be HTTPS
		if (webhookUrl) {
			try {
				const url = new URL(webhookUrl);
				if (url.protocol !== "https:") {
					return NextResponse.json({ error: "Webhook URL must use HTTPS" }, { status: 400 });
				}
			} catch {
				return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
			}
		}

		// DPA must be accepted
		if (!dpaAccepted) {
			return NextResponse.json({ error: "Data Processing Agreement must be accepted" }, { status: 400 });
		}

		const serviceClient = createServiceClient();

		const { data: bot, error: insertError } = await serviceClient
			.from("bot_applications")
			.insert({
				owner_id: user.id,
				name,
				description: description ?? null,
				bot_type: botType,
				webhook_url: webhookUrl ?? null,
				scopes: scopes ?? [],
				privacy_policy_url: privacyPolicyUrl ?? null,
				dpa_accepted_at: new Date().toISOString(),
				dpa_version: "1.0",
				is_teen_safe: isTeenSafe ?? false,
			})
			.select()
			.single();

		if (insertError || !bot) {
			return NextResponse.json({ error: "Failed to create bot application" }, { status: 500 });
		}

		await auditLog({
			actorId: user.id,
			actorRole,
			action: "bot_registered",
			targetBotId: bot.id,
			metadata: { bot_name: name, bot_type: botType },
			ipAddress: ip !== "unknown" ? ip : undefined,
		});

		return NextResponse.json({ bot }, { status: 201 });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Developer access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
