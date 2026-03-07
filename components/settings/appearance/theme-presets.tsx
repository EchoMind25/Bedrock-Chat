"use client";

import { APPEARANCE_PRESETS } from "@/lib/themes/presets";
import type { SettingsUpdate } from "@/store/settings.store";

interface ThemePresetsProps {
	onApply: (settings: SettingsUpdate) => void;
}

const FONT_MAP: Record<string, string> = {
	system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
	inter: "var(--font-inter), sans-serif",
	"sf-pro": '"SF Pro Display", -apple-system, sans-serif',
	"jetbrains-mono": "var(--font-jetbrains-mono), monospace",
	merriweather: "var(--font-merriweather), serif",
	opendyslexic: '"OpenDyslexic", sans-serif',
};

const MINI_MESSAGES = [
	{ user: "Alex", text: "Check this out!", own: false, color: "oklch(0.65 0.20 240)" },
	{ user: "You", text: "Looks great!", own: true, color: "" },
];

export function ThemePresets({ onApply }: ThemePresetsProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{APPEARANCE_PRESETS.map((preset) => {
				const s = preset.settings;
				const accent = s.accent_color || "oklch(0.65 0.25 265)";
				const isBubble = s.message_style === "bubble";
				const isMinimal = s.message_style === "minimal";
				const font = FONT_MAP[s.font_family || "system"] || FONT_MAP.system;

				return (
					<button
						key={preset.id}
						type="button"
						onClick={() => onApply(preset.settings)}
						className="group rounded-xl border border-white/10 overflow-hidden text-left transition-all hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
					>
						{/* Mini chat preview */}
						<div
							className="px-2.5 py-2.5 flex flex-col gap-1.5"
							style={{
								background: s.chat_background || "oklch(0.14 0.02 250)",
								fontFamily: font,
							}}
						>
							{MINI_MESSAGES.map((msg, i) => (
								<div
									key={i}
									className={`flex gap-1.5 ${isBubble && msg.own ? "justify-end" : ""}`}
								>
									{/* Avatar (flat/minimal only) */}
									{!isBubble && (
										<div
											className="w-4 h-4 rounded-full shrink-0 mt-0.5"
											style={{ backgroundColor: msg.own ? accent : msg.color }}
										/>
									)}

									<div className={isBubble ? "max-w-[80%]" : ""}>
										{/* Username (flat/minimal) */}
										{!isBubble && (
											<span
												className="block text-[7px] font-semibold leading-none mb-0.5"
												style={{ color: msg.own ? accent : msg.color }}
											>
												{msg.user}
											</span>
										)}

										{/* Message body */}
										<div
											className={`text-[8px] leading-tight ${
												isBubble
													? "rounded-lg px-2 py-1"
													: isMinimal
														? ""
														: ""
											}`}
											style={
												isBubble
													? {
															backgroundColor: msg.own
																? accent
																: "oklch(0.18 0.02 250 / 0.6)",
															color: msg.own ? "white" : "oklch(0.88 0.01 250)",
														}
													: { color: "oklch(0.85 0.01 250)" }
											}
										>
											{msg.text}
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Info */}
						<div className="px-2.5 py-2 bg-white/[0.02] border-t border-white/5">
							<div className="flex items-center gap-1.5">
								{/* Accent color dot */}
								<div
									className="w-2.5 h-2.5 rounded-full shrink-0"
									style={{ backgroundColor: accent }}
								/>
								<p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
									{preset.name}
								</p>
							</div>
							<p className="text-[10px] text-slate-500 mt-0.5">
								{preset.description}
							</p>
						</div>
					</button>
				);
			})}
		</div>
	);
}
