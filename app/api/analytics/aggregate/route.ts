import { NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function POST(): Promise<NextResponse> {
	const { error } = await requireSuperAdmin();
	if (error) return error;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceKey) {
		return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
	}

	let res: Response;
	try {
		res = await fetch(`${supabaseUrl}/functions/v1/analytics-aggregate`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${serviceKey}`,
				"Content-Type": "application/json",
			},
		});
	} catch (fetchError) {
		console.error("[analytics/aggregate] Edge function unreachable:", fetchError);
		return NextResponse.json({ error: "Edge function unreachable" }, { status: 502 });
	}

	let json: unknown;
	try {
		json = await res.json();
	} catch {
		json = {};
	}

	if (!res.ok) {
		console.error("[analytics/aggregate] Edge function returned:", res.status, json);
		return NextResponse.json({ error: "Aggregation failed", detail: json }, { status: 500 });
	}

	return NextResponse.json({ ok: true, result: json }, { status: 200 });
}
