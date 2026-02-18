"use client";

import { useSettingsStore } from "@/store/settings.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import { toast } from "@/lib/stores/toast-store";

export function NotificationsTab() {
	const settings = useSettingsStore((s) => s.settings);
	const updateSettings = useSettingsStore((s) => s.updateSettings);

	const handleDesktopNotificationsToggle = async (enabled: boolean) => {
		if (enabled) {
			// Request browser permission before enabling
			if (typeof Notification !== "undefined" && Notification.permission === "default") {
				const permission = await Notification.requestPermission();
				if (permission !== "granted") {
					toast.error("Permission Denied", "Enable notifications in your browser settings");
					return;
				}
			} else if (typeof Notification !== "undefined" && Notification.permission === "denied") {
				toast.error("Permission Blocked", "Enable notifications in your browser settings (click the lock icon in the address bar)");
				return;
			}
		}
		updateSettings({ desktop_notifications: enabled });
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Notifications</h1>
				<p className="text-slate-400 text-sm mt-1">Choose what notifications you receive</p>
			</div>

			<SettingsSection title="Desktop Notifications">
				<SettingsRow label="Enable Desktop Notifications" description="Show browser notifications for new activity">
					<Toggle
						checked={settings?.desktop_notifications ?? true}
						onChange={(e) => handleDesktopNotificationsToggle(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Notification Sound" description="Play a sound with notifications">
					<Toggle
						checked={settings?.sound_enabled ?? true}
						onChange={(e) => updateSettings({ sound_enabled: e.target.checked })}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Notification Sources">
				<SettingsRow label="Direct Messages" description="Notify when you receive a direct message">
					<Toggle
						checked={settings?.dm_notifications ?? true}
						onChange={(e) => updateSettings({ dm_notifications: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Mentions" description="Notify when someone @mentions you">
					<Toggle
						checked={settings?.mention_notifications ?? true}
						onChange={(e) => updateSettings({ mention_notifications: e.target.checked })}
					/>
				</SettingsRow>
			</SettingsSection>
		</div>
	);
}
