/**
 * POST /api/auth/signup
 *
 * Server-side signup handler with two modes:
 *
 * 1. **PKCE mode** (PKCE_ENCRYPTION_KEY set): Generates a PKCE code_verifier,
 *    stores it encrypted in an httpOnly cookie, and calls Supabase's REST API
 *    directly. Designed for Tor/private browsing where localStorage is unavailable.
 *    Confirmation links redirect to /api/auth/confirm.
 *
 * 2. **Standard mode** (PKCE_ENCRYPTION_KEY absent): Uses the Supabase SSR
 *    client which handles PKCE automatically via cookie-based storage managed
 *    by @supabase/ssr. Confirmation links redirect to /auth/callback where
 *    exchangeCodeForSession() reads the verifier from the SSR cookies.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
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

	// ── 5. Determine Redirect URL ────────────────────────────────────────────
	// This is where Supabase will redirect after the user clicks the email link.
	// We prefer the explicit NEXT_PUBLIC_APP_URL env var over inferring from headers
	// since load balancers and proxies can strip or modify the Origin header.
	const appUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		request.headers.get("origin") ||
		"http://localhost:3000";

	// ── 6. Branch: PKCE mode vs Standard mode ───────────────────────────────
	if (usePkce) {
		return signupWithPkce(body, supabaseUrl, anonKey, encryptionKey, appUrl);
	}
	return signupStandard(body, appUrl);
}

// ── PKCE Mode: REST API + encrypted httpOnly cookie ─────────────────────────
// For Tor/private browsing: we control the verifier storage ourselves.
async function signupWithPkce(
	body: SignupBody,
	supabaseUrl: string,
	anonKey: string,
	encryptionKey: string,
	appUrl: string,
) {
	const verifier = generateCodeVerifier();
	const challenge = generateCodeChallenge(verifier);
	const redirectTo = `${appUrl}/api/auth/confirm`;

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
				code_challenge: challenge,
				code_challenge_method: "S256",
			}),
		},
	);

	const signupData = await supabaseResponse.json().catch(() => null);

	if (!supabaseResponse.ok) {
		const errorMessage: string =
			signupData?.msg ??
			signupData?.message ??
			signupData?.error_description ??
			"";

		if (
			errorMessage.toLowerCase().includes("user already registered") ||
			errorMessage.toLowerCase().includes("already registered")
		) {
			return NextResponse.json(
				{
					success: true,
					message: "Check your email to confirm your account",
				},
				{ status: 200 },
			);
		}

		console.error("[SIGNUP] Supabase signup error:", errorMessage);
		return NextResponse.json({ error: "Signup failed" }, { status: 500 });
	}

	const encryptedVerifier = encryptVerifier(verifier, encryptionKey);
	const isProduction = process.env.NODE_ENV === "production";

	const response = NextResponse.json(
		{ success: true, message: "Check your email to confirm your account" },
		{ status: 200 },
	);

	response.cookies.set(PKCE_COOKIE_NAME, encryptedVerifier, {
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
		maxAge: PKCE_COOKIE_MAX_AGE,
		path: "/",
	});

	return response;
}

// ── Standard Mode: Supabase SSR client (auto PKCE via @supabase/ssr) ────────
// The SSR client stores the PKCE verifier in its own cookie-managed storage.
// When the user clicks the email confirmation link, /auth/callback creates
// the same SSR client which reads the verifier back and exchanges the code.
async function signupStandard(body: SignupBody, appUrl: string) {
	const redirectTo = `${appUrl}/auth/callback`;
	const supabase = await createClient();

	const { data: signupData, error: signupError } =
		await supabase.auth.signUp({
			email: body.email,
			password: body.password,
			options: {
				emailRedirectTo: redirectTo,
				data: {
					username: body.username,
					account_type: body.accountType,
					...(body.parentEmail
						? { parent_email: body.parentEmail }
						: {}),
				},
			},
		});

	if (signupError) {
		if (
			signupError.message.toLowerCase().includes("user already registered") ||
			signupError.message.toLowerCase().includes("already registered")
		) {
			return NextResponse.json(
				{
					success: true,
					message: "Check your email to confirm your account",
				},
				{ status: 200 },
			);
		}

		console.error("[SIGNUP] Supabase signup error:", signupError.message);
		return NextResponse.json({ error: "Signup failed" }, { status: 500 });
	}

	// Supabase returns user with identities: [] when email is already registered
	// but unconfirmed. Treat as success to prevent email enumeration.
	if (signupData?.user?.identities?.length === 0) {
		return NextResponse.json(
			{
				success: true,
				message: "Check your email to confirm your account",
			},
			{ status: 200 },
		);
	}

	return NextResponse.json(
		{ success: true, message: "Check your email to confirm your account" },
		{ status: 200 },
	);
}
