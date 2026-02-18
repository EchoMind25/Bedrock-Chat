const NSFW_ACCEPTED_KEY = "bedrock-nsfw-accepted";

/**
 * Check if the user has accepted the NSFW content warning this session.
 * Returns false on the server (SSR) or if sessionStorage is unavailable.
 */
export function hasAcceptedNsfw(): boolean {
	if (typeof window === "undefined") return false;
	try {
		return sessionStorage.getItem(NSFW_ACCEPTED_KEY) === "true";
	} catch {
		return false;
	}
}

/**
 * Mark the current session as having accepted NSFW content.
 * One acceptance covers all NSFW channels for the session.
 */
export function acceptNsfw(): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.setItem(NSFW_ACCEPTED_KEY, "true");
	} catch {
		// sessionStorage unavailable (e.g., Tor private browsing)
	}
}

/**
 * Clear NSFW acceptance (e.g., on logout).
 */
export function clearNsfwAcceptance(): void {
	if (typeof window === "undefined") return;
	try {
		sessionStorage.removeItem(NSFW_ACCEPTED_KEY);
	} catch {
		// Ignore
	}
}
