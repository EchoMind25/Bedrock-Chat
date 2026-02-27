import { NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function POST(): Promise<NextResponse> {
	const auth = await requireSuperAdmin();
	if (!auth.ok) return auth.response;

	const { data, error } = await auth.service.rpc("analytics_run_aggregation", {
		retention_days: 30,
	});

	if (error) {
		console.error("[analytics/aggregate] Aggregation failed:", error.message, error.code);
		return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
	}

	return NextResponse.json({ ok: true, result: data }, { status: 200 });
}
