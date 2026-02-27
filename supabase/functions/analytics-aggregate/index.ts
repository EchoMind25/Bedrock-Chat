/**
 * Supabase Edge Function: analytics-aggregate
 *
 * Runs daily at 03:00 UTC via cron schedule.
 * Calls analytics.aggregate_and_purge(30) to:
 * 1. Aggregate raw events into daily aggregate tables
 * 2. Purge raw_events and error_events older than 30 days
 *
 * Schedule (add to supabase/config.toml):
 * [functions.analytics-aggregate]
 * schedule = "0 3 * * *"
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

interface AggregateResult {
	aggregated_through: string;
	raw_events_purged: number;
	error_events_purged: number;
	timestamp: string;
}

Deno.serve(async (_req: Request) => {
	const supabaseUrl = Deno.env.get("SUPABASE_URL");
	const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

	if (!supabaseUrl || !serviceKey) {
		console.error("[analytics-aggregate] Missing required environment variables");
		return new Response(
			JSON.stringify({ error: "Missing configuration" }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	const supabase = createClient(supabaseUrl, serviceKey);

	console.log("[analytics-aggregate] Starting daily aggregation...");

	const { data, error } = await supabase
		.schema("analytics")
		.rpc("aggregate_and_purge", { retention_days: 30 });

	if (error) {
		console.error("[analytics-aggregate] Aggregation failed:", error.message, error.code);
		return new Response(
			JSON.stringify({ error: "Aggregation failed", code: error.code }),
			{ status: 500, headers: { "Content-Type": "application/json" } },
		);
	}

	const result = data as AggregateResult;
	console.log(
		`[analytics-aggregate] Done — purged ${result.raw_events_purged} raw events, ${result.error_events_purged} error events through ${result.aggregated_through}`,
	);

	return new Response(
		JSON.stringify({
			ok: true,
			aggregated_through: result.aggregated_through,
			raw_events_purged: result.raw_events_purged,
			error_events_purged: result.error_events_purged,
		}),
		{ status: 200, headers: { "Content-Type": "application/json" } },
	);
});
