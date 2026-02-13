"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "@/store/theme.store";
import { Glass } from "@/components/ui/glass/glass";
import { ThemePreview } from "./ThemePreview";
import { AIDesigner } from "./AIDesigner";
import {
	validateTheme,
	getPerformanceWarning,
	getContrastRatio,
	suggestContrastFix,
} from "@/lib/themes/theme-validator";
import { createCustomThemeTemplate } from "@/lib/themes/default-themes";
import type { ServerTheme, ThemeColors, ThemeEffects, ThemeLayout } from "@/lib/themes/types";

type Tab = "presets" | "customize" | "ai";

/**
 * Server theme editor for server owners.
 * Provides preset selection, custom color editing with live preview,
 * effects toggles, layout options, and accessibility validation.
 */
export function ThemeCustomizer({ serverId }: { serverId: string }) {
	const activeTheme = useThemeStore((s) => s.activeTheme);
	const getAllThemes = useThemeStore((s) => s.getAllThemes);
	const setServerTheme = useThemeStore((s) => s.setServerTheme);
	const saveCustomTheme = useThemeStore((s) => s.saveCustomTheme);
	const updateActiveColors = useThemeStore((s) => s.updateActiveColors);
	const updateActiveEffects = useThemeStore((s) => s.updateActiveEffects);
	const updateActiveLayout = useThemeStore((s) => s.updateActiveLayout);
	const serverThemes = useThemeStore((s) => s.serverThemes);

	const [activeTab, setActiveTab] = useState<Tab>("presets");
	const [editingTheme, setEditingTheme] = useState<ServerTheme | null>(null);

	const allThemes = getAllThemes();
	const currentThemeId = serverThemes[serverId] ?? "neon-street";

	// Validation
	const validation = useMemo(
		() => validateTheme(activeTheme.colors),
		[activeTheme.colors],
	);

	const perfWarning = useMemo(
		() => getPerformanceWarning(activeTheme.effects),
		[activeTheme.effects],
	);

	const handleSelectPreset = (themeId: string) => {
		setServerTheme(serverId, themeId);
		const theme = allThemes.find((t) => t.id === themeId);
		if (theme) {
			useThemeStore.setState({ activeTheme: theme });
		}
	};

	const handleStartCustomize = () => {
		const template = createCustomThemeTemplate(serverId);
		template.colors = { ...activeTheme.colors };
		template.effects = { ...activeTheme.effects };
		template.layout = activeTheme.layout;
		setEditingTheme(template);
		setActiveTab("customize");
	};

	const handleSaveCustom = () => {
		if (editingTheme) {
			saveCustomTheme({
				...editingTheme,
				colors: activeTheme.colors,
				effects: activeTheme.effects,
				layout: activeTheme.layout,
			});
			setServerTheme(serverId, editingTheme.id);
			setEditingTheme(null);
		}
	};

	const tabs: { id: Tab; label: string }[] = [
		{ id: "presets", label: "Presets" },
		{ id: "customize", label: "Customize" },
		{ id: "ai", label: "AI Designer" },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-lg font-semibold text-blue-300">
					Server Appearance
				</h2>
				<p className="text-xs text-blue-300/40 mt-1">
					Customize your server's visual environment
				</p>
			</div>

			{/* Tab Navigation */}
			<div className="flex gap-1 p-1 rounded-lg bg-white/5">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
							activeTab === tab.id
								? "bg-white/10 text-blue-300"
								: "text-blue-300/40 hover:text-blue-300/60"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<AnimatePresence mode="wait">
				{/* Presets Tab */}
				{activeTab === "presets" && (
					<motion.div
						key="presets"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						className="space-y-4"
					>
						<div className="grid grid-cols-2 gap-3">
							{allThemes.map((theme) => (
								<ThemePreview
									key={theme.id}
									theme={theme}
									isSelected={currentThemeId === theme.id}
									onClick={() =>
										handleSelectPreset(theme.id)
									}
									size="large"
								/>
							))}
						</div>

						<button
							onClick={handleStartCustomize}
							className="w-full py-2.5 rounded-lg border border-dashed border-white/15 text-xs text-blue-300/50 hover:border-blue-500/30 hover:text-blue-300/70 transition-colors"
						>
							+ Create Custom Theme (500 pts)
						</button>
					</motion.div>
				)}

				{/* Customize Tab */}
				{activeTab === "customize" && (
					<motion.div
						key="customize"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						className="space-y-5"
					>
						{/* Live Preview */}
						<div className="flex justify-center">
							<ThemePreview
								theme={activeTheme}
								size="large"
								isSelected
							/>
						</div>

						{/* Colors */}
						<section>
							<h3 className="text-xs font-medium text-blue-300/70 mb-3">
								Colors
							</h3>
							<div className="grid grid-cols-2 gap-3">
								<ColorField
									label="Primary"
									value={activeTheme.colors.primary}
									onChange={(v) =>
										updateActiveColors({ primary: v })
									}
									bgRef={activeTheme.colors.background}
								/>
								<ColorField
									label="Secondary"
									value={activeTheme.colors.secondary}
									onChange={(v) =>
										updateActiveColors({ secondary: v })
									}
									bgRef={activeTheme.colors.background}
								/>
								<ColorField
									label="Accent"
									value={activeTheme.colors.accent}
									onChange={(v) =>
										updateActiveColors({ accent: v })
									}
									bgRef={activeTheme.colors.background}
								/>
								<ColorField
									label="Background"
									value={activeTheme.colors.background}
									onChange={(v) =>
										updateActiveColors({ background: v })
									}
								/>
								<ColorField
									label="Text"
									value={activeTheme.colors.text}
									onChange={(v) =>
										updateActiveColors({ text: v })
									}
									bgRef={activeTheme.colors.background}
								/>
								<ColorField
									label="Muted Text"
									value={activeTheme.colors.textMuted}
									onChange={(v) =>
										updateActiveColors({ textMuted: v })
									}
									bgRef={activeTheme.colors.background}
								/>
							</div>
						</section>

						{/* Validation */}
						{!validation.isValid && (
							<Glass
								variant="light"
								border="none"
								className="p-3"
							>
								<div className="flex items-center gap-2 mb-2">
									<span className="w-2 h-2 rounded-full bg-yellow-400" />
									<span className="text-xs text-yellow-400/80 font-medium">
										Accessibility Issues
									</span>
									<span className="text-[10px] text-blue-300/30 ml-auto">
										Score: {validation.score}/100
									</span>
								</div>
								<div className="space-y-1">
									{validation.suggestions.map(
										(suggestion, i) => (
											<p
												key={i}
												className="text-[10px] text-blue-300/40 leading-relaxed"
											>
												{suggestion}
											</p>
										),
									)}
								</div>
							</Glass>
						)}

						{/* Effects */}
						<section>
							<h3 className="text-xs font-medium text-blue-300/70 mb-3">
								Effects
							</h3>
							<div className="space-y-2">
								<EffectToggle
									label="Glass Blur"
									description="Frosted glass background effect"
									enabled={activeTheme.effects.glassBlur}
									onChange={(v) =>
										updateActiveEffects({ glassBlur: v })
									}
								/>
								<EffectToggle
									label="Glow"
									description="Ambient glow on accent elements"
									enabled={activeTheme.effects.glow}
									onChange={(v) =>
										updateActiveEffects({ glow: v })
									}
								/>
								<EffectToggle
									label="Parallax"
									description="Depth effect on scroll"
									enabled={activeTheme.effects.parallax}
									onChange={(v) =>
										updateActiveEffects({ parallax: v })
									}
								/>
								<EffectToggle
									label="Particles"
									description="Ambient floating particles"
									enabled={activeTheme.effects.particles}
									onChange={(v) =>
										updateActiveEffects({ particles: v })
									}
								/>
							</div>

							{perfWarning && (
								<p className="text-[10px] text-yellow-400/60 mt-2">
									{perfWarning}
								</p>
							)}
						</section>

						{/* Layout */}
						<section>
							<h3 className="text-xs font-medium text-blue-300/70 mb-3">
								Layout
							</h3>
							<div className="flex gap-2">
								{(
									["compact", "spacious", "minimal"] as const
								).map((layout) => (
									<button
										key={layout}
										onClick={() =>
											updateActiveLayout(layout)
										}
										className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
											activeTheme.layout === layout
												? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
												: "bg-white/5 text-blue-300/40 border border-transparent hover:bg-white/10"
										}`}
									>
										{layout.charAt(0).toUpperCase() +
											layout.slice(1)}
									</button>
								))}
							</div>
						</section>

						{/* Save */}
						<div className="flex gap-3">
							<button
								onClick={() => setActiveTab("presets")}
								className="flex-1 py-2.5 rounded-lg border border-white/10 text-xs text-blue-300/50 hover:bg-white/5 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveCustom}
								disabled={!validation.isValid}
								className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
									validation.isValid
										? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
										: "bg-white/5 text-blue-300/20 border border-white/5 cursor-not-allowed"
								}`}
							>
								{validation.isValid
									? "Save Theme"
									: "Fix Accessibility Issues"}
							</button>
						</div>
					</motion.div>
				)}

				{/* AI Designer Tab */}
				{activeTab === "ai" && (
					<motion.div
						key="ai"
						initial={{ opacity: 0, y: 5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
					>
						<AIDesigner />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────

function ColorField({
	label,
	value,
	onChange,
	bgRef,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	bgRef?: string;
}) {
	const [isEditing, setIsEditing] = useState(false);

	// Calculate contrast if we have a background reference
	const contrast = bgRef ? getContrastRatio(value, bgRef) : null;
	const contrastOk = contrast !== null ? contrast >= 4.5 : true;

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between">
				<label className="text-[10px] text-blue-300/50">{label}</label>
				{contrast !== null && (
					<span
						className={`text-[9px] ${contrastOk ? "text-green-400/60" : "text-red-400/60"}`}
					>
						{Math.round(contrast * 10) / 10}:1
					</span>
				)}
			</div>
			<div
				className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
				onClick={() => setIsEditing(!isEditing)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setIsEditing(!isEditing);
					}
				}}
			>
				<div
					className="w-4 h-4 rounded-md border border-white/20 flex-shrink-0"
					style={{ background: value }}
				/>
				<span className="text-[10px] text-blue-300/60 truncate font-mono">
					{value}
				</span>
			</div>

			{isEditing && (
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="oklch(0.65 0.25 265)"
					className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-blue-300 font-mono focus:outline-none focus:border-blue-500/30"
					onBlur={() => setIsEditing(false)}
					autoFocus
				/>
			)}
		</div>
	);
}

function EffectToggle({
	label,
	description,
	enabled,
	onChange,
}: {
	label: string;
	description: string;
	enabled: boolean;
	onChange: (enabled: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between py-1.5">
			<div>
				<p className="text-xs text-blue-300/80">{label}</p>
				<p className="text-[10px] text-blue-300/30">{description}</p>
			</div>
			<button
				onClick={() => onChange(!enabled)}
				className={`relative w-9 h-5 rounded-full transition-colors ${
					enabled ? "bg-blue-500/40" : "bg-white/10"
				}`}
				role="switch"
				aria-checked={enabled}
				aria-label={`Toggle ${label}`}
			>
				<motion.div
					className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
					animate={{
						left: enabled ? "calc(100% - 18px)" : "2px",
					}}
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 30,
					}}
				/>
			</button>
		</div>
	);
}
