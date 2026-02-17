/**
 * Proxy configuration for Next.js 16
 * Replaces middleware.ts which is deprecated in Next.js 16
 *
 * Handles:
 * - Supabase auth session refresh on every request
 * - Security headers
 * - GPC (Global Privacy Control) signal detection
 * - CORS configuration
 * - Privacy-first request handling
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";


/**
 * Security headers for privacy-first architecture
 */
const securityHeaders = {
	// Prevent clickjacking
	"X-Frame-Options": "DENY",

	// Prevent MIME type sniffing
	"X-Content-Type-Options": "nosniff",

	// Enable XSS protection
	"X-XSS-Protection": "1; mode=block",

	// Referrer policy for privacy
	"Referrer-Policy": "strict-origin-when-cross-origin",

	// Permissions policy - restrict features (allow microphone for voice)
	// Note: Daily.co SDK will attempt to enumerate camera devices on initialization,
	// which triggers permission policy violations in console. These are harmless warnings
	// indicating the security policy is working - screen sharing uses screenVideo tracks
	// and does not require camera access.
	"Permissions-Policy":
		"microphone=(self), camera=(), geolocation=(), payment=()",

	// Content Security Policy — allow Supabase + Daily.co
	// NOTE: Sentry is intentionally excluded from connect-src.
	// Daily.co's built-in Sentry telemetry (o77906.ingest.sentry.io) is blocked
	// at the CSP level — not just by ad blockers. This is a privacy requirement.
	"Content-Security-Policy": [
		"default-src 'self'",
		// TECH DEBT: Both 'unsafe-inline' and 'unsafe-eval' required for Daily.co.
		// Daily.co's call object bundle loads itself via dynamic code evaluation
		// (eval/new Function), which requires 'unsafe-eval' in all environments.
		// Daily.co does not support nonce/hash-based CSP for its call object scripts.
		// This is a known limitation of Daily.co (temporary vendor). Track for
		// removal when self-hosted WebRTC infrastructure is deployed.
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://c.daily.co https://*.daily.co",
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: https:",
		"font-src 'self' data:",
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.daily.co wss://*.daily.co https://api.daily.co",
		"frame-src 'self' https://*.daily.co",
		"media-src 'self' https://*.daily.co blob: mediastream:",
		"worker-src 'self' blob:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; "),

	// HSTS - Force HTTPS (production only, localhost uses HTTP)
	...(process.env.NODE_ENV === "production"
		? { "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload" }
		: {}),
};

/**
 * Detect GPC (Global Privacy Control) signal
 * Respects user's privacy preferences
 */
function detectGPC(request: NextRequest): boolean {
	const gpcHeader = request.headers.get("Sec-GPC");
	return gpcHeader === "1";
}

/**
 * Detect Do Not Track signal
 */
function detectDNT(request: NextRequest): boolean {
	const dntHeader = request.headers.get("DNT");
	return dntHeader === "1";
}

/**
 * Main proxy handler
 * Refreshes Supabase auth session and applies security headers
 */
export default async function proxy(request: NextRequest) {
	let supabaseResponse = NextResponse.next({
		request,
	});

	// Refresh Supabase auth session on every request
	// This keeps the session alive and updates cookies
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (supabaseUrl && supabaseAnonKey) {
		const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					// Update request cookies for downstream handlers
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}

					// Create a new response with updated cookies
					supabaseResponse = NextResponse.next({
						request,
					});

					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		});

		// Call getUser to refresh the session. This updates the auth
		// cookies if the access token was refreshed.
		await supabase.auth.getUser();
	}

	// Apply security headers
	for (const [key, value] of Object.entries(securityHeaders)) {
		supabaseResponse.headers.set(key, value);
	}

	// Detect privacy signals
	const hasGPC = detectGPC(request);
	const hasDNT = detectDNT(request);

	// Add privacy signal detection to response headers (for debugging)
	if (process.env.NODE_ENV === "development") {
		supabaseResponse.headers.set("X-Privacy-GPC", hasGPC ? "1" : "0");
		supabaseResponse.headers.set("X-Privacy-DNT", hasDNT ? "1" : "0");
	}

	// Store privacy preferences in cookies if detected
	if (hasGPC || hasDNT) {
		supabaseResponse.cookies.set("privacy-mode", "strict", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});
	}

	return supabaseResponse;
}

/**
 * Configure which routes the proxy should run on
 */
export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico (favicon)
		 * - public files (public directory)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
