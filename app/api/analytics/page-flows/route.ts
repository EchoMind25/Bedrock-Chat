import { type NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await requireSuperAdmin();
	if (!auth.ok) return auth.response;

	const { searchParams } = request.nextUrl;
	const start = searchParams.get("start");
	const end = searchParams.get("end");

	if (!start || !end) {
		return NextResponse.json({ error: "start and end required" }, { status: 400 });
	}

	const { data, error } = await auth.service
		.schema("analytics")
		.from("daily_page_flows")
		.select("from_path, to_path, transition_count, unique_sessions, avg_time_on_from_seconds")
		.gte("date", start)
		.lte("date", end)
		.order("transition_count", { ascending: false })
		.limit(50);

	if (error) {
		console.error("[analytics/page-flows]", error.message, error.code);
		return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
	}

	return NextResponse.json({ data: data ?? [] });
}
