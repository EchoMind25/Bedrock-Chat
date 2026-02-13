"use client";

import { useEffect, useRef } from "react";
import { PARTICLE_COLORS } from "@/lib/utils/intro-animations";
import type { WorldFormationStage } from "./world-formation";

interface ParticleCoalesceProps {
	stage: WorldFormationStage;
}

interface Particle {
	x: number;
	y: number;
	targetX: number;
	targetY: number;
	vx: number;
	vy: number;
	size: number;
	color: string;
	alpha: number;
	settled: boolean;
}

// Logo anchor points forming a "B" shape (normalized 0-1 coordinates)
const LOGO_POINTS: [number, number][] = [
	// Vertical bar
	[0.35, 0.15], [0.35, 0.25], [0.35, 0.35], [0.35, 0.45],
	[0.35, 0.55], [0.35, 0.65], [0.35, 0.75], [0.35, 0.85],
	// Top bump
	[0.42, 0.15], [0.5, 0.12], [0.58, 0.15], [0.62, 0.22],
	[0.6, 0.3], [0.55, 0.35], [0.48, 0.38], [0.42, 0.4],
	// Bottom bump (bigger)
	[0.42, 0.5], [0.5, 0.48], [0.58, 0.5], [0.65, 0.55],
	[0.68, 0.63], [0.65, 0.72], [0.58, 0.78], [0.5, 0.82],
	[0.42, 0.85],
	// Fill points
	[0.45, 0.2], [0.52, 0.2], [0.55, 0.25], [0.5, 0.3],
	[0.45, 0.55], [0.52, 0.55], [0.58, 0.6], [0.6, 0.65],
	[0.55, 0.7], [0.5, 0.75], [0.45, 0.7], [0.48, 0.62],
];

const PARTICLE_COUNT = 150;
const SPRING_STIFFNESS = 0.03;
const SPRING_DAMPING = 0.85;
const BURST_SPEED = 8;

/**
 * Canvas-based particle system where particles converge into the Bedrock logo.
 * High-tier only. Uses requestAnimationFrame with spring physics.
 */
export function ParticleCoalesce({ stage }: ParticleCoalesceProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const frameRef = useRef<number>(0);
	const stageRef = useRef<WorldFormationStage>(stage);

	// Keep stageRef in sync
	useEffect(() => {
		stageRef.current = stage;
	}, [stage]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const resize = () => {
			const dpr = window.devicePixelRatio || 1;
			canvas.width = window.innerWidth * dpr;
			canvas.height = window.innerHeight * dpr;
			canvas.style.width = `${window.innerWidth}px`;
			canvas.style.height = `${window.innerHeight}px`;
			ctx.scale(dpr, dpr);
		};

		resize();
		window.addEventListener("resize", resize);

		const w = window.innerWidth;
		const h = window.innerHeight;

		// Logo render area (centered, scaled)
		const logoSize = Math.min(w, h) * 0.25;
		const logoX = w / 2 - logoSize / 2;
		const logoY = h / 2 - logoSize / 2;

		// Initialize particles
		const particles: Particle[] = [];
		for (let i = 0; i < PARTICLE_COUNT; i++) {
			const point = LOGO_POINTS[i % LOGO_POINTS.length];
			const color =
				PARTICLE_COLORS[i % PARTICLE_COLORS.length];
			particles.push({
				x: Math.random() * w,
				y: Math.random() * h,
				targetX: logoX + point[0] * logoSize,
				targetY: logoY + point[1] * logoSize,
				vx: (Math.random() - 0.5) * 4,
				vy: (Math.random() - 0.5) * 4,
				size: 1.5 + Math.random() * 2.5,
				color,
				alpha: 0.3 + Math.random() * 0.7,
				settled: false,
			});
		}
		particlesRef.current = particles;

		const animate = () => {
			const currentStage = stageRef.current;
			ctx.clearRect(0, 0, w, h);

			for (const p of particles) {
				if (currentStage === "stage1") {
					// Converge to logo positions
					const dx = p.targetX - p.x;
					const dy = p.targetY - p.y;
					p.vx += dx * SPRING_STIFFNESS;
					p.vy += dy * SPRING_STIFFNESS;
					p.vx *= SPRING_DAMPING;
					p.vy *= SPRING_DAMPING;
					p.x += p.vx;
					p.y += p.vy;

					const dist = Math.sqrt(dx * dx + dy * dy);
					p.settled = dist < 2;
				} else if (currentStage === "stage2") {
					// Gentle float around target
					if (!p.settled) {
						const dx = p.targetX - p.x;
						const dy = p.targetY - p.y;
						p.vx += dx * 0.05;
						p.vy += dy * 0.05;
						p.vx *= 0.9;
						p.vy *= 0.9;
						p.x += p.vx;
						p.y += p.vy;
					} else {
						p.x =
							p.targetX + Math.sin(Date.now() * 0.002 + p.targetX) * 2;
						p.y =
							p.targetY + Math.cos(Date.now() * 0.002 + p.targetY) * 2;
					}
				} else if (currentStage === "stage3" || currentStage === "complete") {
					// Burst outward
					if (p.settled) {
						const angle = Math.random() * Math.PI * 2;
						p.vx = Math.cos(angle) * BURST_SPEED * (0.5 + Math.random());
						p.vy = Math.sin(angle) * BURST_SPEED * (0.5 + Math.random());
						p.settled = false;
					}
					p.x += p.vx;
					p.y += p.vy;
					p.vx *= 0.98;
					p.vy *= 0.98;
					p.alpha *= 0.97;
				}

				// Draw particle
				if (p.alpha > 0.01) {
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
					ctx.fillStyle = p.color;
					ctx.globalAlpha = p.alpha;
					ctx.fill();

					// Glow effect
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
					ctx.fillStyle = p.color;
					ctx.globalAlpha = p.alpha * 0.2;
					ctx.fill();
				}
			}

			ctx.globalAlpha = 1;
			frameRef.current = requestAnimationFrame(animate);
		};

		frameRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(frameRef.current);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 pointer-events-none"
			aria-hidden="true"
		/>
	);
}
