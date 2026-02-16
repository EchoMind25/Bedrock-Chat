import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

function rateLimitResponse(retryAfterMs: number) {
	return NextResponse.json(
		{ error: "Too many requests" },
		{ status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } },
	);
}

// POST /api/account/delete
// Permanently delete user account and all associated data (GDPR Art. 17)
export async function POST(request: NextRequest) {
	const ip = request.headers.get("x-forwarded-for") || "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(`account-delete:${ip}`, 5, 60_000);
	if (!allowed) return rateLimitResponse(retryAfterMs);

	try {
		// 1. Authenticate via Supabase cookies
		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// 2. Require password confirmation
		const body = await request.json().catch(() => null);
		if (!body || typeof body.password !== "string" || !body.password) {
			return NextResponse.json({ error: "Password is required" }, { status: 400 });
		}

		// 3. Verify password by attempting sign-in
		const { error: signInError } = await supabase.auth.signInWithPassword({
			email: user.email!,
			password: body.password,
		});

		if (signInError) {
			return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
		}

		// 4. Delete user data from all application tables in dependency order
		const userId = user.id;
		const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
		if (!serviceRoleKey) {
			console.error("[ACCOUNT DELETE] SUPABASE_SERVICE_ROLE_KEY not configured");
			return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
		}

		const adminClient = createAdminClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			serviceRoleKey,
		);

		// Delete in dependency order — child records first, then parent records
		const deletions = [
			adminClient.from("message_reactions").delete().eq("user_id", userId),
			adminClient.from("messages").delete().eq("user_id", userId),
			adminClient.from("voice_participants").delete().eq("user_id", userId),
			adminClient.from("voice_sessions").delete().eq("user_id", userId),
			adminClient.from("server_members").delete().eq("user_id", userId),
			adminClient.from("role_members").delete().eq("user_id", userId),
		];

		const results = await Promise.all(deletions);
		for (const result of results) {
			if (result.error) {
				console.error("[ACCOUNT DELETE] Batch 1 deletion error:", result.error.message);
			}
		}

		// Friendship & social tables (bidirectional relations)
		const socialDeletions = [
			adminClient.from("friend_requests").delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
			adminClient.from("friendships").delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`),
			adminClient.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
			adminClient.from("direct_messages").delete().eq("sender_id", userId),
		];

		const socialResults = await Promise.all(socialDeletions);
		for (const result of socialResults) {
			if (result.error) {
				console.error("[ACCOUNT DELETE] Social deletion error:", result.error.message);
			}
		}

		// Family & settings tables
		const finalDeletions = [
			adminClient.from("family_activity_log").delete().eq("user_id", userId),
			adminClient.from("family_members").delete().eq("user_id", userId),
			adminClient.from("user_settings").delete().eq("user_id", userId),
			adminClient.from("profiles").delete().eq("id", userId),
		];

		const finalResults = await Promise.all(finalDeletions);
		for (const result of finalResults) {
			if (result.error) {
				console.error("[ACCOUNT DELETE] Final deletion error:", result.error.message);
			}
		}

		// 5. Delete the auth user via admin API
		const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
		if (deleteAuthError) {
			console.error("[ACCOUNT DELETE] Auth user deletion failed:", deleteAuthError.message);
			return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[ACCOUNT DELETE] Unexpected error:", error);
		return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
	}
}
