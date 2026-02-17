/**
 * Server-side PKCE utilities for email confirmation.
 *
 * Uses Node.js built-in 'crypto' module. This file is SERVER-ONLY.
 * Never import this in client components or pages — it will crash.
 *
 * Separate from lib/encryption.ts which uses the browser Web Crypto API.
 */

import {
	createHash,
	randomBytes,
	createCipheriv,
	createDecipheriv,
} from "crypto";

// ── PKCE Code Verifier & Challenge ──────────────────────────────────────────

/**
 * Generate a cryptographically random PKCE code_verifier.
 * RFC 7636 §4.1: 43–128 characters, unreserved chars only.
 * 32 random bytes → 43-character base64url string (within spec).
 */
export function generateCodeVerifier(): string {
	return randomBytes(32).toString("base64url");
}

/**
 * Derive the PKCE code_challenge from a code_verifier using S256 method.
 * code_challenge = BASE64URL(SHA-256(ASCII(code_verifier)))
 */
export function generateCodeChallenge(verifier: string): string {
	return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

// ── AES-256-GCM Encryption ──────────────────────────────────────────────────

/**
 * Parse and validate the PKCE_ENCRYPTION_KEY env var.
 * Expects a base64-encoded 32-byte (256-bit) key for AES-256.
 * Called inside functions (not at module load) so build-time env absence doesn't crash.
 */
function parseEncryptionKey(keyBase64: string): Buffer {
	const key = Buffer.from(keyBase64, "base64");
	if (key.length !== 32) {
		throw new Error(
			`PKCE_ENCRYPTION_KEY must decode to exactly 32 bytes. Got ${key.length}.`,
		);
	}
	return key;
}

/**
 * Encrypt the PKCE code_verifier using AES-256-GCM.
 *
 * Wire format: base64url(IV[12] + ciphertext[N] + authTag[16])
 * The GCM auth tag provides integrity — tampering with any byte will
 * cause decryption to throw, preventing forged verifiers.
 *
 * @param verifier - The plaintext code_verifier string
 * @param keyBase64 - Value of PKCE_ENCRYPTION_KEY env var
 * @returns Single base64url-encoded string safe for httpOnly cookie values
 */
export function encryptVerifier(verifier: string, keyBase64: string): string {
	const key = parseEncryptionKey(keyBase64);

	// Fresh 12-byte random IV for every encryption (GCM spec requires unique IV per key)
	const iv = randomBytes(12);

	const cipher = createCipheriv("aes-256-gcm", key, iv);

	const ciphertext = Buffer.concat([
		cipher.update(Buffer.from(verifier, "utf8")),
		cipher.final(),
	]);

	// 16-byte (128-bit) auth tag — provides authenticated encryption
	const authTag = cipher.getAuthTag();

	// Layout: IV(12) + ciphertext(43 for our verifiers) + authTag(16) = 71 bytes total
	return Buffer.concat([iv, ciphertext, authTag]).toString("base64url");
}

/**
 * Decrypt a PKCE code_verifier previously encrypted with encryptVerifier().
 *
 * Throws a generic error on failure (wrong key, tampered data, bad format).
 * Generic errors prevent oracle attacks — callers should not expose the
 * reason for failure to end users or logs.
 */
export function decryptVerifier(encrypted: string, keyBase64: string): string {
	const key = parseEncryptionKey(keyBase64);

	let combined: Buffer;
	try {
		combined = Buffer.from(encrypted, "base64url");
	} catch {
		throw new Error("Decryption failed");
	}

	// Minimum valid length: 12 (IV) + 1 (min ciphertext) + 16 (authTag) = 29
	if (combined.length < 29) {
		throw new Error("Decryption failed");
	}

	const iv = combined.subarray(0, 12);
	const authTag = combined.subarray(combined.length - 16);
	const ciphertext = combined.subarray(12, combined.length - 16);

	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);

	try {
		const plaintext = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(), // Throws if authTag doesn't match (tampered or wrong key)
		]);
		return plaintext.toString("utf8");
	} catch {
		// Do not expose internal error — could leak cipher state information
		throw new Error("Decryption failed");
	}
}

export const PKCE_COOKIE_NAME = "__bedrock_pkce";
export const PKCE_COOKIE_MAX_AGE = 86400; // 24 hours in seconds
