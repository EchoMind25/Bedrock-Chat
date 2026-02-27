import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(): Promise<NextResponse> {
	// Require authentication
	const serverClient = await createClient();
	const {
		data: { user },
	} = await serverClient.auth.getUser();

	if (!user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	// Require super_admin platform role
	const service = createServiceClient();
	const { data: profile } = await service
		.from("profiles")
		.select("platform_role")
		.eq("id", user.id)
		.single();

	if (profile?.platform_role !== "super_admin") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	// Run aggregation
	const { data, error } = await service
		.schema("analytics")
		.rpc("aggregate_and_purge", { retention_days: 30 });

	if (error) {
		console.error("[analytics/aggregate] RPC failed:", error.message, error.code);
		return NextResponse.json({ error: "Aggregation failed", code: error.code }, { status: 500 });
	}

	return NextResponse.json({ ok: true, result: data }, { status: 200 });
}
