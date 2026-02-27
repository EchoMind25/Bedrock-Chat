import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type ServiceClient = ReturnType<typeof createServiceClient>;

export type AdminAuthResult =
	| { ok: true; service: ServiceClient }
	| { ok: false; response: NextResponse };

/**
 * Verifies the request is from an authenticated super_admin.
 * Returns the service client on success, or an error response.
 * All failures are caught and returned — never throws.
 */
export async function requireSuperAdmin(): Promise<AdminAuthResult> {
	try {
		const serverClient = await createClient();
		const {
			data: { user },
		} = await serverClient.auth.getUser();

		if (!user) {
			return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
		}

		const service = createServiceClient();
		const { data: profile, error: profileError } = await service
			.from("profiles")
			.select("platform_role")
			.eq("id", user.id)
			.single();

		if (profileError) {
			console.error("[analytics auth] Profile query failed:", profileError.message, profileError.code);
			return {
				ok: false,
				response: NextResponse.json({ error: "Auth check failed", detail: profileError.message }, { status: 500 }),
			};
		}

		if (profile?.platform_role !== "super_admin") {
			return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
		}

		return { ok: true, service };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error("[analytics auth] Unexpected error:", msg);
		return {
			ok: false,
			response: NextResponse.json({ error: "Auth error", detail: msg }, { status: 500 }),
		};
	}
}
