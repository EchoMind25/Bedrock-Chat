import { type NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const auth = await requireSuperAdmin();
	if (!auth.ok) return auth.response;

	const { searchParams } = request.nextUrl;
	const severity = searchParams.get("severity");
	const category = searchParams.get("category");
	const status = searchParams.get("status");

	const { data, error } = await auth.service.rpc("analytics_get_bug_reports", {
		p_severity: severity && severity !== "all" ? severity : null,
		p_category: category && category !== "all" ? category : null,
		p_status: status && status !== "all" ? status : null,
	});

	if (error) {
		console.error("[analytics/bug-reports GET]", error.message, error.code);
		return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
	}

	return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
	const auth = await requireSuperAdmin();
	if (!auth.ok) return auth.response;

	let body: { id: string; status?: string; admin_notes?: string };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.id || typeof body.id !== "string") {
		return NextResponse.json({ error: "id required" }, { status: 400 });
	}

	const { error } = await auth.service.rpc("analytics_update_bug_report", {
		p_id: body.id,
		p_status: body.status ?? null,
		p_admin_notes: body.admin_notes ?? null,
	});

	if (error) {
		console.error("[analytics/bug-reports PATCH]", error.message, error.code);
		return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
