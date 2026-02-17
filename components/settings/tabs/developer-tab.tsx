"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button/button";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import { toast } from "@/lib/stores/toast-store";

export function DeveloperTab() {
	const [mounted, setMounted] = useState(false);
	const [storageKeyCount, setStorageKeyCount] = useState(0);
	const [confirmReset, setConfirmReset] = useState(false);

	useEffect(() => {
		setMounted(true);
		updateStorageCount();
	}, []);

	function updateStorageCount() {
		try {
			const count = Object.keys(localStorage).filter((k) => k.startsWith("bedrock-")).length;
			setStorageKeyCount(count);
		} catch {
			// localStorage not available
		}
	}

	const handleResetAppData = () => {
		if (!confirmReset) {
			setConfirmReset(true);
			return;
		}

		try {
			const bedrockKeys = Object.keys(localStorage).filter((k) => k.startsWith("bedrock-"));
			bedrockKeys.forEach((key) => localStorage.removeItem(key));
			updateStorageCount();
			setConfirmReset(false);
			toast.success("App data reset", `Removed ${bedrockKeys.length} stored entries.`);
		} catch {
			toast.error("Failed", "Could not reset app data.");
		}
	};

	if (!mounted) return null;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Developer</h1>
				<p className="text-slate-400 text-sm mt-1">Advanced debugging and developer tools</p>
			</div>

			<SettingsSection title="Environment">
				<SettingsRow label="Environment" description="Current runtime environment">
					<span className="text-xs font-mono text-slate-300 px-2 py-1 rounded bg-white/5 border border-white/10">
						{process.env.NODE_ENV}
					</span>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="App Data">
				<SettingsRow label="Stored Keys" description="Number of Bedrock-related entries in local storage">
					<span className="text-sm text-slate-300">{storageKeyCount}</span>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Data Management">
				<div className="flex gap-3">
					<Button
						variant="danger"
						size="sm"
						onClick={handleResetAppData}
					>
						{confirmReset ? "Confirm Reset" : "Reset App Data"}
					</Button>
					{confirmReset && (
						<Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
							Cancel
						</Button>
					)}
				</div>
				<p className="text-xs text-slate-500 mt-2">
					{confirmReset
						? "Are you sure? This will remove all local data and require you to log in again."
						: "Clears all Bedrock Chat data from your browser. You will need to log in again."}
				</p>
			</SettingsSection>
		</div>
	);
}
