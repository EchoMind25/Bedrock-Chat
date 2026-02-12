/**
 * Proxy configuration for Next.js 16
 * Replaces middleware.ts which is deprecated in Next.js 16
 *
 * Handles:
 * - Security headers
 * - GPC (Global Privacy Control) signal detection
 * - CORS configuration
 * - Privacy-first request handling
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
  "Permissions-Policy":
    "microphone=(self), camera=(), geolocation=(), payment=()",

  // Content Security Policy - allow Supabase + Daily.co
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.daily.co wss://*.daily.co https://api.daily.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),

  // HSTS - Force HTTPS (enable in production)
  // "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
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
 */
export default function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Detect privacy signals
  const hasGPC = detectGPC(request);
  const hasDNT = detectDNT(request);

  // Add privacy signal detection to response headers (for debugging)
  if (process.env.NODE_ENV === "development") {
    response.headers.set("X-Privacy-GPC", hasGPC ? "1" : "0");
    response.headers.set("X-Privacy-DNT", hasDNT ? "1" : "0");
  }

  // Store privacy preferences in cookies if detected
  if (hasGPC || hasDNT) {
    response.cookies.set("privacy-mode", "strict", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
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
