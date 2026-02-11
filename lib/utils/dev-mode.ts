/**
 * Dev mode detection utility
 * Works in both client and server components
 */

export function isDevMode(): boolean {
  // In Next.js, this will be replaced at build time
  return process.env.NODE_ENV === "development";
}

// Also check if we're running on localhost
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" ||
         window.location.hostname === "127.0.0.1" ||
         window.location.hostname.startsWith("192.168.");
}

// Combined check - true if either dev mode or localhost
export function isDevelopment(): boolean {
  return isDevMode() || isLocalhost();
}
