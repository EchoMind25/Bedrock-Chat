import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`pending-bots:${ip}`, 30, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await requirePlatformRole(user.id, "admin");

		const serviceClient = createServiceClient();

		const { data: bots, error } = await serviceClient
			.from("bot_applications")
			.select(`
				id, name, description, bot_type, status, webhook_url,
				is_teen_safe, scopes, created_at,
				owner:profiles!owner_id (id, username, display_name, avatar_url, account_type)
			`)
			.eq("status", "pending")
			.order("created_at", { ascending: true });

		if (error) {
			return NextResponse.json({ error: "Failed to fetch pending bots" }, { status: 500 });
		}

		return NextResponse.json({ bots: bots ?? [], total: bots?.length ?? 0 });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Admin access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
