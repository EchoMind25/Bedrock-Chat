"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePointsStore } from "@/store/points.store";
import type { PendingReward } from "@/store/points.store";

const TYPE_STYLES: Record<PendingReward["type"], { bg: string; border: string; text: string }> = {
	points: {
		bg: "oklch(0.25 0.08 145 / 0.9)",
		border: "oklch(0.5 0.15 145 / 0.4)",
		text: "oklch(0.8 0.15 145)",
	},
	achievement: {
		bg: "oklch(0.25 0.08 85 / 0.9)",
		border: "oklch(0.6 0.18 85 / 0.4)",
		text: "oklch(0.85 0.15 85)",
	},
	easter_egg: {
		bg: "oklch(0.22 0.08 285 / 0.9)",
		border: "oklch(0.5 0.2 285 / 0.4)",
		text: "oklch(0.8 0.18 285)",
	},
	milestone: {
		bg: "oklch(0.22 0.1 310 / 0.9)",
		border: "oklch(0.5 0.2 310 / 0.4)",
		text: "oklch(0.85 0.15 310)",
	},
};

function RewardItem({ reward }: { reward: PendingReward }) {
	const dismissReward = usePointsStore((s) => s.dismissReward);
	const style = TYPE_STYLES[reward.type];

	useEffect(() => {
		const timer = setTimeout(() => {
			dismissReward(reward.id);
		}, 3500);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reward.id]);

	return (
		<motion.div
			layout
			initial={{ opacity: 0, x: 60, scale: 0.9 }}
			animate={{ opacity: 1, x: 0, scale: 1 }}
			exit={{ opacity: 0, x: 60, scale: 0.9 }}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
			className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-sm cursor-pointer"
			style={{
				backgroundColor: style.bg,
				borderWidth: 1,
				borderColor: style.border,
				boxShadow: `0 4px 20px oklch(0 0 0 / 0.3), 0 0 30px ${style.border}`,
			}}
			onClick={() => dismissReward(reward.id)}
		>
			<span
				className="text-lg font-bold tabular-nums"
				style={{ color: style.text }}
			>
				+{reward.points}
			</span>
			<span className="text-sm text-white/80 truncate">
				{reward.label}
			</span>
		</motion.div>
	);
}

export function RewardToasts() {
	const pendingRewards = usePointsStore((s) => s.pendingRewards);

	// Only show the 3 most recent
	const visible = pendingRewards.slice(0, 3);

	return (
		<div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
			<AnimatePresence mode="popLayout">
				{visible.map((reward) => (
					<div key={reward.id} className="pointer-events-auto">
						<RewardItem reward={reward} />
					</div>
				))}
			</AnimatePresence>
		</div>
	);
}
