import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed } = checkRateLimit(`audit-log:${ip}`, 20, 60_000);
	if (!allowed) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Require admin+ role
		await requirePlatformRole(user.id, "admin");

		const searchParams = request.nextUrl.searchParams;
		const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
		const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
		const action = searchParams.get("action");
		const actorId = searchParams.get("actorId");
		const targetId = searchParams.get("targetId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		const serviceClient = createServiceClient();
		const offset = (page - 1) * limit;

		let query = serviceClient
			.from("platform_role_audit_log")
			.select("*, actor:profiles!platform_role_audit_log_actor_id_fkey(username, display_name, avatar_url), target:profiles!platform_role_audit_log_target_user_id_fkey(username, display_name, avatar_url)", { count: "exact" })
			.order("created_at", { ascending: false })
			.range(offset, offset + limit - 1);

		if (action) {
			query = query.eq("action", action);
		}
		if (actorId) {
			query = query.eq("actor_id", actorId);
		}
		if (targetId) {
			query = query.eq("target_user_id", targetId);
		}
		if (startDate) {
			query = query.gte("created_at", startDate);
		}
		if (endDate) {
			query = query.lte("created_at", endDate);
		}

		const { data: entries, count, error } = await query;

		if (error) {
			return NextResponse.json({ error: "Failed to fetch audit log" }, { status: 500 });
		}

		return NextResponse.json({
			entries: entries ?? [],
			total: count ?? 0,
			page,
			limit,
			totalPages: Math.ceil((count ?? 0) / limit),
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "UNAUTHORIZED") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Admin access required" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
