/**
 * POST /api/auth/signup
 *
 * Server-side signup handler that generates the PKCE code_verifier,
 * stores it encrypted in an httpOnly cookie, and calls Supabase's REST
 * API directly (bypassing the browser SDK which would store the verifier
 * in localStorage/sessionStorage — breaking Tor/private browsing).
 *
 * The encrypted verifier is stored in the __bedrock_pkce cookie and
 * consumed by /api/auth/confirm when the user clicks the email link.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import {
	generateCodeVerifier,
	generateCodeChallenge,
	encryptVerifier,
	PKCE_COOKIE_NAME,
	PKCE_COOKIE_MAX_AGE,
} from "@/lib/crypto/pkce";

// ── Types ────────────────────────────────────────────────────────────────────

interface SignupBody {
	email: string;
	password: string;
	username: string;
	accountType: "standard" | "parent" | "teen";
	parentEmail?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rateLimitResponse(retryAfterMs: number) {
	return NextResponse.json(
		{ error: "Too many requests" },
		{
			status: 429,
			headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
		},
	);
}

function parseBody(raw: unknown): SignupBody | null {
	if (typeof raw !== "object" || raw === null) return null;
	const b = raw as Record<string, unknown>;

	if (
		typeof b.email !== "string" ||
		typeof b.password !== "string" ||
		typeof b.username !== "string"
	) {
		return null;
	}

	const accountType = b.accountType;
	if (
		accountType !== "standard" &&
		accountType !== "parent" &&
		accountType !== "teen"
	) {
		return null;
	}

	return {
		email: (b.email as string).toLowerCase().trim(),
		password: b.password as string,
		username: (b.username as string).trim(),
		accountType,
		parentEmail:
			typeof b.parentEmail === "string" && b.parentEmail.trim()
				? b.parentEmail.trim()
				: undefined,
	};
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
	// ── 1. Rate Limiting ──────────────────────────────────────────────────────
	const ip =
		request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
	const { allowed, retryAfterMs } = checkRateLimit(
		`signup:${ip}`,
		5,
		15 * 60 * 1000,
	);
	if (!allowed) return rateLimitResponse(retryAfterMs);

	// ── 2. Parse + Validate Body ─────────────────────────────────────────────
	const rawBody = await request.json().catch(() => null);
	const body = rawBody ? parseBody(rawBody) : null;

	if (!body) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}

	if (body.password.length < 8) {
		return NextResponse.json(
			{ error: "Password must be at least 8 characters" },
			{ status: 400 },
		);
	}

	if (body.username.length < 3) {
		return NextResponse.json(
			{ error: "Username must be at least 3 characters" },
			{ status: 400 },
		);
	}

	if (body.accountType === "teen" && !body.parentEmail) {
		return NextResponse.json(
			{ error: "Parent email required for teen accounts" },
			{ status: 400 },
		);
	}

	// ── 3. Config Guards ─────────────────────────────────────────────────────
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const encryptionKey = process.env.PKCE_ENCRYPTION_KEY;

	// PKCE_ENCRYPTION_KEY is optional — when set, we store the PKCE verifier
	// in an encrypted httpOnly cookie (supports Tor/private browsing).
	// When absent, we use the standard Supabase confirmation flow via /auth/callback.
	if (!supabaseUrl || !anonKey || !serviceRoleKey) {
		console.error("[SIGNUP] Missing required environment variables");
		return NextResponse.json(
			{ error: "Server configuration error" },
			{ status: 500 },
		);
	}

	const usePkce = !!encryptionKey;

	// ── 4. Username Uniqueness Check ─────────────────────────────────────────
	// Admin client bypasses RLS so we can query profiles without authentication.
	const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);

	const { data: existingUser } = await adminClient
		.from("profiles")
		.select("id")
		.ilike("username", body.username)
		.maybeSingle();

	if (existingUser) {
		return NextResponse.json(
			{ error: "Username is already taken" },
			{ status: 409 },
		);
	}

	// ── 5. PKCE Generation (conditional) ────────────────────────────────────
	let verifier: string | null = null;
	let challenge: string | null = null;

	if (usePkce) {
		verifier = generateCodeVerifier(); // 43-char base64url random
		challenge = generateCodeChallenge(verifier); // SHA-256 base64url of verifier
	}

	// ── 6. Determine Redirect URL ────────────────────────────────────────────
	// This is where Supabase will redirect after the user clicks the email link.
	// We prefer the explicit NEXT_PUBLIC_APP_URL env var over inferring from headers
	// since load balancers and proxies can strip or modify the Origin header.
	const appUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		request.headers.get("origin") ||
		"http://localhost:3000";

	// PKCE mode → our custom /api/auth/confirm (reads verifier from cookie)
	// Standard mode → /auth/callback (handles token_hash confirmation)
	const redirectTo = usePkce
		? `${appUrl}/api/auth/confirm`
		: `${appUrl}/auth/callback`;

	// ── 7. Supabase REST Signup ──────────────────────────────────────────────
	// Call Supabase's signup REST endpoint directly (NOT the SDK).
	// When PKCE is enabled, we include the code_challenge so the verifier
	// can be exchanged server-side. Without PKCE, Supabase sends a standard
	// token_hash confirmation link handled by /auth/callback.
	const supabaseResponse = await fetch(
		`${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				apikey: anonKey,
			},
			body: JSON.stringify({
				email: body.email,
				password: body.password,
				data: {
					username: body.username,
					account_type: body.accountType,
					...(body.parentEmail
						? { parent_email: body.parentEmail }
						: {}),
				},
				...(usePkce && challenge
					? { code_challenge: challenge, code_challenge_method: "S256" }
					: {}),
			}),
		},
	);

	const signupData = await supabaseResponse.json().catch(() => null);

	// ── 8. Handle Supabase Response ──────────────────────────────────────────
	if (!supabaseResponse.ok) {
		const errorMessage: string =
			signupData?.msg ?? signupData?.message ?? signupData?.error_description ?? "";

		// When an email is already registered AND confirmed, Supabase returns 400
		// with "User already registered". We return 200 { success: true } to prevent
		// email enumeration — attacker gets no signal about whether the email exists.
		if (
			errorMessage.toLowerCase().includes("user already registered") ||
			errorMessage.toLowerCase().includes("already registered")
		) {
			return NextResponse.json(
				{ success: true, message: "Check your email to confirm your account" },
				{ status: 200 },
			);
		}

		console.error("[SIGNUP] Supabase signup error:", errorMessage);
		return NextResponse.json({ error: "Signup failed" }, { status: 500 });
	}

	// HTTP 200 from Supabase: new registration OR resend for an unconfirmed email.
	// In both cases Supabase sends a confirmation email with a new PKCE code.
	// We encrypt a fresh verifier and overwrite any existing __bedrock_pkce cookie.

	// ── 9. Encrypt Verifier + Set Cookie (PKCE only) ────────────────────────
	const response = NextResponse.json(
		{ success: true, message: "Check your email to confirm your account" },
		{ status: 200 },
	);

	if (usePkce && verifier && encryptionKey) {
		const encryptedVerifier = encryptVerifier(verifier, encryptionKey);
		const isProduction = process.env.NODE_ENV === "production";

		// SameSite: 'lax' is critical — allows the cookie to be sent on top-level GET
		// navigations from external origins (e.g., the user clicking the email link
		// in their email client). 'strict' would block this cross-origin redirect.
		response.cookies.set(PKCE_COOKIE_NAME, encryptedVerifier, {
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: PKCE_COOKIE_MAX_AGE,
			path: "/",
		});
	}

	return response;
}
