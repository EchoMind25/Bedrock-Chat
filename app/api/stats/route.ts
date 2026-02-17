import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

/**
 * GET /api/stats
 *
 * Returns aggregate platform statistics (user count, message count, server count).
 * - Uses service role key server-side only (never exposed to client)
 * - Returns aggregate counts only — no PII
 * - Cached for 60 seconds to reduce DB load
 * - Rate limited to prevent abuse
 */

interface StatsResponse {
	users: number;
	messages: number;
	servers: number;
	cachedAt: number;
}

// In-memory cache
let cachedStats: StatsResponse | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

function createServiceClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		throw new Error("Missing Supabase configuration");
	}

	return createClient(url, serviceKey);
}

async function fetchStats(): Promise<StatsResponse> {
	// Return cached if still fresh
	if (cachedStats && Date.now() - cachedStats.cachedAt < CACHE_TTL_MS) {
		return cachedStats;
	}

	const supabase = createServiceClient();

	// Run all count queries in parallel for performance
	const [usersResult, messagesResult, serversResult] = await Promise.all([
		supabase.from("profiles").select("*", { count: "exact", head: true }),
		supabase.from("messages").select("*", { count: "exact", head: true }),
		supabase.from("servers").select("*", { count: "exact", head: true }),
	]);

	const stats: StatsResponse = {
		users: usersResult.count ?? 0,
		messages: messagesResult.count ?? 0,
		servers: serversResult.count ?? 0,
		cachedAt: Date.now(),
	};

	cachedStats = stats;
	return stats;
}

export async function GET(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`stats:${ip}`, 20, 60_000);

	if (!allowed) {
		return NextResponse.json(
			{ error: "Too many requests" },
			{
				status: 429,
				headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
			},
		);
	}

	try {
		const stats = await fetchStats();

		return NextResponse.json(
			{
				users: stats.users,
				messages: stats.messages,
				servers: stats.servers,
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
				},
			},
		);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch stats" },
			{ status: 500 },
		);
	}
}
