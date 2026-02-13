"use client";

import { useEffect, useState } from "react";

const IDLE_TIMEOUT = 30_000; // 30 seconds

const ACTIVITY_EVENTS = [
	"mousemove",
	"mousedown",
	"keydown",
	"touchstart",
	"scroll",
] as const;

/**
 * Detects when user is idle (no interaction for 30s).
 * Returns true when idle, false when active.
 *
 * CSS animations are paused via html.idle class.
 * Motion animations can check this to skip expensive effects.
 */
export function useIdleDetection(): boolean {
	const [isIdle, setIsIdle] = useState(false);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;

		const resetTimer = () => {
			setIsIdle(false);
			clearTimeout(timeout);
			timeout = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
		};

		for (const event of ACTIVITY_EVENTS) {
			window.addEventListener(event, resetTimer, { passive: true });
		}

		// Start initial timeout
		timeout = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);

		return () => {
			clearTimeout(timeout);
			for (const event of ACTIVITY_EVENTS) {
				window.removeEventListener(event, resetTimer);
			}
		};
	}, []);

	return isIdle;
}
