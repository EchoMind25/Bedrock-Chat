"use client";

import { motion } from "motion/react";

interface SkipIntroButtonProps {
	onSkip: () => void;
}

/**
 * Fixed-position skip button shown during the world formation intro.
 * Always accessible, fades in after 1 second.
 */
export function SkipIntroButton({ onSkip }: SkipIntroButtonProps) {
	return (
		<motion.button
			className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 text-sm text-white/40 hover:text-white/80 transition-colors rounded-lg hover:bg-white/5"
			onClick={onSkip}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 1, duration: 0.5 }}
			aria-label="Skip intro animation"
		>
			Skip intro
			<kbd className="text-xs border border-white/20 rounded-sm px-1.5 py-0.5 font-mono">
				Esc
			</kbd>
		</motion.button>
	);
}
