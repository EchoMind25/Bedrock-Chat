/**
 * Subscribe the current browser to Web Push notifications.
 * Requires:
 *  - Service worker registered and active
 *  - Notification permission granted
 *  - NEXT_PUBLIC_VAPID_PUBLIC_KEY env var set
 *
 * Safe to call multiple times — if already subscribed it re-sends
 * the existing subscription to the server (idempotent upsert).
 */
export async function subscribeToPush(): Promise<void> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

	const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	if (!vapidKey) {
		// VAPID key not configured — skip silently in production
		if (process.env.NODE_ENV === "development") {
			console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set, skipping push subscription");
		}
		return;
	}

	// Ensure notification permission is granted before attempting subscription
	if (typeof Notification !== "undefined" && Notification.permission !== "granted") return;

	try {
		// Wait for service worker to be fully active before subscribing.
		// This prevents the AbortError from subscribing while SW is installing.
		const registration = await navigator.serviceWorker.ready;

		let subscription = await registration.pushManager.getSubscription();

		if (!subscription) {
			const key = urlBase64ToUint8Array(vapidKey);
			subscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: key.buffer as ArrayBuffer,
			});
		}

		// Send subscription to server (upserts on endpoint)
		await fetch("/api/push/subscribe", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subscription: subscription.toJSON(),
				userAgent: navigator.userAgent,
			}),
		});
	} catch {
		// Push subscription failures should never break the app.
		// Common causes: SW not ready, browser doesn't support, VAPID mismatch.
		// Fail silently — push is a progressive enhancement.
	}
}

/**
 * Unsubscribe the current browser from Web Push notifications.
 */
export async function unsubscribeFromPush(): Promise<void> {
	if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			const endpoint = subscription.endpoint;
			await subscription.unsubscribe();

			await fetch("/api/push/subscribe", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ endpoint }),
			});
		}
	} catch {
		// Unsubscribe failures are non-critical
	}
}

/** Convert a base64url VAPID key to the Uint8Array that PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
