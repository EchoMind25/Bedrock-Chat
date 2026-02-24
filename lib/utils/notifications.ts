import { useSettingsStore } from "@/store/settings.store";

interface NotifyOptions extends NotificationOptions {
	/** Set true for DM notifications — will check dm_notifications setting */
	isDm?: boolean;
}

/**
 * Show a desktop notification, respecting user settings.
 * Prefers service worker showNotification (works on iOS PWA) with
 * fallback to the Notification constructor.
 */
export function showDesktopNotification(
	title: string,
	options: NotifyOptions = {},
): void {
	if (typeof Notification === "undefined") return;
	if (Notification.permission !== "granted") return;

	// Don't notify if the tab is focused — user can already see the message
	if (!document.hidden) return;

	// Respect user settings
	const settings = useSettingsStore.getState().settings;
	if (settings) {
		if (!settings.desktop_notifications) return;
		if (options.isDm && !settings.dm_notifications) return;
		if (!options.isDm && !settings.mention_notifications) return;
	}

	const { isDm: _, ...notifOptions } = options;

	// Prefer service worker showNotification (iOS PWA, background tabs)
	if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
		navigator.serviceWorker.ready
			.then((registration) => {
				registration.showNotification(title, notifOptions);
			})
			.catch(() => {
				try {
					new Notification(title, notifOptions);
				} catch {
					/* ignore */
				}
			});
		return;
	}

	// Fallback to Notification constructor
	try {
		new Notification(title, notifOptions);
	} catch {
		/* ignore */
	}
}
