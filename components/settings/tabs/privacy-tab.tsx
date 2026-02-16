"use client";

import { useState } from "react";
import { useConsentStore } from "@/store/consent.store";
import { Toggle } from "@/components/ui/toggle/toggle";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import Link from "next/link";

export function PrivacyTab() {
	const preferences = useConsentStore((s) => s.preferences);
	const savePreferences = useConsentStore((s) => s.savePreferences);

	// Placeholder local state for privacy settings not yet backed by a store
	const [showOnlineStatus, setShowOnlineStatus] = useState(true);
	const [allowDMs, setAllowDMs] = useState(true);
	const [typingIndicators, setTypingIndicators] = useState(true);
	const [readReceipts, setReadReceipts] = useState(true);

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Privacy & Safety</h1>
				<p className="text-slate-400 text-sm mt-1">Control who can see your activity and contact you</p>
			</div>

			<SettingsSection title="Privacy" description="These settings will be fully functional in a future update.">
				<SettingsRow label="Show Online Status" description="Let others see when you're online">
					<Toggle
						checked={showOnlineStatus}
						onChange={(e) => setShowOnlineStatus(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Allow Direct Messages" description="Let server members send you DMs">
					<Toggle
						checked={allowDMs}
						onChange={(e) => setAllowDMs(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Typing Indicators" description="Show when you're typing in a conversation">
					<Toggle
						checked={typingIndicators}
						onChange={(e) => setTypingIndicators(e.target.checked)}
					/>
				</SettingsRow>
				<SettingsRow label="Read Receipts" description="Let others know when you've read their messages">
					<Toggle
						checked={readReceipts}
						onChange={(e) => setReadReceipts(e.target.checked)}
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
