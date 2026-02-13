"use client";

import { motion } from "motion/react";
import { worldSprings } from "@/lib/utils/intro-animations";
import type { WorldFormationStage } from "./world-formation";

interface PortalRevealProps {
	stage: WorldFormationStage;
}

/**
 * Portal opening animation that bridges world formation to the auth form.
 * Uses CSS clip-path circle expansion with a glowing ring.
 * Renders on medium and high tier devices.
 */
export function PortalReveal({ stage }: PortalRevealProps) {
	const isOpening = stage === "stage3" || stage === "complete";

	return (
		<div
			className="absolute inset-0 flex items-center justify-center pointer-events-none"
			aria-hidden="true"
		>
			{/* Expanding portal mask */}
			<motion.div
				className="absolute inset-0"
				initial={{ clipPath: "circle(0% at 50% 50%)" }}
				animate={{
					clipPath: isOpening
						? "circle(100% at 50% 50%)"
						: "circle(0% at 50% 50%)",
				}}
				transition={worldSprings.portalOpen}
			>
				<div className="absolute inset-0 bg-black/30" />
			</motion.div>

			{/* Portal glow ring */}
			<motion.div
				className="relative"
				initial={{ opacity: 0, scale: 0.3 }}
				animate={
					isOpening
						? { opacity: [0, 1, 0.6, 0], scale: [0.3, 1, 1.5, 2] }
						: { opacity: 0, scale: 0.3 }
				}
				transition={{ duration: 2, ease: "easeOut" }}
			>
				<div
					className="w-48 h-48 rounded-full"
					style={{
						border: "2px solid oklch(0.55 0.25 265 / 0.5)",
						boxShadow:
							"0 0 40px oklch(0.55 0.25 265 / 0.3), inset 0 0 40px oklch(0.55 0.25 265 / 0.1)",
						animation: "portal-ring-glow 1.5s ease-in-out infinite",
					}}
				/>
			</motion.div>

			{/* Inner glow burst */}
			<motion.div
				className="absolute"
				initial={{ opacity: 0, scale: 0 }}
				animate={
					isOpening
						? { opacity: [0, 0.8, 0], scale: [0, 1, 2] }
						: { opacity: 0, scale: 0 }
				}
				transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
			>
				<div
					className="w-32 h-32 rounded-full"
					style={{
						background:
							"radial-gradient(circle, oklch(0.65 0.25 265 / 0.4), oklch(0.55 0.15 285 / 0.2), transparent 70%)",
						filter: "blur(10px)",
					}}
				/>
			</motion.div>
		</div>
	);
}
