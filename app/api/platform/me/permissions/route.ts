import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createClient();
		const { data: { user }, error: authError } = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get platform role from profiles
		const { data: profile } = await supabase
			.from("profiles")
			.select("platform_role")
			.eq("id", user.id)
			.single();

		const role = profile?.platform_role ?? "user";

		// Get permissions (RLS ensures user can only read own row)
		const { data: permissions } = await supabase
			.from("platform_permissions")
			.select("*")
			.eq("user_id", user.id)
			.single();

		// Strip internal fields from permissions response
		let cleanPermissions = null;
		if (permissions) {
			const { id: _id, user_id: _uid, granted_by: _gb, created_at: _ca, updated_at: _ua, ...perms } = permissions;
			cleanPermissions = perms;
		}

		return NextResponse.json({ role, permissions: cleanPermissions });
	} catch {
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
