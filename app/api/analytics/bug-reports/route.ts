import { type NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "../_auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
	const { service, error } = await requireSuperAdmin();
	if (error) return error;

	const { searchParams } = request.nextUrl;
	const severity = searchParams.get("severity");
	const category = searchParams.get("category");
	const status = searchParams.get("status");

	let query = service
		.schema("analytics")
		.from("bug_reports")
		.select("*")
		.order("created_at", { ascending: false })
		.limit(100);

	if (severity && severity !== "all") query = query.eq("severity", severity);
	if (category && category !== "all") query = query.eq("category", category);
	if (status && status !== "all") query = query.eq("status", status);

	const { data, error: dbError } = await query;

	if (dbError) {
		console.error("[analytics/bug-reports] Query failed:", dbError.message);
		return NextResponse.json({ error: "Query failed" }, { status: 500 });
	}

	return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
	const { service, error } = await requireSuperAdmin();
	if (error) return error;

	let body: { id: string; status?: string; admin_notes?: string };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body.id || typeof body.id !== "string") {
		return NextResponse.json({ error: "id required" }, { status: 400 });
	}

	const updates: Record<string, unknown> = {};
	if (body.status !== undefined) updates.status = body.status;
	if (body.admin_notes !== undefined) updates.admin_notes = body.admin_notes;
	if (body.status === "resolved") updates.resolved_at = new Date().toISOString();

	const { error: dbError } = await service
		.schema("analytics")
		.from("bug_reports")
		.update(updates)
		.eq("id", body.id);

	if (dbError) {
		console.error("[analytics/bug-reports] Update failed:", dbError.message);
		return NextResponse.json({ error: "Update failed" }, { status: 500 });
	}

	return NextResponse.json({ ok: true });
}
