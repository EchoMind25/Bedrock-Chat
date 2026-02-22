"use client";

import { APPEARANCE_PRESETS } from "@/lib/themes/presets";
import type { SettingsUpdate } from "@/store/settings.store";

interface ThemePresetsProps {
	onApply: (settings: SettingsUpdate) => void;
}

export function ThemePresets({ onApply }: ThemePresetsProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{APPEARANCE_PRESETS.map((preset) => (
				<button
					key={preset.id}
					type="button"
					onClick={() => onApply(preset.settings)}
					className="group rounded-xl border border-white/10 overflow-hidden text-left transition-all hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
				>
					{/* Preview gradient */}
					<div
						className="h-16 w-full"
						style={{ background: preset.preview }}
					/>
					{/* Info */}
					<div className="p-2.5 bg-white/[0.02]">
						<p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
							{preset.name}
						</p>
						<p className="text-[10px] text-slate-500 mt-0.5">
							{preset.description}
						</p>
					</div>
				</button>
			))}
		</div>
	);
}
