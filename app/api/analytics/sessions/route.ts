import { type NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { service, error } = await requireSuperAdmin();
	if (error) return error;

	const { searchParams } = request.nextUrl;
	const start = searchParams.get("start");
	const end = searchParams.get("end");

	if (!start || !end) {
		return NextResponse.json({ error: "start and end required" }, { status: 400 });
	}

	const [sessRes, hourRes] = await Promise.all([
		service
			.schema("analytics")
			.from("daily_sessions")
			.select("date, total_sessions, avg_duration_seconds, median_duration_seconds, avg_pages_per_session, bounce_rate, device_category")
			.gte("date", start)
			.lte("date", end)
			.order("date", { ascending: true }),
		service
			.schema("analytics")
			.from("hourly_active_sessions")
			.select("date, hour_utc, active_sessions")
			.gte("date", start)
			.lte("date", end),
	]);

	if (sessRes.error) {
		console.error("[analytics/sessions] Sessions query failed:", sessRes.error.message);
		return NextResponse.json({ error: "Query failed" }, { status: 500 });
	}

	return NextResponse.json({
		sessions: sessRes.data ?? [],
		hourly: hourRes.data ?? [],
	});
}
