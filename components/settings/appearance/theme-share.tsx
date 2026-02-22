"use client";

import { useState } from "react";
import { Copy, Download, Upload, Check } from "lucide-react";
import { exportTheme, importTheme } from "@/lib/themes/theme-share";
import type { SettingsUpdate } from "@/store/settings.store";

interface ThemeShareProps {
	currentSettings: SettingsUpdate;
	onImport: (settings: SettingsUpdate) => void;
}

export function ThemeShare({ currentSettings, onImport }: ThemeShareProps) {
	const [importCode, setImportCode] = useState("");
	const [importError, setImportError] = useState("");
	const [copied, setCopied] = useState(false);
	const [importSuccess, setImportSuccess] = useState(false);

	const handleExport = async () => {
		const code = exportTheme(currentSettings, "My Theme");
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Fallback: select a text field
		}
	};

	const handleImport = () => {
		setImportError("");
		setImportSuccess(false);

		const trimmed = importCode.trim();
		if (!trimmed) {
			setImportError("Paste a theme code to import");
			return;
		}

		const result = importTheme(trimmed);
		if (!result) {
			setImportError("Invalid theme code");
			return;
		}

		onImport(result.settings);
		setImportSuccess(true);
		setImportCode("");
		setTimeout(() => setImportSuccess(false), 2000);
	};

	return (
		<div className="space-y-4">
			{/* Export */}
			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleExport}
					className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
				>
					{copied ? (
						<>
							<Check className="w-3.5 h-3.5 text-green-400" />
							Copied!
						</>
					) : (
						<>
							<Copy className="w-3.5 h-3.5" />
							Export Theme
						</>
					)}
				</button>
			</div>

			{/* Import */}
			<div className="space-y-2">
				<div className="flex gap-2">
					<input
						type="text"
						value={importCode}
						onChange={(e) => {
							setImportCode(e.target.value);
							setImportError("");
						}}
						placeholder="Paste theme code..."
						className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500/50"
					/>
					<button
						type="button"
						onClick={handleImport}
						className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-sm text-blue-300 hover:bg-blue-500/30 transition-colors"
					>
						<Upload className="w-3.5 h-3.5" />
						Import
					</button>
				</div>
				{importError && (
					<p className="text-xs text-red-400">{importError}</p>
				)}
				{importSuccess && (
					<p className="text-xs text-green-400">Theme applied!</p>
				)}
			</div>
		</div>
	);
}
