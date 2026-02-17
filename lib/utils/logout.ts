import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { useVoiceStore } from "@/store/voice.store";
import { useFamilyStore } from "@/store/family.store";
import { clearSensitiveData } from "@/lib/privacy";

/**
 * Performs a full application logout:
 * 1. Tears down real-time connections (presence, voice)
 * 2. Clears crypto material (encryption keys, salts)
 * 3. Clears user-specific store data (favorites, family)
 * 4. Calls auth store logout (Supabase signOut + token cleanup)
 *
 * Call this instead of auth.logout() directly to ensure
 * complete cleanup in production.
 */
export async function performFullLogout(): Promise<void> {
	// 1. Tear down real-time connections first (before auth is cleared)
	try {
		usePresenceStore.getState().destroy();
	} catch {
		// Presence may not be initialized
	}

	try {
		useVoiceStore.getState().reset();
	} catch {
		// Voice may not be initialized
	}

	// 2. Clear crypto material
	try {
		clearSensitiveData();
	} catch {
		// Privacy module may not be initialized
	}

	// 3. Clear user-specific stores
	useFavoritesStore.getState().clearFavorites();
	useFamilyStore.getState().reset();

	// 4. Clear init circuit breaker
	try {
		localStorage.removeItem("bedrock-init-attempts");
	} catch {
		// Storage may be unavailable
	}

	// 5. Auth logout (Supabase signOut + force-clear tokens + reset state)
	await useAuthStore.getState().logout();
}
