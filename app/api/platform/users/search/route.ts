import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requirePlatformRole } from "@/lib/platform-roles.server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`user-search:${ip}`, 30, 60_000);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
		);
	}

	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();
		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Require at least super_admin to search users for role management
		await requirePlatformRole(user.id, "super_admin");

		const query = request.nextUrl.searchParams.get("q")?.trim();
		if (!query || query.length < 2) {
			return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
		}

		const serviceClient = createServiceClient();

		// Escape SQL LIKE wildcards in user input, then wrap with our own wildcards
		const escaped = query.replace(/[%_\\]/g, "\\$&");
		const pattern = `%${escaped}%`;

		// Run two parallel searches to avoid fragile .or() string interpolation
		const [byUsername, byDisplayName] = await Promise.all([
			serviceClient
				.from("profiles")
				.select("id, username, display_name, platform_role")
				.ilike("username", pattern)
				.order("username", { ascending: true })
				.limit(20),
			serviceClient
				.from("profiles")
				.select("id, username, display_name, platform_role")
				.ilike("display_name", pattern)
				.order("username", { ascending: true })
				.limit(20),
		]);

		if (byUsername.error && byDisplayName.error) {
			console.error("User search errors:", byUsername.error, byDisplayName.error);
			return NextResponse.json({ error: "Search failed" }, { status: 500 });
		}

		// Merge and deduplicate results
		const seen = new Set<string>();
		const users: typeof byUsername.data = [];
		for (const result of [byUsername, byDisplayName]) {
			for (const user of result.data ?? []) {
				if (!seen.has(user.id)) {
					seen.add(user.id);
					users.push(user);
				}
			}
		}
		users.sort((a, b) => a.username.localeCompare(b.username));

		return NextResponse.json({ users });
	} catch (err) {
		const message = err instanceof Error ? err.message : "Internal error";
		if (message === "UNAUTHORIZED") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		if (message === "FORBIDDEN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
