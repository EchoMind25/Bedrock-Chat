"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePointsStore } from "@/store/points.store";

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
}

/**
 * Mouse trail particle effect.
 * Renders via a full-screen canvas overlay.
 * Respects the user's presence trail settings.
 * Auto-disables after idle timeout.
 */
export function PresenceTrail() {
	const config = usePointsStore((s) => s.presenceTrail);
	const isEnabled = usePointsStore((s) => s.isEnabled);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const mouseRef = useRef({ x: 0, y: 0, moving: false });
	const rafRef = useRef<number>(0);
	const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const isActiveRef = useRef(true);

	const spawnParticle = useCallback(
		(x: number, y: number) => {
			const angle = Math.random() * Math.PI * 2;
			const speed = 0.3 + Math.random() * 0.7;
			const maxLife = 30 + Math.random() * 30; // frames

			particlesRef.current.push({
				x,
				y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: maxLife,
				maxLife,
				size: 1.5 + Math.random() * 2.5,
			});

			// Cap at 80 particles
			if (particlesRef.current.length > 80) {
				particlesRef.current.splice(
					0,
					particlesRef.current.length - 80,
				);
			}
		},
		[],
	);

	useEffect(() => {
		if (!config.enabled || !isEnabled) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Size canvas to viewport
		const resize = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		// Parse color
		const color = config.color || "#6B5CE7";
		const intensity = config.intensity ?? 0.5;

		// Mouse tracking
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current.x = e.clientX;
			mouseRef.current.y = e.clientY;
			mouseRef.current.moving = true;
			isActiveRef.current = true;

			// Reset idle timer
			if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
			idleTimerRef.current = setTimeout(() => {
				isActiveRef.current = false;
			}, (config.idleTimeout || 30) * 1000);

			// Spawn particles on move
			for (let i = 0; i < 2; i++) {
				spawnParticle(e.clientX, e.clientY);
			}
		};

		window.addEventListener("mousemove", handleMouseMove);

		// Animation loop
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			const particles = particlesRef.current;
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				p.vy += 0.01; // Slight gravity
				p.life--;

				if (p.life <= 0) {
					particles.splice(i, 1);
					continue;
				}

				const alpha = (p.life / p.maxLife) * intensity * 0.6;
				const size = p.size * (p.life / p.maxLife);

				ctx.beginPath();
				ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
				ctx.fillStyle = hexToRgba(color, alpha);
				ctx.fill();
			}

			rafRef.current = requestAnimationFrame(animate);
		};

		rafRef.current = requestAnimationFrame(animate);

		return () => {
			window.removeEventListener("resize", resize);
			window.removeEventListener("mousemove", handleMouseMove);
			cancelAnimationFrame(rafRef.current);
			if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
		};
	}, [config.enabled, config.color, config.intensity, config.idleTimeout, isEnabled, spawnParticle]);

	if (!config.enabled || !isEnabled) return null;

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 z-[55] pointer-events-none"
			aria-hidden="true"
		/>
	);
}

function hexToRgba(hex: string, alpha: number): string {
	// Handle oklch or other formats - fallback to purple
	if (!hex.startsWith("#")) {
		return `rgba(107, 92, 231, ${alpha})`;
	}

	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
