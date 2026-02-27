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

	const { data, error } = await auth.service.rpc("analytics_get_performance", {
		p_start: start,
		p_end: end,
	});

	if (error) {
		console.error("[analytics/performance]", error.message, error.code);
		return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
	}

	return NextResponse.json({ data: data ?? [] });
}
