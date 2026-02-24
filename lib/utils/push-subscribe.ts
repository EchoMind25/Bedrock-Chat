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
	if (!vapidKey) return;

	try {
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
	} catch (err) {
		// Push subscription failures should never break the app
		console.error("[Push] Subscribe failed:", err);
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
	} catch (err) {
		console.error("[Push] Unsubscribe failed:", err);
	}
}

/** Convert a base64url VAPID key to the Uint8Array that PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(base64);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
