/**
 * Analytics path sanitization utilities.
 * All functions are pure and have zero side effects.
 * NEVER use navigator.userAgent — device category is derived from viewport only.
 */

/**
 * Strip dynamic segments from a URL path to prevent PII leakage.
 * Removes: query params, hash, UUIDs, numeric IDs (≥2 digits), long alphanumeric strings (≥20 chars).
 */
export function sanitizePath(path: string): string {
	return path
		.split("?")[0] // strip query params
		.split("#")[0] // strip hash
		.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/*") // UUIDs
		.replace(/\/\d{2,}/g, "/*") // numeric IDs (2+ digits)
		.replace(/\/[A-Za-z0-9]{20,}/g, "/*"); // long alphanumeric strings (likely IDs)
}

/**
 * Derive device category from current viewport width.
 * Never reads navigator.userAgent.
 */
export function getDeviceCategory(): "desktop" | "tablet" | "mobile" {
	if (typeof window === "undefined") return "desktop";
	const width = window.innerWidth;
	if (width < 768) return "mobile";
	if (width < 1024) return "tablet";
	return "desktop";
}

/**
 * Derive Tailwind viewport bucket from current viewport width.
 */
export function getViewportBucket(): "sm" | "md" | "lg" | "xl" {
	if (typeof window === "undefined") return "xl";
	const width = window.innerWidth;
	if (width < 640) return "sm";
	if (width < 768) return "md";
	if (width < 1024) return "lg";
	return "xl";
}

/**
 * Detect browser family from user-agent string.
 * Used ONLY for bug reports (not for analytics events).
 * Returns a coarse family name with no version information.
 */
export function getBrowserFamily(): "chrome" | "firefox" | "safari" | "edge" | "other" {
	if (typeof navigator === "undefined") return "other";
	const ua = navigator.userAgent;
	if (ua.includes("Edg/")) return "edge";
	if (ua.includes("Chrome/")) return "chrome";
	if (ua.includes("Firefox/")) return "firefox";
	if (ua.includes("Safari/")) return "safari";
	return "other";
}

/**
 * Detect OS family from user-agent string.
 * Used ONLY for bug reports (not for analytics events).
 * Returns a coarse family name with no version information.
 */
export function getOsFamily(): "windows" | "macos" | "linux" | "ios" | "android" | "other" {
	if (typeof navigator === "undefined") return "other";
	const ua = navigator.userAgent;
	if (/iPhone|iPad|iPod/.test(ua)) return "ios";
	if (/Android/.test(ua)) return "android";
	if (/Win/.test(ua)) return "windows";
	if (/Mac/.test(ua)) return "macos";
	if (/Linux/.test(ua)) return "linux";
	return "other";
}

/**
 * Server-side path sanitization (identical logic to client-side — defense in depth).
 * Exported separately so it can be imported in API routes without pulling in browser APIs.
 */
export function sanitizePathServer(path: string): string {
	return sanitizePath(path);
}
