"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";

export function NotificationsTab() {
	// Placeholder local state — no notification store exists yet
	const [desktopNotifications, setDesktopNotifications] = useState(true);
	const [soundEnabled, setSoundEnabled] = useState(true);
	const [dmNotifications, setDmNotifications] = useState(true);
	const [mentionNotifications, setMentionNotifications] = useState(true);
	const [serverActivity, setServerActivity] = useState(false);

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Notifications</h1>
				<p className="text-slate-400 text-sm mt-1">Choose what notifications you receive</p>
			</div>

			<SettingsSection title="Desktop Notifications">
				<SettingsRow label="Enable Desktop Notifications" description="Show browser notifications for new activity">
					<Toggle
						checked={desktopNotifications}
						onChange={(e) => setDesktopNotifications(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Notification Sound" description="Play a sound with notifications">
					<Toggle
						checked={soundEnabled}
						onChange={(e) => setSoundEnabled(e.target.checked)}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Notification Sources">
				<SettingsRow label="Direct Messages" description="Notify when you receive a direct message">
					<Toggle
						checked={dmNotifications}
						onChange={(e) => setDmNotifications(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Mentions" description="Notify when someone @mentions you">
					<Toggle
						checked={mentionNotifications}
						onChange={(e) => setMentionNotifications(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Server Activity" description="Notify on new messages in your servers">
					<Toggle
						checked={serverActivity}
						onChange={(e) => setServerActivity(e.target.checked)}
					/>
				</SettingsRow>
			</SettingsSection>

			<div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
				<p className="text-xs text-blue-300 font-medium">Notification preferences are stored locally.</p>
				<p className="text-xs text-blue-400/80 mt-1">
					Push notification support and cross-device sync are coming in a future update.
				</p>
			</div>
		</div>
	);
}
