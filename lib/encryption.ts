/**
 * End-to-End Encryption Utilities
 *
 * Uses Web Crypto API (SubtleCrypto) exclusively - no external libraries.
 *
 * Key Exchange: ECDH with P-256
 * Encryption: AES-256-GCM (authenticated encryption)
 * Key Derivation: HKDF (channel keys), PBKDF2 (password-based)
 */

// ── Types ────────────────────────────────────────────

export interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}

export interface ExportedPublicKey {
	kty: string;
	crv: string;
	x: string;
	y: string;
}

export interface EncryptedMessage {
	ciphertext: string; // Base64
	iv: string; // Base64 (12-byte GCM nonce)
}

// ── Encoding Utilities ───────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

// ── Key Generation & Exchange ────────────────────────

/**
 * Generate an ECDH P-256 key pair for key exchange.
 */
export async function generateKeyPair(): Promise<KeyPair> {
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDH", namedCurve: "P-256" },
		true,
		["deriveKey", "deriveBits"],
	);
	return {
		publicKey: keyPair.publicKey,
		privateKey: keyPair.privateKey,
	};
}

/**
 * Export a public key as JWK for transmission to another user.
 */
export async function exportPublicKey(
	publicKey: CryptoKey,
): Promise<ExportedPublicKey> {
	const jwk = await crypto.subtle.exportKey("jwk", publicKey);
	return {
		kty: jwk.kty!,
		crv: jwk.crv!,
		x: jwk.x!,
		y: jwk.y!,
	};
}

/**
 * Import a public key received from another user.
 */
export async function importPublicKey(
	exported: ExportedPublicKey,
): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"jwk",
		{ ...exported, key_ops: [] },
		{ name: "ECDH", namedCurve: "P-256" },
		true,
		[],
	);
}

/**
 * Derive a shared AES-256-GCM key from your private key and a peer's public key.
 * Both sides derive the same key from the ECDH exchange.
 */
export async function deriveSharedSecret(
	privateKey: CryptoKey,
	peerPublicKey: CryptoKey,
): Promise<CryptoKey> {
	return crypto.subtle.deriveKey(
		{ name: "ECDH", public: peerPublicKey },
		privateKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"],
	);
}

// ── Message Encryption ───────────────────────────────

/**
 * Encrypt a message with AES-256-GCM.
 * Generates a fresh random 12-byte IV for each message.
 */
export async function encryptMessage(
	plaintext: string,
	key: CryptoKey,
): Promise<EncryptedMessage> {
	const encoder = new TextEncoder();
	const iv = crypto.getRandomValues(new Uint8Array(12));

	const ciphertext = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		encoder.encode(plaintext),
	);

	return {
		ciphertext: arrayBufferToBase64(ciphertext),
		iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
	};
}

/**
 * Decrypt a message with AES-256-GCM.
 */
export async function decryptMessage(
	encrypted: EncryptedMessage,
	key: CryptoKey,
): Promise<string> {
	const plaintext = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv: base64ToArrayBuffer(encrypted.iv) },
		key,
		base64ToArrayBuffer(encrypted.ciphertext),
	);

	return new TextDecoder().decode(plaintext);
}

// ── Key Derivation ───────────────────────────────────

/**
 * Derive an AES-256-GCM key from a password using PBKDF2.
 * Used to encrypt private keys stored locally.
 */
export async function deriveKeyFromPassword(
	password: string,
	salt: Uint8Array,
): Promise<CryptoKey> {
	const passwordKey = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return crypto.subtle.deriveKey(
		{
			name: "PBKDF2",
			salt: salt.buffer as ArrayBuffer,
			iterations: 100_000,
			hash: "SHA-256",
		},
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"],
	);
}

/**
 * Generate a random 16-byte salt for PBKDF2.
 */
export function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Derive a per-channel encryption key using HKDF.
 * Uses the shared secret + channel ID to produce a unique key per channel.
 */
export async function deriveChannelKey(
	sharedSecret: CryptoKey,
	channelId: string,
): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const secretBits = await crypto.subtle.exportKey("raw", sharedSecret);

	const baseKey = await crypto.subtle.importKey(
		"raw",
		secretBits,
		"HKDF",
		false,
		["deriveKey"],
	);

	const saltBytes = encoder.encode(channelId);
	const infoBytes = encoder.encode("bedrock-channel-key");

	return crypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: saltBytes.buffer as ArrayBuffer,
			info: infoBytes.buffer as ArrayBuffer,
		},
		baseKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"],
	);
}
