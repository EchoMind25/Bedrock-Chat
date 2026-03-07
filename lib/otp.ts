import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";

/**
 * Generates a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 * Range: 100000–999999 — always 6 digits.
 */
export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

/**
 * Generates a cryptographically secure salt for OTP hashing.
 */
export function generateOTPSalt(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes an OTP with a salt using SHA-256.
 * Salt-prefix prevents length extension attacks.
 */
export function hashOTP(otp: string, salt: string): string {
  return createHash("sha256")
    .update(salt + otp)
    .digest("hex");
}

/**
 * Constant-time comparison to prevent timing attacks on hash verification.
 */
export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Masks an email for display: "parent@example.com" → "p***@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length > 1 ? local[0] + "***" : "***";
  return `${masked}@${domain}`;
}
