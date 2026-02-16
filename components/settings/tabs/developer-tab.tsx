"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button/button";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import { toast } from "@/lib/stores/toast-store";

export function DeveloperTab() {
	const [mounted, setMounted] = useState(false);
	const [storageKeys, setStorageKeys] = useState<string[]>([]);

	useEffect(() => {
		setMounted(true);
		updateStorageInfo();
	}, []);

	function updateStorageInfo() {
		try {
			const keys = Object.keys(localStorage).filter((k) => k.startsWith("bedrock-"));
			setStorageKeys(keys);
		} catch {
			// localStorage not available
		}
	}

	const handleClearCache = () => {
		try {
			const bedrockKeys = Object.keys(localStorage).filter((k) => k.startsWith("bedrock-"));
			bedrockKeys.forEach((key) => localStorage.removeItem(key));
			updateStorageInfo();
			toast.success("Cache cleared", `Removed ${bedrockKeys.length} cached entries.`);
		} catch {
			toast.error("Failed", "Could not clear local storage.");
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
				<SettingsRow label="User Agent">
					<span className="text-xs text-slate-400 max-w-[300px] truncate block">
						{typeof navigator !== "undefined" ? navigator.userAgent.split(" ").slice(-2).join(" ") : "N/A"}
					</span>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Local Storage">
				<SettingsRow label="Bedrock Keys" description="Number of Bedrock-related localStorage entries">
					<span className="text-sm text-slate-300">{storageKeys.length}</span>
				</SettingsRow>
				{storageKeys.length > 0 && (
					<div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-1">
						{storageKeys.map((key) => (
							<p key={key} className="text-xs font-mono text-slate-400">{key}</p>
						))}
					</div>
				)}
			</SettingsSection>

			<SettingsSection title="Cache Management">
				<div className="flex gap-3">
					<Button variant="danger" size="sm" onClick={handleClearCache}>
						Clear Local Storage
					</Button>
				</div>
				<p className="text-xs text-slate-500 mt-2">
					This clears all Bedrock Chat data from your browser. You will need to log in again.
				</p>
			</SettingsSection>
		</div>
	);
}
