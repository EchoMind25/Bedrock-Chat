"use client";

import { motion } from "motion/react";
import type { WorldFormationStage } from "./world-formation";

interface WorldFormationLowProps {
	stage: WorldFormationStage;
}

/**
 * Minimal world formation for low-tier devices.
 * Simple animated gradient fade from black with a floating orb.
 */
export function WorldFormationLow({ stage }: WorldFormationLowProps) {
	const isVisible = stage !== "idle";

	return (
		<div className="absolute inset-0" aria-hidden="true">
			{/* Base gradient fade from black */}
			<motion.div
				className="absolute inset-0"
				style={{
					background:
						"linear-gradient(-45deg, oklch(0.15 0.05 250), oklch(0.2 0.08 280), oklch(0.15 0.06 300), oklch(0.18 0.04 250))",
					backgroundSize: "400% 400%",
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: isVisible ? 1 : 0 }}
				transition={{ duration: 1.5, ease: "easeOut" }}
			/>

			{/* Floating orb */}
			<motion.div
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
				style={{
					background:
						"radial-gradient(circle, oklch(0.55 0.25 265 / 0.3), transparent 70%)",
					filter: "blur(20px)",
				}}
				initial={{ opacity: 0, scale: 0.5 }}
				animate={
					isVisible
						? {
								opacity: [0, 0.6, 0.4],
								scale: [0.5, 1.2, 1],
							}
						: { opacity: 0 }
				}
				transition={{ duration: 2, ease: "easeOut" }}
			/>
		</div>
	);
}
