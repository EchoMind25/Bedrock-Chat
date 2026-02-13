"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePointsStore } from "@/store/points.store";

/**
 * Subtle, periodic hints for undiscovered easter eggs.
 * Appears as a faint, dismissable tooltip at screen edge.
 * Only shows if there are undiscovered eggs.
 */
export function EasterEggHint() {
	const easterEggs = usePointsStore((s) => s.easterEggs);
	const isEnabled = usePointsStore((s) => s.isEnabled);
	const [currentHint, setCurrentHint] = useState<string | null>(null);
	const [isDismissed, setIsDismissed] = useState(false);

	// Find undiscovered eggs
	const undiscovered = easterEggs.filter(
		(e) => e.isActive && !e.discoveredAt,
	);

	useEffect(() => {
		if (!isEnabled || undiscovered.length === 0) return;

		// Show a random hint every 5 minutes
		const showHint = () => {
			const randomEgg =
				undiscovered[Math.floor(Math.random() * undiscovered.length)];
			setCurrentHint(randomEgg.hint);
			setIsDismissed(false);

			// Auto-dismiss after 8 seconds
			const dismissTimer = setTimeout(() => {
				setIsDismissed(true);
			}, 8000);

			return dismissTimer;
		};

		// Initial delay of 2 minutes before first hint
		const initialTimer = setTimeout(() => {
			const dismissTimer = showHint();

			// Then repeat every 5 minutes
			const interval = setInterval(() => {
				clearTimeout(dismissTimer);
				showHint();
			}, 300_000);

			return () => {
				clearInterval(interval);
				clearTimeout(dismissTimer);
			};
		}, 120_000);

		return () => clearTimeout(initialTimer);
	}, [isEnabled, undiscovered.length]);

	if (!isEnabled || undiscovered.length === 0) return null;

	return (
		<AnimatePresence>
			{currentHint && !isDismissed && (
				<motion.div
					className="fixed bottom-6 right-6 z-30 max-w-[240px]"
					initial={{ opacity: 0, x: 20, scale: 0.95 }}
					animate={{ opacity: 1, x: 0, scale: 1 }}
					exit={{ opacity: 0, x: 20, scale: 0.95 }}
					transition={{
						type: "spring",
						stiffness: 300,
						damping: 25,
					}}
				>
					<button
						className="w-full text-left p-3 rounded-xl"
						onClick={() => setIsDismissed(true)}
						style={{
							backdropFilter: "blur(12px)",
							background:
								"oklch(0.15 0.02 265 / 0.6)",
							border: "1px solid oklch(0.3 0.05 265 / 0.2)",
						}}
					>
						<div className="flex items-start gap-2">
							<span
								className="text-xs flex-shrink-0 mt-0.5"
								style={{
									color: "oklch(0.7 0.15 85)",
								}}
							>
								✦
							</span>
							<div>
								<p
									className="text-xs leading-relaxed"
									style={{
										color: "oklch(0.7 0.08 265 / 0.6)",
									}}
								>
									{currentHint}
								</p>
							</div>
						</div>
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
