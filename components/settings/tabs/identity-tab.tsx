"use client";

import { useMemo } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useThemeStore } from "@/store/theme.store";
import { usePointsStore } from "@/store/points.store";
import { useAuthStore } from "@/store/auth.store";
import { DEFAULT_PROFILE_THEMES, STATUS_EFFECTS } from "@/lib/themes/default-themes";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Slider } from "@/components/ui/slider/slider";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import type { ProfileTheme, StatusEffect } from "@/lib/themes/types";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";

// ── Helpers ─────────────────────────────────────────────────

function formatPoints(pts: number): string {
	if (pts >= 10000) return `${(pts / 1000).toFixed(1)}k`;
	if (pts >= 1000) return `${(pts / 1000).toFixed(1)}k`;
	return String(pts);
}

const STATUS_MAP: Record<string, AvatarStatus> = {
	online: "online",
	idle: "away",
	dnd: "busy",
	offline: "offline",
	invisible: "offline",
};

// ── Status Effect Animation Classes ─────────────────────────

function getStatusAnimationClass(animation: StatusEffect["animation"]): string {
	switch (animation) {
		case "pulse": return "status-effect-pulse";
		case "breathe": return "status-effect-breathe";
		case "shimmer": return "status-effect-shimmer";
		default: return "";
	}
}

// ── Component ───────────────────────────────────────────────

