/**
 * IndexedDB cache for server themes.
 * Limits active themes in memory (3 max).
 * Auto-cleans entries older than 30 days.
 */

import type { ServerTheme } from "./types";

const DB_NAME = "bedrock-themes";
const DB_VERSION = 1;
const STORE_NAME = "themes";
const MAX_CACHED = 50;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Database ───────────────────────────────────────────────

interface CachedTheme {
	serverId: string;
	theme: ServerTheme;
	cachedAt: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		if (typeof indexedDB === "undefined") {
			reject(new Error("IndexedDB not available"));
			return;
		}

		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				const store = db.createObjectStore(STORE_NAME, {
					keyPath: "serverId",
				});
				store.createIndex("cachedAt", "cachedAt");
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

// ── Public API ─────────────────────────────────────────────

/**
 * Cache a theme for a server.
 */
export async function cacheTheme(
	serverId: string,
	theme: ServerTheme,
): Promise<void> {
	try {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);

		const entry: CachedTheme = {
			serverId,
			theme,
			cachedAt: Date.now(),
		};

		store.put(entry);
		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});

		db.close();
	} catch {
		// Silently fail - themes can be re-fetched
	}
}

/**
 * Get a cached theme for a server.
 */
export async function getCachedTheme(
	serverId: string,
): Promise<ServerTheme | null> {
	try {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readonly");
		const store = tx.objectStore(STORE_NAME);
		const request = store.get(serverId);

		const result = await new Promise<CachedTheme | undefined>(
			(resolve, reject) => {
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			},
		);

		db.close();

		if (!result) return null;

		// Check if expired
		if (Date.now() - result.cachedAt > MAX_AGE_MS) {
			await removeCachedTheme(serverId);
			return null;
		}

		return result.theme;
	} catch {
		return null;
	}
}

/**
 * Remove a cached theme.
 */
export async function removeCachedTheme(serverId: string): Promise<void> {
	try {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		tx.objectStore(STORE_NAME).delete(serverId);
		await new Promise<void>((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
		db.close();
	} catch {
		// Silently fail
	}
}

/**
 * Clean up old cached themes.
 * Removes entries older than 30 days and trims to max 50 entries.
 */
export async function cleanupThemeCache(): Promise<number> {
	try {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, "readwrite");
		const store = tx.objectStore(STORE_NAME);
		const index = store.index("cachedAt");
		const cutoff = Date.now() - MAX_AGE_MS;

		let removedCount = 0;

		// Remove old entries
		const cursorRequest = index.openCursor();
		await new Promise<void>((resolve, reject) => {
			cursorRequest.onsuccess = () => {
				const cursor = cursorRequest.result;
				if (!cursor) {
					resolve();
					return;
				}
				const entry = cursor.value as CachedTheme;
				if (entry.cachedAt < cutoff) {
					cursor.delete();
					removedCount++;
				}
				cursor.continue();
			};
			cursorRequest.onerror = () => reject(cursorRequest.error);
		});

		// Trim to max entries
		const countRequest = store.count();
		const totalCount = await new Promise<number>((resolve, reject) => {
			countRequest.onsuccess = () => resolve(countRequest.result);
			countRequest.onerror = () => reject(countRequest.error);
		});

		if (totalCount > MAX_CACHED) {
			const trimCount = totalCount - MAX_CACHED;
			const trimCursor = index.openCursor();
			let trimmed = 0;

			await new Promise<void>((resolve, reject) => {
				trimCursor.onsuccess = () => {
					const cursor = trimCursor.result;
					if (!cursor || trimmed >= trimCount) {
						resolve();
						return;
					}
					cursor.delete();
					trimmed++;
					removedCount++;
					cursor.continue();
				};
				trimCursor.onerror = () => reject(trimCursor.error);
			});
		}

		db.close();
		return removedCount;
	} catch {
		return 0;
	}
}

// ── In-Memory LRU (3 active themes) ───────────────────────

const activeThemes = new Map<string, ServerTheme>();
const MAX_ACTIVE = 3;

/**
 * Get a theme from the in-memory LRU cache.
 * Most recently accessed themes stay in memory.
 */
export function getActiveTheme(serverId: string): ServerTheme | undefined {
	const theme = activeThemes.get(serverId);
	if (theme) {
		// Move to end (most recently used)
		activeThemes.delete(serverId);
		activeThemes.set(serverId, theme);
	}
	return theme;
}

/**
 * Set a theme in the active LRU cache.
 * Evicts the least recently used if over limit.
 */
export function setActiveTheme(serverId: string, theme: ServerTheme): void {
	// Remove if exists (will re-add at end)
	activeThemes.delete(serverId);

	// Evict oldest if at capacity
	if (activeThemes.size >= MAX_ACTIVE) {
		const oldest = activeThemes.keys().next().value;
		if (oldest) activeThemes.delete(oldest);
	}

	activeThemes.set(serverId, theme);
}

/**
 * Clear all active themes from memory.
 */
export function clearActiveThemes(): void {
	activeThemes.clear();
}
