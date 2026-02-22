"use client";

import { useConsentStore } from "@/store/consent.store";
import { useSettingsStore } from "@/store/settings.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import Link from "next/link";

export function PrivacyTab() {
	const preferences = useConsentStore((s) => s.preferences);
	const savePreferences = useConsentStore((s) => s.savePreferences);

	const settings = useSettingsStore((s) => s.settings);
	const updateSettings = useSettingsStore((s) => s.updateSettings);

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Privacy & Safety</h1>
				<p className="text-slate-400 text-sm mt-1">Control who can see your activity and contact you</p>
			</div>

			<SettingsSection title="Privacy">
				<SettingsRow label="Show Online Status" description="Let others see when you're online">
					<Toggle
						checked={settings?.show_online_status ?? true}
						onChange={(e) => updateSettings({ show_online_status: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Allow Direct Messages" description="Control who can send you DMs">
					<div className="flex gap-1.5">
						{(["everyone", "friends", "none"] as const).map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => updateSettings({ allow_dms: option })}
								className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
									(settings?.allow_dms ?? "everyone") === option
										? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
										: "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
								}`}
							>
								{option}
							</button>
						))}
					</div>
				</SettingsRow>
				<SettingsRow label="Typing Indicators" description="Show when you're typing in a conversation">
					<Toggle
						checked={settings?.typing_indicators ?? true}
						onChange={(e) => updateSettings({ typing_indicators: e.target.checked })}
					/>
				</SettingsRow>
				<SettingsRow label="Read Receipts" description="Let others know when you've read their messages">
					<Toggle
						checked={settings?.read_receipts ?? true}
						onChange={(e) => updateSettings({ read_receipts: e.target.checked })}
					/>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Data & Consent">
				<SettingsRow label="Necessary" description="Authentication, security, and core functionality" disabled>
					<Toggle checked disabled size="sm" aria-label="Necessary cookies" />
				</SettingsRow>
				<SettingsRow label="Analytics" description="Helps us understand usage to improve performance">
					<Toggle
						checked={preferences.analytics}
						onChange={(e) => savePreferences({ analytics: e.target.checked })}
						size="sm"
						aria-label="Toggle Analytics"
					/>
				</SettingsRow>
				<SettingsRow label="Marketing" description="Product announcements and relevant updates">
					<Toggle
						checked={preferences.marketing}
						onChange={(e) => savePreferences({ marketing: e.target.checked })}
						size="sm"
						aria-label="Toggle Marketing"
					/>
				</SettingsRow>
				<SettingsRow label="Functional" description="Theme persistence, voice settings, personalization">
					<Toggle
						checked={preferences.functional}
						onChange={(e) => savePreferences({ functional: e.target.checked })}
						size="sm"
						aria-label="Toggle Functional"
					/>
				</SettingsRow>

				<div className="pt-3">
					<Link
						href="/privacy-policy"
						className="text-sm text-primary hover:underline"
					>
						Read our Privacy Policy
					</Link>
				</div>
			</SettingsSection>
		</div>
	);
}
