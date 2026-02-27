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

	const { data, error: dbError } = await service
		.schema("analytics")
		.from("daily_performance")
		.select("date, metric_name, page_path, p50_ms, p75_ms, p95_ms, p99_ms, sample_count, error_count")
		.gte("date", start)
		.lte("date", end);

	if (dbError) {
		console.error("[analytics/performance] Query failed:", dbError.message);
		return NextResponse.json({ error: "Query failed" }, { status: 500 });
	}

	return NextResponse.json({ data: data ?? [] });
}
