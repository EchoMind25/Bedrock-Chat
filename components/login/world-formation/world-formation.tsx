"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPerformanceTier } from "@/lib/utils/webgl";
import { INTRO_TIMELINE } from "@/lib/utils/intro-animations";
import type { IntroPreference } from "@/store/onboarding.store";
import { EnvironmentLayers } from "./environment-layers";
import { ParticleCoalesce } from "./particle-coalesce";
import { PortalReveal } from "./portal-reveal";
import { WorldFormationLow } from "./world-formation-low";

export type WorldFormationStage =
	| "idle"
	| "stage1"
	| "stage2"
	| "stage3"
	| "complete";

interface WorldFormationProps {
	preference: IntroPreference;
	onComplete: () => void;
}

/**
 * Master orchestrator for the immersive world formation animation.
 * Manages stage progression and dispatches to tier-specific sub-components.
 */
export function WorldFormation({
	preference,
	onComplete,
}: WorldFormationProps) {
	const [stage, setStage] = useState<WorldFormationStage>("idle");
	const [mounted, setMounted] = useState(false);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const completedRef = useRef(false);

	const tier = useMemo(() => {
		if (typeof window === "undefined") return "low";
		return getPerformanceTier();
	}, []);

	// SSR safety
	useEffect(() => {
		setMounted(true);
	}, []);

	// Complete handler (prevents double-fire)
	const handleComplete = () => {
		if (completedRef.current) return;
		completedRef.current = true;
		setStage("complete");
		// Clear any pending timers
		for (const t of timersRef.current) clearTimeout(t);
		timersRef.current = [];
		onComplete();
	};

	// Stage progression
	useEffect(() => {
		if (!mounted) return;

		if (preference === "skip") {
			handleComplete();
			return;
		}

		const timeline =
			preference === "condensed"
				? INTRO_TIMELINE.condensed
				: INTRO_TIMELINE.full;

		// Adjust for low tier (faster)
		const timeScale = tier === "low" ? 0.5 : 1;

		setStage("stage1");

		const t1 = setTimeout(
			() => setStage("stage2"),
			(timeline.stage2Start ?? 0) * timeScale,
		);
		const t2 = setTimeout(
			() => setStage("stage3"),
			(timeline.stage3Start ?? 0) * timeScale,
		);
		const t3 = setTimeout(
			() => handleComplete(),
			timeline.total * timeScale,
		);

		timersRef.current = [t1, t2, t3];

		return () => {
			for (const t of timersRef.current) clearTimeout(t);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mounted, preference, tier]);

	// Escape key to skip
	useEffect(() => {
		if (completedRef.current) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleComplete();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (!mounted) return null;

	return (
		<div className="fixed inset-0 z-0" aria-hidden="true">
			{/* Base black background */}
			<div className="absolute inset-0 bg-black" />

			{tier === "low" ? (
				<WorldFormationLow stage={stage} />
			) : (
				<>
					{/* Canvas particles (high tier only) */}
					{tier === "high" && <ParticleCoalesce stage={stage} />}

					{/* CSS environment layers */}
					<EnvironmentLayers stage={stage} tier={tier} />

					{/* Portal reveal (medium + high) */}
					<PortalReveal stage={stage} />
				</>
			)}
		</div>
	);
}
