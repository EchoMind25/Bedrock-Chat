import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthResult {
	service: SupabaseClient;
	error?: NextResponse;
}

/**
 * Verifies the request is from an authenticated super_admin.
 * Returns the service client on success, or an error NextResponse.
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
	const serverClient = await createClient();
	const {
		data: { user },
	} = await serverClient.auth.getUser();

	if (!user) {
		return { service: null as unknown as SupabaseClient, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
	}

	const service = createServiceClient();
	const { data: profile } = await service
		.from("profiles")
		.select("platform_role")
		.eq("id", user.id)
		.single();

	if (profile?.platform_role !== "super_admin") {
		return { service: null as unknown as SupabaseClient, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}

	return { service };
}
