/**
 * Privacy Utilities
 *
 * Encrypted localStorage, IndexedDB key storage, and cleanup.
 * All cryptographic operations use Web Crypto API via lib/encryption.ts.
 */

import {
	encryptMessage,
	decryptMessage,
	deriveKeyFromPassword,
	generateSalt,
	type EncryptedMessage,
} from "./encryption";

// ── Encrypted Local Storage ──────────────────────────

const STORAGE_SALT_KEY = "bedrock-storage-salt";
const keyCache = new Map<string, CryptoKey>();

async function getStorageKey(password: string): Promise<CryptoKey> {
	const cached = keyCache.get(password);
	if (cached) return cached;

	let saltB64 = localStorage.getItem(STORAGE_SALT_KEY);
	let salt: Uint8Array;

	if (saltB64) {
		const binary = atob(saltB64);
		salt = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			salt[i] = binary.charCodeAt(i);
		}
	} else {
		salt = generateSalt();
		saltB64 = btoa(String.fromCharCode(...salt));
		localStorage.setItem(STORAGE_SALT_KEY, saltB64);
	}

	const key = await deriveKeyFromPassword(password, salt);
	keyCache.set(password, key);
	return key;
}

/**
 * Encrypt data and store in localStorage.
 */
export async function encryptLocalStorage(
	storageKey: string,
	data: unknown,
	password: string,
): Promise<void> {
	const key = await getStorageKey(password);
	const encrypted = await encryptMessage(JSON.stringify(data), key);
	localStorage.setItem(storageKey, JSON.stringify(encrypted));
}

/**
 * Read and decrypt data from localStorage.
 */
export async function decryptLocalStorage<T>(
	storageKey: string,
	password: string,
): Promise<T | null> {
	const raw = localStorage.getItem(storageKey);
	if (!raw) return null;

	try {
		const encrypted: EncryptedMessage = JSON.parse(raw);
		const key = await getStorageKey(password);
		const plaintext = await decryptMessage(encrypted, key);
		return JSON.parse(plaintext) as T;
	} catch {
		return null;
	}
}

// ── IndexedDB Key Storage ────────────────────────────

const DB_NAME = "bedrock-keys";
const STORE_NAME = "crypto-keys";
const DB_VERSION = 1;

function openKeyDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

/**
 * Store an encrypted private key in IndexedDB.
 */
export async function storePrivateKey(
	userId: string,
	privateKey: CryptoKey,
	password: string,
): Promise<void> {
	const storageKey = await getStorageKey(password);
	const exported = await crypto.subtle.exportKey("jwk", privateKey);
	const encrypted = await encryptMessage(JSON.stringify(exported), storageKey);

	const db = await openKeyDB();
	const tx = db.transaction(STORE_NAME, "readwrite");
	const store = tx.objectStore(STORE_NAME);

	await new Promise<void>((resolve, reject) => {
		const req = store.put(encrypted, userId);
		req.onsuccess = () => resolve();
		req.onerror = () => reject(req.error);
	});

	db.close();
}

/**
 * Retrieve and decrypt a private key from IndexedDB.
 */
export async function retrievePrivateKey(
	userId: string,
	password: string,
): Promise<CryptoKey | null> {
	let db: IDBDatabase;
	try {
		db = await openKeyDB();
	} catch {
		return null;
	}

	const tx = db.transaction(STORE_NAME, "readonly");
	const store = tx.objectStore(STORE_NAME);

	const encrypted = await new Promise<EncryptedMessage | undefined>(
		(resolve, reject) => {
			const req = store.get(userId);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		},
	);

	db.close();

	if (!encrypted) return null;

	try {
		const storageKey = await getStorageKey(password);
		const plaintext = await decryptMessage(encrypted, storageKey);
		const jwk = JSON.parse(plaintext);

		return crypto.subtle.importKey(
			"jwk",
			jwk,
			{ name: "ECDH", namedCurve: "P-256" },
			true,
			["deriveKey", "deriveBits"],
		);
	} catch {
		return null;
	}
}

// ── Cleanup ──────────────────────────────────────────

/**
 * Clear all cryptographic material from memory and storage.
 * Call on logout.
 */
export function clearSensitiveData(): void {
	keyCache.clear();
	localStorage.removeItem(STORAGE_SALT_KEY);
	indexedDB.deleteDatabase(DB_NAME);
}
