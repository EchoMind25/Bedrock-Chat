/**
 * GET /api/auth/confirm?code=xxx
 *
 * Server-side PKCE token exchange for email confirmation.
 *
 * This route is the target of the confirmation email link. It:
 *   1. Reads the encrypted code_verifier from the __bedrock_pkce httpOnly cookie
 *   2. Decrypts the verifier
 *   3. Exchanges the Supabase authorization code for session tokens via REST
 *   4. Writes the session to Supabase SSR cookies (via setSession)
 *   5. Creates the user profile if this is a new user
 *   6. Deletes the __bedrock_pkce cookie (single-use)
 *   7. Redirects to /onboarding or /friends
 *
 * This approach fixes email confirmation in Tor/private browsing where
 * client-side localStorage/sessionStorage is unavailable between page loads.
 * The cookie (set server-side with httpOnly) survives within the same
 * browser session, even through Tor circuit rotation.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { decryptVerifier, PKCE_COOKIE_NAME } from "@/lib/crypto/pkce";

// ── GET /api/auth/confirm ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
	const { searchParams, origin } = new URL(request.url);

	// ── 1. Rate Limiting ──────────────────────────────────────────────────────
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	const { allowed } = checkRateLimit(`confirm:${ip}`, 5, 15 * 60 * 1000);
	if (!allowed) {
		// Redirect rather than JSON — this is a browser GET navigation
		return NextResponse.redirect(`${origin}/login?error=too_many_requests`);
	}

	// ── 2. Extract Authorization Code ─────────────────────────────────────────
	const code = searchParams.get("code");
	if (!code) {
		return NextResponse.redirect(`${origin}/login?error=link_expired`);
	}

	// ── 3. Read + Decrypt PKCE Cookie ─────────────────────────────────────────
	const encryptionKey = process.env.PKCE_ENCRYPTION_KEY;

	// If PKCE is not configured, forward to the standard /auth/callback handler
	// which uses Supabase SDK's exchangeCodeForSession() (reads verifier from
	// client storage) or token_hash OTP verification.
	if (!encryptionKey) {
		const callbackUrl = new URL(`${origin}/auth/callback`);
		callbackUrl.searchParams.set("code", code);
		return NextResponse.redirect(callbackUrl.toString());
	}

	const cookieStore = await cookies();
	const encryptedVerifier = cookieStore.get(PKCE_COOKIE_NAME)?.value;

	if (!encryptedVerifier) {
		// Cookie is missing. Possible causes:
		//   (a) User opened the link in a different browser/profile (cookie not shared)
		//   (b) Cookie expired (>24 hours since signup)
		//   (c) User already clicked this link (cookie deleted on first use)
		return NextResponse.redirect(`${origin}/login?error=link_expired`);
	}

	let verifier: string;
	try {
		verifier = decryptVerifier(encryptedVerifier, encryptionKey);
	} catch {
		// Decryption failed: tampered cookie, wrong key, or corrupted data.
		// Log server-side only — never expose crypto failure reason to client.
		console.error("[CONFIRM] Failed to decrypt PKCE verifier cookie");
		return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
	}

	// ── 4. Exchange Code for Session Tokens (Supabase REST) ──────────────────
	// We call the REST API directly with our server-held verifier.
	// Do NOT use supabase.auth.exchangeCodeForSession(code) — that method reads
	// the verifier from client storage (the problem we're solving).
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !anonKey) {
		console.error("[CONFIRM] Missing Supabase environment variables");
		return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
	}

	const tokenResponse = await fetch(
		`${supabaseUrl}/auth/v1/token?grant_type=pkce`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: anonKey,
			},
			body: JSON.stringify({
				auth_code: code,
				code_verifier: verifier,
			}),
		},
	);

	const tokenData = await tokenResponse.json().catch(() => null);

	if (!tokenResponse.ok || !tokenData?.access_token) {
		// Token exchange failed. Common causes:
		//   - Code already used (Supabase codes are single-use)
		//   - Code expired (Supabase has a 10-minute TTL on confirmation codes)
		//   - Verifier mismatch (shouldn't happen if cookie is intact)
		console.error(
			"[CONFIRM] Token exchange failed:",
			tokenData?.error_description ?? tokenData?.msg ?? "unknown",
		);

		// Delete the cookie even on failure — the code is burned, verifier is useless
		const errResponse = NextResponse.redirect(
			`${origin}/login?error=confirmation_failed`,
		);
		errResponse.cookies.delete(PKCE_COOKIE_NAME);
		return errResponse;
	}

	// ── 5. Write Session via Supabase SSR Client ──────────────────────────────
	// Use setSession() with the tokens we obtained via REST.
	// This writes the Supabase session cookies (sb-*-auth-token) via @supabase/ssr.
	// Do NOT use exchangeCodeForSession() — same reason as above.
	const supabase = await createClient();

	const { error: sessionError } = await supabase.auth.setSession({
		access_token: tokenData.access_token,
		refresh_token: tokenData.refresh_token,
	});

	if (sessionError) {
		console.error("[CONFIRM] Failed to set session:", sessionError.message);
		const errResponse = NextResponse.redirect(
			`${origin}/login?error=confirmation_failed`,
		);
		errResponse.cookies.delete(PKCE_COOKIE_NAME);
		return errResponse;
	}

	// ── 6. Ensure Profile Exists ──────────────────────────────────────────────
	// Create the profile row if it doesn't exist (same pattern as /auth/callback).
	// Now that the session is established, getUser() returns the confirmed user.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	let isNewUser = false;

	if (user) {
		const { data: existingProfile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.maybeSingle();

		if (!existingProfile) {
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

			isNewUser = true;
		}
	}

	// ── 7. Delete PKCE Cookie + Redirect ─────────────────────────────────────
	// Delete AFTER setSession succeeds — if we deleted before and setSession
	// failed, the verifier would be permanently lost (no retry possible).
	const destination = isNewUser ? "/onboarding" : "/friends";
	const successResponse = NextResponse.redirect(`${origin}${destination}`);

	// Cookie is consumed — delete it so it cannot be replayed
	successResponse.cookies.delete(PKCE_COOKIE_NAME);

	return successResponse;
}
