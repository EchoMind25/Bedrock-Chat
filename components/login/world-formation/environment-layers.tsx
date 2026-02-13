"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { PerformanceTier } from "@/lib/utils/webgl";
import { worldSprings } from "@/lib/utils/intro-animations";
import type { WorldFormationStage } from "./world-formation";

interface EnvironmentLayersProps {
	stage: WorldFormationStage;
	tier: PerformanceTier;
}

/**
 * CSS-based street market environment that materializes layer by layer.
 * 5 layers: ground, structures, lighting, atmosphere, ambient particles.
 * Tier-scaled: high=all 5 + parallax, medium=4, low=2.
 */
// Deterministic pseudo-random based on index to avoid hydration mismatches
function seededRandom(seed: number): number {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
}

export function EnvironmentLayers({ stage, tier }: EnvironmentLayersProps) {
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

	// Pre-compute stable particle positions to avoid Math.random() in render
	const particleStyles = useMemo(
		() =>
			Array.from({ length: 20 }, (_, i) => ({
				size: 2 + seededRandom(i) * 3,
				left: `${5 + seededRandom(i + 100) * 90}%`,
				top: `${10 + seededRandom(i + 200) * 70}%`,
				duration: 3 + seededRandom(i + 300) * 4,
				delay: seededRandom(i + 400) * 3,
			})),
		[],
	);

	const showGround =
		stage === "stage2" || stage === "stage3" || stage === "complete";
	const showStructures =
		stage === "stage2" || stage === "stage3" || stage === "complete";
	const showLighting =
		(stage === "stage2" || stage === "stage3" || stage === "complete") &&
		tier !== "low";
	const showAtmosphere =
		(stage === "stage3" || stage === "complete") && tier !== "low";
	const showParticles =
		(stage === "stage2" || stage === "stage3" || stage === "complete") &&
		tier === "high";

	// Mouse parallax (high tier only)
	useEffect(() => {
		if (tier !== "high") return;

		const handleMouseMove = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth - 0.5) * 2;
			const y = (e.clientY / window.innerHeight - 0.5) * 2;
			setMousePos({ x, y });
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [tier]);

	const parallaxX = tier === "high" ? mousePos.x * 8 : 0;
	const parallaxY = tier === "high" ? mousePos.y * 5 : 0;

	return (
		<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
			{/* Layer 1: Ground Plane */}
			<motion.div
				className="absolute inset-x-0 bottom-0 h-[40%]"
				style={{
					background:
						"linear-gradient(to top, oklch(0.08 0.02 250), oklch(0.12 0.03 265 / 0.8), transparent)",
					x: parallaxX * 0.3,
					y: parallaxY * 0.2,
				}}
				initial={{ opacity: 0, y: 40 }}
				animate={
					showGround ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
				}
				transition={{ ...worldSprings.environmentReveal, delay: 0 }}
			/>

			{/* Layer 2: Structures (clip-path silhouettes) */}
			<motion.div
				className="absolute inset-x-0 bottom-0 h-[60%]"
				style={{
					x: parallaxX * 0.5,
					y: parallaxY * 0.3,
				}}
				initial={{ opacity: 0, y: 60 }}
				animate={
					showStructures
						? { opacity: 1, y: 0 }
						: { opacity: 0, y: 60 }
				}
				transition={{ ...worldSprings.environmentReveal, delay: 0.3 }}
			>
				{/* Left structure */}
				<div
					className="absolute bottom-0 left-[5%] w-[15%] h-[70%]"
					style={{
						background:
							"linear-gradient(to top, oklch(0.1 0.03 265 / 0.9), oklch(0.15 0.04 280 / 0.4))",
						clipPath:
							"polygon(10% 100%, 0% 30%, 15% 10%, 40% 0%, 60% 5%, 85% 15%, 100% 40%, 90% 100%)",
					}}
				/>
				{/* Center-left stall */}
				<div
					className="absolute bottom-0 left-[22%] w-[18%] h-[45%]"
					style={{
						background:
							"linear-gradient(to top, oklch(0.12 0.03 270 / 0.8), oklch(0.18 0.04 285 / 0.3))",
						clipPath:
							"polygon(5% 100%, 0% 35%, 20% 5%, 50% 0%, 80% 5%, 100% 30%, 95% 100%)",
					}}
				/>
				{/* Center structure (tallest) */}
				<div
					className="absolute bottom-0 left-[35%] w-[30%] h-[85%]"
					style={{
						background:
							"linear-gradient(to top, oklch(0.09 0.03 260 / 0.9), oklch(0.14 0.04 275 / 0.5))",
						clipPath:
							"polygon(15% 100%, 5% 50%, 10% 20%, 30% 5%, 50% 0%, 70% 5%, 90% 20%, 95% 50%, 85% 100%)",
					}}
				/>
				{/* Right stall */}
				<div
					className="absolute bottom-0 right-[18%] w-[16%] h-[50%]"
					style={{
						background:
							"linear-gradient(to top, oklch(0.11 0.03 268 / 0.85), oklch(0.16 0.04 282 / 0.35))",
						clipPath:
							"polygon(0% 100%, 5% 40%, 25% 8%, 50% 0%, 75% 8%, 95% 40%, 100% 100%)",
					}}
				/>
				{/* Right structure */}
				<div
					className="absolute bottom-0 right-[3%] w-[14%] h-[65%]"
					style={{
						background:
							"linear-gradient(to top, oklch(0.1 0.03 262 / 0.9), oklch(0.15 0.04 278 / 0.4))",
						clipPath:
							"polygon(10% 100%, 0% 40%, 20% 12%, 50% 0%, 80% 12%, 100% 35%, 90% 100%)",
					}}
				/>
			</motion.div>

			{/* Layer 3: Lighting (radial gradient sources) */}
			{showLighting && (
				<motion.div
					className="absolute inset-0"
					style={{
						x: parallaxX * 0.7,
						y: parallaxY * 0.5,
					}}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
				>
					{/* Purple light source - left */}
					<div
						className="absolute left-[15%] bottom-[30%] w-40 h-40"
						style={{
							background:
								"radial-gradient(circle, oklch(0.5 0.25 265 / 0.25), transparent 70%)",
							filter: "blur(20px)",
							animation: "light-bloom 2s ease-out forwards",
						}}
					/>
					{/* Blue light source - center */}
					<div
						className="absolute left-[45%] bottom-[40%] w-56 h-56"
						style={{
							background:
								"radial-gradient(circle, oklch(0.55 0.15 285 / 0.2), transparent 70%)",
							filter: "blur(25px)",
							animation: "light-bloom 2s ease-out 0.3s forwards",
						}}
					/>
					{/* Green accent light - right */}
					<div
						className="absolute right-[15%] bottom-[25%] w-32 h-32"
						style={{
							background:
								"radial-gradient(circle, oklch(0.6 0.2 145 / 0.2), transparent 70%)",
							filter: "blur(18px)",
							animation: "light-bloom 2s ease-out 0.6s forwards",
						}}
					/>
				</motion.div>
			)}

			{/* Layer 4: Atmosphere (fog/mist) */}
			{showAtmosphere && (
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.4 }}
					transition={{ duration: 2, ease: "easeOut" }}
				>
					<div
						className="absolute inset-x-0 bottom-[10%] h-[30%]"
						style={{
							background:
								"linear-gradient(to top, oklch(0.15 0.03 265 / 0.4), transparent)",
							filter: "blur(30px)",
							animation: "mist-drift 12s ease-in-out infinite",
						}}
					/>
					<div
						className="absolute inset-x-0 bottom-[20%] h-[20%]"
						style={{
							background:
								"linear-gradient(to top, oklch(0.2 0.04 280 / 0.2), transparent)",
							filter: "blur(40px)",
							animation:
								"mist-drift 15s ease-in-out infinite reverse",
						}}
					/>
				</motion.div>
			)}

			{/* Layer 5: Ambient floating particles (high tier) */}
			{showParticles && (
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.7 }}
					transition={{ duration: 1.5, delay: 0.5 }}
				>
					{particleStyles.map((p, i) => (
						<div
							key={i}
							className="absolute rounded-full"
							style={{
								width: p.size,
								height: p.size,
								left: p.left,
								top: p.top,
								background:
									i % 3 === 0
										? "oklch(0.65 0.25 265 / 0.6)"
										: i % 3 === 1
											? "oklch(0.7 0.15 285 / 0.5)"
											: "oklch(0.75 0.2 145 / 0.4)",
								animation: `float ${p.duration}s ease-in-out infinite`,
								animationDelay: `${p.delay}s`,
							}}
						/>
					))}
				</motion.div>
			)}
		</div>
	);
}