export function IdentityTab() {
	const user = useAuthStore((s) => s.user);

	// Theme store
	const activeProfileThemeId = useThemeStore((s) => s.activeProfileThemeId);
	const unlockedProfileThemeIds = useThemeStore((s) => s.unlockedProfileThemeIds);
	const unlockedStatusEffectIds = useThemeStore((s) => s.unlockedStatusEffectIds);
	const setProfileTheme = useThemeStore((s) => s.setProfileTheme);
	const unlockProfileTheme = useThemeStore((s) => s.unlockProfileTheme);
	const unlockStatusEffect = useThemeStore((s) => s.unlockStatusEffect);

	// Points store
	const totalPoints = usePointsStore((s) => s.totalPoints);
	const purchaseItem = usePointsStore((s) => s.purchaseItem);
	const shopItems = usePointsStore((s) => s.shopItems);

	// Presence trail
	const presenceTrail = usePointsStore((s) => s.presenceTrail);
	const setPresenceTrail = usePointsStore((s) => s.setPresenceTrail);

	// Derived
	const activeProfileTheme = useMemo(
		() => DEFAULT_PROFILE_THEMES.find((t) => t.id === activeProfileThemeId) ?? DEFAULT_PROFILE_THEMES[0],
		[activeProfileThemeId],
	);

	const statusEffectsList = useMemo(
		() => Object.values(STATUS_EFFECTS).filter((e) => e.id !== "offline"),
		[],
	);

	// Active status effect: for now just use the first animated one if unlocked, or "online"
	// In a real implementation, this would be a separate preference
	const presenceTrailPurchased = shopItems.find((i) => i.id === "presence-trail")?.isPurchased ?? false;
	const statusAnimationPurchased = shopItems.find((i) => i.id === "status-animation")?.isPurchased ?? false;
	const profileThemePurchased = shopItems.find((i) => i.id === "profile-theme")?.isPurchased ?? false;

	const handleUnlockProfileTheme = (theme: ProfileTheme) => {
		if (theme.cost === 0) {
			setProfileTheme(theme.id);
			return;
		}

		// Check if profile-theme shop item is purchased (unlocks all profile themes)
		if (profileThemePurchased) {
			unlockProfileTheme(theme.id);
			setProfileTheme(theme.id);
			return;
		}

		// Need to purchase the shop item first
		const success = purchaseItem("profile-theme");
		if (success) {
			// Unlock all profile themes
			for (const pt of DEFAULT_PROFILE_THEMES) {
				if (pt.cost > 0) unlockProfileTheme(pt.id);
			}
			setProfileTheme(theme.id);
		}
	};

	const handleUnlockStatusEffect = (effect: StatusEffect) => {
		if (effect.cost === 0) return; // Free effects are always available

		if (statusAnimationPurchased) {
			unlockStatusEffect(effect.id);
			return;
		}

		const success = purchaseItem("status-animation");
		if (success) {
			// Unlock all animated status effects
			for (const se of statusEffectsList) {
				if (se.cost > 0) unlockStatusEffect(se.id);
			}
		}
	};

	if (!user) return null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-white">Style & Identity</h1>
				<p className="text-slate-400 text-sm mt-1">
					Customize your profile card, status effects, and presence
				</p>
				<div className="flex items-center gap-2 mt-2">
					<Sparkles className="w-3.5 h-3.5 text-yellow-400" />
					<span className="text-xs text-yellow-400 font-medium">
						{formatPoints(totalPoints)} points available
					</span>
				</div>
			</div>

			{/* ── Profile Card Preview ────────────────────────── */}
			<SettingsSection title="Profile Card Preview">
				<div
					className="rounded-xl overflow-hidden border-2 transition-all"
					style={{
						borderColor: activeProfileTheme.cardBorder,
					}}
				>
					{/* Banner area */}
					<div
						className="h-20 relative"
						style={{ background: activeProfileTheme.cardBackground }}
					/>

					{/* Avatar + info */}
					<div
						className="p-4 relative"
						style={{ background: "oklch(0.12 0.02 265 / 0.8)" }}
					>
						<div
							className="absolute -top-8 left-4 rounded-full"
							style={{
								boxShadow: `0 0 16px ${activeProfileTheme.avatarGlow}`,
							}}
						>
							<Avatar
								src={user.avatar}
								fallback={user.displayName}
								status={STATUS_MAP[user.status] || "online"}
								size="lg"
							/>
						</div>
						<div className="ml-16 pt-1">
							<p
								className="font-semibold text-sm"
								style={{ color: activeProfileTheme.nameColor }}
							>
								{user.displayName}
							</p>
							<p className="text-xs text-slate-400">@{user.username}</p>
						</div>
					</div>
				</div>
			</SettingsSection>

			{/* ── Profile Themes ──────────────────────────────── */}
			<SettingsSection
				title="Profile Themes"
				description={
					profileThemePurchased
						? "All themes unlocked"
						: "Unlock premium themes with 100 points"
				}
			>
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{DEFAULT_PROFILE_THEMES.map((theme) => {
						const isUnlocked = theme.cost === 0 || unlockedProfileThemeIds.includes(theme.id) || profileThemePurchased;
						const isActive = activeProfileThemeId === theme.id;

						return (
							<button
								key={theme.id}
								type="button"
								onClick={() => {
									if (isUnlocked) {
										setProfileTheme(theme.id);
									} else {
										handleUnlockProfileTheme(theme);
									}
								}}
								className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
									isActive
										? "border-blue-500 ring-1 ring-blue-500/30"
										: "border-white/10 hover:border-white/20"
								} ${!isUnlocked ? "opacity-75" : ""}`}
							>
								{/* Theme gradient preview */}
								<div
									className="h-14 w-full"
									style={{ background: theme.cardBackground }}
								/>

								{/* Info */}
								<div className="p-2 bg-white/[0.02]">
									<div className="flex items-center justify-between">
										<p className="text-xs font-semibold text-slate-200">
											{theme.name}
										</p>
										{!isUnlocked && (
											<div className="flex items-center gap-1 text-yellow-400">
												<Lock className="w-3 h-3" />
												<span className="text-[10px] font-medium">
													{theme.cost}
												</span>
											</div>
										)}
										{isActive && (
											<span className="text-[10px] text-blue-400 font-medium">
												Active
											</span>
										)}
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</SettingsSection>

			{/* ── Status Effects ──────────────────────────────── */}
			<SettingsSection
				title="Status Effects"
				description={
					statusAnimationPurchased
						? "All animations unlocked"
						: "Animated status effects cost 50 points"
				}
			>
				<div className="flex flex-wrap gap-3">
					{statusEffectsList.map((effect) => {
						const isUnlocked = effect.cost === 0 || unlockedStatusEffectIds.includes(effect.id) || statusAnimationPurchased;
						const animClass = getStatusAnimationClass(effect.animation);

						return (
							<button
								key={effect.id}
								type="button"
								onClick={() => {
									if (!isUnlocked) {
										handleUnlockStatusEffect(effect);
									}
								}}
								className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all ${
									isUnlocked
										? "border-white/10 hover:border-white/20 hover:bg-white/5"
										: "border-white/5 opacity-60 hover:opacity-80"
								}`}
							>
								{/* Animated status dot */}
								<div className="relative">
									<div
										className={`w-3.5 h-3.5 rounded-full ${animClass}`}
										style={{ backgroundColor: effect.color }}
									/>
								</div>

								<div className="text-left">
									<p className="text-xs font-medium text-slate-200">
										{effect.name}
									</p>
									{effect.animation !== "none" && (
										<p className="text-[10px] text-slate-500 capitalize">
											{effect.animation}
										</p>
									)}
								</div>

								{!isUnlocked && (
									<div className="flex items-center gap-1 text-yellow-400 ml-1">
										<Lock className="w-2.5 h-2.5" />
										<span className="text-[10px] font-medium">{effect.cost}</span>
									</div>
								)}
							</button>
						);
					})}
				</div>
			</SettingsSection>

			{/* ── Presence Trail ──────────────────────────────── */}
			<SettingsSection
				title="Presence Trail"
				description={
					presenceTrailPurchased
						? "Leave a particle trail as you navigate"
						: "Unlock for 150 points in the Rewards shop"
				}
			>
				{presenceTrailPurchased ? (
					<div className="space-y-3">
						<SettingsRow label="Enable Presence Trail" description="Show trail effect while navigating">
							<button
								type="button"
								onClick={() => setPresenceTrail({ enabled: !presenceTrail.enabled })}
								className={`relative w-10 h-5.5 rounded-full transition-colors ${
									presenceTrail.enabled ? "bg-blue-500/40" : "bg-white/10"
								}`}
								role="switch"
								aria-checked={presenceTrail.enabled}
							>
								<div
									className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all"
									style={{
										left: presenceTrail.enabled ? "calc(100% - 20px)" : "2px",
									}}
								/>
							</button>
						</SettingsRow>

						{presenceTrail.enabled && (
							<>
								<div>
									<label className="text-xs text-slate-400 font-medium mb-1.5 block">
										Trail Color
									</label>
									<div className="flex gap-2">
										{[
											"#6B5CE7",
											"#E74C5C",
											"#4ECDC4",
											"#F7D154",
											"#FF6B6B",
											"#95E1D3",
										].map((color) => (
											<button
												key={color}
												type="button"
												onClick={() => setPresenceTrail({ color })}
												className={`w-8 h-8 rounded-full border-2 transition-all ${
													presenceTrail.color === color
														? "border-white scale-110"
														: "border-transparent hover:border-white/30"
												}`}
												style={{ backgroundColor: color }}
											/>
										))}
									</div>
								</div>

								<Slider
									label="Intensity"
									min={0.1}
									max={1}
									step={0.1}
									value={presenceTrail.intensity}
									onChange={(v) => setPresenceTrail({ intensity: v })}
									formatValue={(v) => `${Math.round(v * 100)}%`}
								/>
							</>
						)}
					</div>
				) : (
					<div className="flex items-center gap-3 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
						<Lock className="w-5 h-5 text-slate-500 shrink-0" />
						<div>
							<p className="text-sm text-slate-300">Locked</p>
							<p className="text-xs text-slate-500">
								Purchase "Presence Trail" from the Rewards shop (150 pts)
							</p>
						</div>
					</div>
				)}
			</SettingsSection>
		</div>
	);
}
