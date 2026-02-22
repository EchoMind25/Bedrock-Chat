"use client";

import { useState, useCallback } from "react";
import { Eye, Check, RotateCcw } from "lucide-react";
import { importTheme } from "@/lib/themes/theme-share";
import { useSettingsStore } from "@/store/settings.store";
import type { SettingsUpdate } from "@/store/settings.store";

// CSS variable keys that we temporarily override during "Try On"
const PREVIEW_VARS: Record<string, string> = {
	accent_color: "--color-primary",
	message_font_size: "--message-font-size",
	chat_background: "--chat-background",
};

const FONT_SIZE_MAP: Record<string, string> = {
	small: "0.875rem",
	medium: "1rem",
	large: "1.125rem",
};

export function StyleSwap() {
	const [importCode, setImportCode] = useState("");
	const [importError, setImportError] = useState("");
	const [previewActive, setPreviewActive] = useState(false);
	const [previewSettings, setPreviewSettings] = useState<SettingsUpdate | null>(null);
	const [previewName, setPreviewName] = useState("");
	const [savedVars, setSavedVars] = useState<Record<string, string>>({});

	const updateSettings = useSettingsStore((s) => s.updateSettings);

	const applyPreviewCssVars = useCallback((settings: SettingsUpdate) => {
		const root = document.documentElement;
		const saved: Record<string, string> = {};

		// Save current values
		for (const cssVar of Object.values(PREVIEW_VARS)) {
			saved[cssVar] = root.style.getPropertyValue(cssVar);
		}
		setSavedVars(saved);

		// Apply preview overrides
		if (settings.accent_color) {
			root.style.setProperty("--color-primary", settings.accent_color);
		}
		if (settings.message_font_size) {
			root.style.setProperty(
				"--message-font-size",
				FONT_SIZE_MAP[settings.message_font_size] ?? "1rem",
			);
		}
		if (settings.chat_background !== undefined) {
			root.style.setProperty(
				"--chat-background",
				settings.chat_background || "none",
			);
		}
	}, []);

	const revertPreviewCssVars = useCallback(() => {
		const root = document.documentElement;
		for (const [cssVar, value] of Object.entries(savedVars)) {
			if (value) {
				root.style.setProperty(cssVar, value);
			} else {
				root.style.removeProperty(cssVar);
			}
		}
		setSavedVars({});
	}, [savedVars]);

	const handleTryOn = () => {
		setImportError("");
		const trimmed = importCode.trim();
		if (!trimmed) {
			setImportError("Paste a theme code to try on");
			return;
		}

		const result = importTheme(trimmed);
		if (!result) {
			setImportError("Invalid theme code");
			return;
		}

		setPreviewSettings(result.settings);
		setPreviewName(result.name ?? "Shared Theme");
		setPreviewActive(true);
		applyPreviewCssVars(result.settings);
		setImportCode("");
	};

	const handleKeep = () => {
		if (previewSettings) {
			// Revert CSS vars first (updateSettings will re-apply via SettingsEffects)
			revertPreviewCssVars();
			updateSettings(previewSettings);
			setPreviewActive(false);
			setPreviewSettings(null);
		}
	};

	const handleRevert = () => {
		revertPreviewCssVars();
		setPreviewActive(false);
		setPreviewSettings(null);
	};

	return (
		<div className="space-y-4">
			{previewActive ? (
				<>
					{/* Preview active state */}
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
						<Eye className="w-4 h-4 text-purple-400 shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-purple-300">
								Previewing: {previewName}
							</p>
							<p className="text-[10px] text-purple-400/60">
								This is a temporary preview — your settings are unchanged
							</p>
						</div>
					</div>

					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleKeep}
							className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-sm text-green-300 hover:bg-green-500/30 transition-colors"
						>
							<Check className="w-3.5 h-3.5" />
							Keep This Style
						</button>
						<button
							type="button"
							onClick={handleRevert}
							className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 transition-colors"
						>
							<RotateCcw className="w-3.5 h-3.5" />
							Revert
						</button>
					</div>
				</>
			) : (
				<>
					{/* Import + Try On */}
					<p className="text-xs text-slate-400">
						Paste a friend's theme code to preview their style before applying it
					</p>
					<div className="flex gap-2">
						<input
							type="text"
							value={importCode}
							onChange={(e) => {
								setImportCode(e.target.value);
								setImportError("");
							}}
							placeholder="Paste theme code..."
							className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-purple-500/50"
						/>
						<button
							type="button"
							onClick={handleTryOn}
							className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300 hover:bg-purple-500/30 transition-colors"
						>
							<Eye className="w-3.5 h-3.5" />
							Try On
						</button>
					</div>
					{importError && (
						<p className="text-xs text-red-400">{importError}</p>
					)}
				</>
			)}
		</div>
	);
}
