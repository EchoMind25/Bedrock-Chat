"use client";

import { useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useUIStore } from "@/store/ui.store";
import { getPerformanceTier } from "@/lib/utils/webgl";

/**
 * Fullscreen portal transition overlay shown during server switching.
 * Performance-tiered: high (particles + depth), medium (color morph), low (fade).
 */
export function PortalOverlay() {
	const isTransitioning = useUIStore((s) => s.isPortalTransitioning);
	const targetColor = useUIStore((s) => s.portalTargetColor);
	const sourceColor = useUIStore((s) => s.portalSourceColor);
	const isIdle = useUIStore((s) => s.isIdle);
	const endPortalTransition = useUIStore((s) => s.endPortalTransition);

	const tier = useMemo(() => {
		if (typeof window === "undefined") return "low";
		return getPerformanceTier();
	}, []);

	// Escape key dismisses portal
	useEffect(() => {
		if (!isTransitioning) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				endPortalTransition();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isTransitioning]); // Exclude endPortalTransition - stable Zustand action

	const handleAnimationComplete = useCallback(() => {
		endPortalTransition();
	}, [endPortalTransition]);

	if (typeof document === "undefined") return null;

	const showParticles = tier === "high" && !isIdle;
	const showDepth = tier === "high" || tier === "medium";

	return createPortal(
		<AnimatePresence>
			{isTransitioning && (
				<motion.div
					className="fixed inset-0 z-100 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.05 }}
					onAnimationComplete={handleAnimationComplete}
				>
					{/* Backdrop */}
					<motion.div
						className="absolute inset-0"
						style={{
							background: `linear-gradient(135deg, ${sourceColor || "oklch(0.15 0.02 285 / 0.9)"}, ${targetColor || "oklch(0.15 0.02 285 / 0.9)"})`,
						}}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.85 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.1 }}
					/>

					{/* Liquid glass overlay */}
					{showDepth && (
						<motion.div
							className="absolute inset-0 flex items-center justify-center"
							style={{ perspective: "800px" }}
						>
							<motion.div
								className="w-40 h-40 rounded-3xl"
								style={{
									background: `linear-gradient(135deg, ${targetColor || "oklch(0.65 0.25 265)"}, oklch(0.15 0.02 285 / 0.7))`,
									backdropFilter: "blur(28px) saturate(200%)",
									border: "1px solid oklch(0.4 0.04 265 / 0.35)",
									boxShadow: `0 8px 40px oklch(0 0 0 / 0.5), 0 0 80px ${targetColor || "oklch(0.5 0.15 265 / 0.15)"}`,
								}}
								initial={{
									scale: 0.3,
									opacity: 0,
									rotateY: -15,
								}}
								animate={{
									scale: 1.2,
									opacity: 1,
									rotateY: 0,
								}}
								exit={{
									scale: 2,
									opacity: 0,
								}}
								transition={{
									type: "spring",
									stiffness: 500,
									damping: 30,
								}}
							/>
						</motion.div>
					)}

					{/* Scatter particles (high tier only, skip when idle) */}
					{showParticles && <ScatterParticles color={targetColor} />}
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
}

/**
 * Burst of particles that scatter outward from center.
 */
function ScatterParticles({ color }: { color: string | null }) {
	const particles = useMemo(() => {
		return Array.from({ length: 20 }, (_, i) => {
			const angle = (i / 20) * Math.PI * 2;
			const distance = 100 + Math.random() * 200;
			return {
				id: i,
				x: Math.cos(angle) * distance,
				y: Math.sin(angle) * distance,
				size: 2 + Math.random() * 4,
				delay: Math.random() * 0.05,
			};
		});
	}, []);

	return (
		<div className="absolute inset-0 flex items-center justify-center overflow-hidden">
			{particles.map((p) => (
				<motion.div
					key={p.id}
					className="absolute rounded-full"
					style={{
						width: p.size,
						height: p.size,
						background: color || "oklch(0.65 0.25 265)",
						boxShadow: `0 0 ${p.size * 2}px ${color || "oklch(0.65 0.25 265)"}`,
					}}
					initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
					animate={{
						x: p.x,
						y: p.y,
						opacity: 0,
						scale: 0.3,
					}}
					transition={{
						duration: 0.25,
						delay: p.delay,
						ease: "easeOut",
					}}
				/>
			))}
		</div>
	);
}
