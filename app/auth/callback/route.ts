import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function isValidRedirect(path: string | null): path is string {
	if (!path) return false;
	if (!path.startsWith("/")) return false;
	if (path.startsWith("//")) return false;
	if (path.includes("\\")) return false;
	return true;
}

/**
 * Ensure the user has a profile row. Creates one from user_metadata if missing.
 * Returns whether this is a new user (profile was just created).
 */
async function ensureProfile(
	supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<boolean> {
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return false;

	const { data: existingProfile } = await supabase
		.from("profiles")
		.select("id")
		.eq("id", user.id)
		.maybeSingle();

	if (existingProfile) return false;

	const metadata = user.user_metadata;
	const username =
		metadata?.username ||
		user.email?.split("@")[0] ||
		`user_${user.id.slice(0, 8)}`;

	await supabase.from("profiles").insert({
		id: user.id,
		username,
		display_name: username,
		account_type: metadata?.account_type || "standard",
	});

	return true;
}

/**
 * Auth callback handler for Supabase email confirmation links.
 *
 * Supports two auth flows:
 *
 * 1. **PKCE flow** (default for SSR) — Supabase redirects with `?code=xxx`.
 *    We exchange the code for a session using the code_verifier stored in cookies.
 *
 * 2. **Email OTP / token_hash flow** — Supabase redirects with `?token_hash=xxx&type=signup`.
 *    This happens when the PKCE code_verifier cookie is missing (e.g. user opens the
 *    confirmation link in a different browser or device). We verify the OTP directly.
 *
 * After either flow succeeds we create the user's profile if it doesn't exist yet
 * and redirect to the main app.
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");
	const token_hash = searchParams.get("token_hash");
	const type = searchParams.get("type") as EmailOtpType | null;
	const next = searchParams.get("next");

	const supabase = await createClient();

	// ── Flow 1: PKCE code exchange ──────────────────────────────────────
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			const isNewUser = await ensureProfile(supabase);
			const defaultRedirect = isNewUser ? "/onboarding" : "/friends";
			const redirectTo = isValidRedirect(next) ? next : defaultRedirect;
			return NextResponse.redirect(`${origin}${redirectTo}`);
		}
	}

	// ── Flow 2: Email OTP / token_hash verification ─────────────────────
	// Fallback when PKCE verifier cookie is missing (different browser/device)
	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ token_hash, type });

		if (!error) {
			const isNewUser = await ensureProfile(supabase);
			const defaultRedirect = isNewUser ? "/onboarding" : "/friends";
			const redirectTo = isValidRedirect(next) ? next : defaultRedirect;
			return NextResponse.redirect(`${origin}${redirectTo}`);
		}
	}

	// Both flows failed or no params — redirect to login with error context
	return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
