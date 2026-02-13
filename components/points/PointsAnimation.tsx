"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { usePointsStore } from "@/store/points.store";
import type { PendingReward } from "@/store/points.store";

/**
 * Reward pop-up notifications that appear when points are earned.
 * Renders via portal at screen bottom-center.
 * Auto-dismisses after 3 seconds.
 */
export function PointsAnimation() {
	const pendingRewards = usePointsStore((s) => s.pendingRewards);
	const dismissReward = usePointsStore((s) => s.dismissReward);
	const isEnabled = usePointsStore((s) => s.isEnabled);

	if (!isEnabled || typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
			<AnimatePresence mode="popLayout">
				{pendingRewards.slice(0, 3).map((reward) => (
					<RewardToast
						key={reward.id}
						reward={reward}
						onDismiss={() => dismissReward(reward.id)}
					/>
				))}
			</AnimatePresence>
		</div>,
		document.body,
	);
}

function RewardToast({
	reward,
	onDismiss,
}: {
	reward: PendingReward;
	onDismiss: () => void;
}) {
	useEffect(() => {
		const timer = setTimeout(onDismiss, 3000);
		return () => clearTimeout(timer);
	}, [onDismiss]);

	const getColor = () => {
		switch (reward.type) {
			case "achievement":
				return "oklch(0.65 0.25 265)"; // Purple
			case "easter_egg":
				return "oklch(0.65 0.15 85)"; // Yellow
			case "milestone":
				return "oklch(0.65 0.2 40)"; // Orange
			default:
				return "oklch(0.65 0.15 285)"; // Blue
		}
	};

	const getIcon = () => {
		switch (reward.type) {
			case "achievement":
				return "★";
			case "easter_egg":
				return "✦";
			case "milestone":
				return "🏆";
			default:
				return "+";
		}
	};

	return (
		<motion.div
			layout
			className="pointer-events-auto rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer"
			style={{
				backdropFilter: "blur(20px) saturate(180%)",
				background: `linear-gradient(135deg, oklch(0.18 0.03 265 / 0.85), oklch(0.12 0.02 280 / 0.9))`,
				border: `1px solid ${getColor()}40`,
				boxShadow: `0 4px 24px oklch(0 0 0 / 0.4), 0 0 20px ${getColor()}20`,
			}}
			initial={{ opacity: 0, y: 20, scale: 0.8 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: -10, scale: 0.9 }}
			transition={{ type: "spring", stiffness: 400, damping: 25 }}
			onClick={onDismiss}
			role="status"
			aria-live="polite"
		>
			{/* Icon */}
			<motion.span
				className="text-lg"
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{
					type: "spring",
					stiffness: 300,
					damping: 15,
					delay: 0.1,
				}}
			>
				{getIcon()}
			</motion.span>

			{/* Label */}
			<span className="text-sm text-blue-200/80 whitespace-nowrap">
				{reward.label}
			</span>

			{/* Points */}
			<motion.span
				className="text-sm font-bold ml-1"
				style={{ color: getColor() }}
				initial={{ opacity: 0, x: -5 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.15 }}
			>
				+{reward.points}
			</motion.span>
		</motion.div>
	);
}
