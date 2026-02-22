"use client";

import { useEffect, useRef } from "react";
import { usePointsStore } from "@/store/points.store";
import { createKonamiDetector, isMidnight } from "@/lib/easter-eggs";

/**
 * Mounts global easter egg detectors. Renders nothing.
 * Place once in the app shell alongside SettingsEffects.
 */
export function EasterEggDetectors() {
	const discoverEasterEgg = usePointsStore((s) => s.discoverEasterEgg);

	// ── Konami Code ──────────────────────────────────────────
	useEffect(() => {
		const { handleKeyDown } = createKonamiDetector(() => {
			discoverEasterEgg("konami-code");
		});
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ── Midnight User ────────────────────────────────────────
	// Check once on mount and every 5 minutes
	useEffect(() => {
		const check = () => {
			if (isMidnight()) {
				discoverEasterEgg("midnight-user");
			}
		};
		check();
		const interval = setInterval(check, 5 * 60 * 1000);
		return () => clearInterval(interval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// ── Hidden Bedrock Layer (scroll to bottom of server list) ─
	useEffect(() => {
		const handleScroll = (e: Event) => {
			const target = e.target as HTMLElement;
			// Detect when server list nav is scrolled to the very bottom
			if (
				target.tagName === "NAV" &&
				target.getAttribute("aria-label") === "Servers"
			) {
				const atBottom =
					target.scrollHeight - (target.scrollTop + target.clientHeight) < 10;
				if (atBottom && target.scrollHeight > target.clientHeight) {
					discoverEasterEgg("hidden-bedrock");
				}
			}
		};
		document.addEventListener("scroll", handleScroll, true);
		return () => document.removeEventListener("scroll", handleScroll, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return null;
}
