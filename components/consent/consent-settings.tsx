"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { useConsentStore } from "@/store/consent.store";

interface ConsentSettingsProps {
	isOpen: boolean;
	onClose: () => void;
}

const CATEGORIES = [
	{
		id: "necessary" as const,
		label: "Necessary",
		description:
			"Required for core functionality like authentication and navigation. Cannot be disabled.",
		locked: true,
	},
	{
		id: "analytics" as const,
		label: "Analytics",
		description:
			"Helps us understand how you use the platform to improve performance and features.",
		locked: false,
	},
	{
		id: "marketing" as const,
		label: "Marketing",
		description:
			"Allows us to show you relevant content, updates, and product announcements.",
		locked: false,
	},
	{
		id: "functional" as const,
		label: "Functional",
		description:
			"Enables enhanced features like voice device preferences, theme persistence, and personalization.",
		locked: false,
	},
] as const;

export function ConsentSettings({ isOpen, onClose }: ConsentSettingsProps) {
	const preferences = useConsentStore((s) => s.preferences);
	const savePreferences = useConsentStore((s) => s.savePreferences);

	// Local draft state for the modal
	const [draft, setDraft] = useState({
		analytics: preferences.analytics,
		marketing: preferences.marketing,
		functional: preferences.functional,
	});

	// Sync draft when modal opens
	useEffect(() => {
		if (isOpen) {
			setDraft({
				analytics: preferences.analytics,
				marketing: preferences.marketing,
				functional: preferences.functional,
			});
		}
	}, [isOpen, preferences.analytics, preferences.marketing, preferences.functional]);

	const handleSave = () => {
		savePreferences(draft);
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Privacy Preferences"
			description="Control how we collect and use your data. Changes apply immediately."
			size="lg"
			footer={
				<>
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleSave}>
						Save Preferences
					</Button>
				</>
			}
		>
			<div className="space-y-6 py-2">
				{CATEGORIES.map((cat) => (
					<div
						key={cat.id}
						className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30"
					>
						<div className="pt-0.5">
							<Toggle
								checked={cat.id === "necessary" ? true : draft[cat.id]}
								disabled={cat.locked}
								size="sm"
								onChange={(e) => {
									if (cat.id !== "necessary") {
										setDraft((prev) => ({
											...prev,
											[cat.id]: e.target.checked,
										}));
									}
								}}
								aria-label={`Toggle ${cat.label}`}
							/>
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-slate-200">
								{cat.label}
								{cat.locked && (
									<span className="ml-2 text-xs text-slate-400">
										(Required)
									</span>
								)}
							</p>
							<p className="text-xs text-slate-400 mt-1">
								{cat.description}
							</p>
						</div>
					</div>
				))}

				<div className="text-xs text-slate-500 pt-2">
					<p>
						Read our{" "}
						<a
							href="/privacy-policy"
							className="text-primary hover:underline"
						>
							Privacy Policy
						</a>{" "}
						to learn more about how we handle your data.
					</p>
				</div>
			</div>
		</Modal>
	);
}
