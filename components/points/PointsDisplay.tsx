"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePointsStore } from "@/store/points.store";
import { DAILY_CAPS } from "@/lib/points-system";

/**
 * Compact points display for the user panel or header.
 * Shows total points with a progress ring for daily cap.
 * Expandable popover with streak info and daily progress.
 */
export function PointsDisplay() {
	const totalPoints = usePointsStore((s) => s.totalPoints);
	const streak = usePointsStore((s) => s.streak);
	const isEnabled = usePointsStore((s) => s.isEnabled);
	const getPointsToday = usePointsStore((s) => s.getPointsToday);
	const [isExpanded, setIsExpanded] = useState(false);

	if (!isEnabled) return null;

	const todayPoints = getPointsToday();
	const dailyProgress = Math.min(todayPoints / DAILY_CAPS.totalPoints, 1);

	// SVG circle progress
	const radius = 14;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference * (1 - dailyProgress);

	return (
		<div className="relative">
			<motion.button
				className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors"
				onClick={() => setIsExpanded(!isExpanded)}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				aria-label={`${totalPoints} points. Click for details.`}
			>
				{/* Progress ring */}
				<div className="relative w-8 h-8">
					<svg
						className="w-8 h-8 -rotate-90"
						viewBox="0 0 36 36"
						aria-hidden="true"
					>
						{/* Background ring */}
						<circle
							cx="18"
							cy="18"
							r={radius}
							fill="none"
							stroke="oklch(0.25 0.02 265 / 0.5)"
							strokeWidth="3"
						/>
						{/* Progress ring */}
						<motion.circle
							cx="18"
							cy="18"
							r={radius}
							fill="none"
							stroke="oklch(0.65 0.25 265)"
							strokeWidth="3"
							strokeLinecap="round"
							strokeDasharray={circumference}
							initial={{ strokeDashoffset: circumference }}
							animate={{ strokeDashoffset }}
							transition={{ duration: 0.5, ease: "easeOut" }}
						/>
					</svg>
					{/* Streak flame icon */}
					{streak.currentStreak > 0 && (
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-xs" aria-hidden="true">
								{streak.currentStreak > 6 ? "🔥" : "✦"}
							</span>
						</div>
					)}
				</div>

				{/* Points count */}
				<div className="text-left">
					<motion.span
						className="text-sm font-semibold text-blue-300"
						key={totalPoints}
						initial={{ y: -5, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						transition={{ type: "spring", stiffness: 300, damping: 25 }}
					>
						{totalPoints.toLocaleString()}
					</motion.span>
					<span className="text-[10px] text-blue-300/40 block leading-none">
						pts
					</span>
				</div>
			</motion.button>

			{/* Expanded popover */}
			<AnimatePresence>
				{isExpanded && (
					<>
						{/* Backdrop */}
						<div
							className="fixed inset-0 z-40"
							onClick={() => setIsExpanded(false)}
						/>
						<motion.div
							className="absolute bottom-full left-0 mb-2 z-50 w-56 rounded-xl overflow-hidden"
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							transition={{
								type: "spring",
								stiffness: 400,
								damping: 25,
							}}
						>
							<div className="liquid-glass-elevated p-4 space-y-3">
								{/* Total */}
								<div className="text-center">
									<p className="text-2xl font-bold text-blue-400">
										{totalPoints.toLocaleString()}
									</p>
									<p className="text-xs text-blue-300/50">
										Total Points
									</p>
								</div>

								{/* Divider */}
								<div className="border-t border-white/10" />

								{/* Daily progress */}
								<div>
									<div className="flex justify-between text-xs mb-1">
										<span className="text-blue-300/60">
											Today
										</span>
										<span className="text-blue-300/80">
											{todayPoints} / {DAILY_CAPS.totalPoints}
										</span>
									</div>
									<div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
										<motion.div
											className="h-full rounded-full"
											style={{
												background:
													"linear-gradient(90deg, oklch(0.65 0.25 265), oklch(0.7 0.15 285))",
											}}
											initial={{ width: 0 }}
											animate={{
												width: `${dailyProgress * 100}%`,
											}}
											transition={{ duration: 0.5 }}
										/>
									</div>
								</div>

								{/* Streak */}
								<div className="flex items-center justify-between">
									<span className="text-xs text-blue-300/60">
										Login Streak
									</span>
									<span className="text-sm font-medium text-blue-300">
										{streak.currentStreak} day
										{streak.currentStreak !== 1 ? "s" : ""}
									</span>
								</div>

								{/* Best streak */}
								{streak.longestStreak > 0 && (
									<div className="flex items-center justify-between">
										<span className="text-xs text-blue-300/60">
											Best Streak
										</span>
										<span className="text-xs text-blue-300/40">
											{streak.longestStreak} days
										</span>
									</div>
								)}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
