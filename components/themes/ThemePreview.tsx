"use client";

import { motion } from "motion/react";
import type { ServerTheme } from "@/lib/themes/types";

/**
 * Visual preview card for a server theme.
 * Shows a miniature mock of the server environment.
 * Used in the theme selector and customizer.
 */
export function ThemePreview({
	theme,
	isSelected = false,
	onClick,
	size = "medium",
}: {
	theme: ServerTheme;
	isSelected?: boolean;
	onClick?: () => void;
	size?: "small" | "medium" | "large";
}) {
	const dimensions = {
		small: { w: "w-32", h: "h-20" },
		medium: { w: "w-48", h: "h-32" },
		large: { w: "w-64", h: "h-44" },
	}[size];

	return (
		<motion.button
			className={`${dimensions.w} ${dimensions.h} rounded-xl overflow-hidden relative group transition-shadow ${
				isSelected
					? "ring-2 ring-offset-2 ring-offset-transparent"
					: "hover:ring-1 hover:ring-white/20"
			}`}
			style={
				isSelected
					? ({
							"--tw-ring-color": theme.colors.accent,
						} as React.CSSProperties)
					: undefined
			}
			onClick={onClick}
			whileHover={{ scale: 1.03 }}
			whileTap={{ scale: 0.98 }}
			aria-label={`${theme.name} theme${isSelected ? " (selected)" : ""}`}
			aria-pressed={isSelected}
		>
			{/* Background */}
			<div
				className="absolute inset-0"
				style={{ background: theme.colors.background }}
			/>

			{/* Atmosphere overlay */}
			<div
				className="absolute inset-0"
				style={{ background: theme.colors.atmosphere }}
			/>

			{/* Mini layout mock */}
			<div className="absolute inset-0 flex">
				{/* Server list mock */}
				<div
					className="w-3 h-full flex flex-col items-center py-1 gap-0.5"
					style={{
						background: `color-mix(in oklch, ${theme.colors.background}, black 20%)`,
					}}
				>
					<div
						className="w-1.5 h-1.5 rounded-xs"
						style={{ background: theme.colors.primary }}
					/>
					<div
						className="w-1.5 h-1.5 rounded-xs opacity-40"
						style={{ background: theme.colors.textMuted }}
					/>
					<div
						className="w-1.5 h-1.5 rounded-xs opacity-40"
						style={{ background: theme.colors.textMuted }}
					/>
				</div>

				{/* Channel list mock */}
				<div
					className="w-8 h-full flex flex-col py-1 px-0.5 gap-0.5"
					style={{ background: theme.colors.surface }}
				>
					<div
						className="w-full h-1 rounded-xs opacity-70"
						style={{ background: theme.colors.text }}
					/>
					<div
						className="w-3/4 h-0.5 rounded-xs opacity-30"
						style={{ background: theme.colors.textMuted }}
					/>
					<div
						className="w-full h-0.5 rounded-xs opacity-30"
						style={{ background: theme.colors.textMuted }}
					/>
					<div
						className="w-2/3 h-0.5 rounded-xs"
						style={{ background: theme.colors.accent }}
					/>
					<div
						className="w-full h-0.5 rounded-xs opacity-30"
						style={{ background: theme.colors.textMuted }}
					/>
				</div>

				{/* Chat area mock */}
				<div className="flex-1 flex flex-col justify-end p-1 gap-0.5">
					{/* Messages */}
					<div className="flex items-start gap-0.5">
						<div
							className="w-2 h-2 rounded-full shrink-0"
							style={{ background: theme.colors.accent }}
						/>
						<div className="flex flex-col gap-px">
							<div
								className="w-6 h-0.5 rounded-xs"
								style={{ background: theme.colors.text }}
							/>
							<div
								className="w-10 h-0.5 rounded-xs opacity-60"
								style={{ background: theme.colors.textMuted }}
							/>
						</div>
					</div>
					<div className="flex items-start gap-0.5">
						<div
							className="w-2 h-2 rounded-full shrink-0"
							style={{ background: theme.colors.primary }}
						/>
						<div className="flex flex-col gap-px">
							<div
								className="w-4 h-0.5 rounded-xs"
								style={{ background: theme.colors.text }}
							/>
							<div
								className="w-12 h-0.5 rounded-xs opacity-60"
								style={{ background: theme.colors.textMuted }}
							/>
						</div>
					</div>

					{/* Input mock */}
					<div
						className="w-full h-2 rounded-xs mt-0.5"
						style={{
							background: theme.colors.surface,
							border: `0.5px solid ${theme.colors.border}`,
						}}
					/>
				</div>
			</div>

			{/* Glow effect (if theme has glow) */}
			{theme.effects.glow && (
				<div
					className="absolute inset-0 opacity-20 pointer-events-none"
					style={{
						background: `radial-gradient(circle at 70% 30%, ${theme.colors.primary}, transparent 60%)`,
					}}
				/>
			)}

			{/* Selected indicator */}
			{isSelected && (
				<motion.div
					className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
					style={{ background: theme.colors.accent }}
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 400,
						damping: 20,
					}}
				>
					<svg
						width="10"
						height="10"
						viewBox="0 0 24 24"
						fill="none"
						stroke="white"
						strokeWidth="3"
					>
						<path d="M20 6 9 17l-5-5" />
					</svg>
				</motion.div>
			)}

			{/* Label */}
			<div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-linear-to-t from-black/60 to-transparent">
				<p
					className="text-[9px] font-medium truncate"
					style={{ color: theme.colors.text }}
				>
					{theme.name}
				</p>
			</div>
		</motion.button>
	);
}
