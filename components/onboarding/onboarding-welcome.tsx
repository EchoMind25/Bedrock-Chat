"use client";

import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button/button";

interface OnboardingWelcomeProps {
	onNext: () => void;
	onSkip: () => void;
}

/**
 * Step 1: Welcome message after first login.
 */
export function OnboardingWelcome({ onNext, onSkip }: OnboardingWelcomeProps) {
	const displayName = useAuthStore((s) => s.user?.displayName || "Explorer");

	return (
		<motion.div
			key="welcome"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
			className="text-center"
		>
			{/* Animated icon */}
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{
					type: "spring",
					stiffness: 200,
					damping: 15,
					delay: 0.1,
				}}
				className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
				style={{
					background:
						"linear-gradient(135deg, oklch(0.55 0.25 265 / 0.3), oklch(0.6 0.15 285 / 0.2))",
					border: "1px solid oklch(0.55 0.25 265 / 0.3)",
				}}
			>
				<svg
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="text-blue-400"
				>
					<path d="M12 2L2 7l10 5 10-5-10-5z" />
					<path d="M2 17l10 5 10-5" />
					<path d="M2 12l10 5 10-5" />
				</svg>
			</motion.div>

			<motion.h1
				className="text-2xl font-bold text-blue-400 mb-2"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
			>
				Welcome to Bedrock, {displayName}
			</motion.h1>

			<motion.p
				className="text-blue-300/60 mb-2"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3 }}
			>
				Your private, encrypted communication hub.
			</motion.p>

			<motion.div
				className="bg-white/5 rounded-lg p-4 mb-8 text-left space-y-2"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4 }}
			>
				<div className="flex items-center gap-3 text-sm text-blue-200/70">
					<span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="oklch(0.75 0.2 145)"
							strokeWidth="2"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</span>
					End-to-end encrypted conversations
				</div>
				<div className="flex items-center gap-3 text-sm text-blue-200/70">
					<span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="oklch(0.75 0.2 145)"
							strokeWidth="2"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</span>
					No government ID required
				</div>
				<div className="flex items-center gap-3 text-sm text-blue-200/70">
					<span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="oklch(0.75 0.2 145)"
							strokeWidth="2"
						>
							<path d="M20 6L9 17l-5-5" />
						</svg>
					</span>
					Your data stays yours
				</div>
			</motion.div>

			<motion.div
				className="space-y-3"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.5 }}
			>
				<Button
					variant="primary"
					size="lg"
					className="w-full"
					onClick={onNext}
				>
					Let&apos;s Set Up Your Profile
				</Button>
				<button
					type="button"
					onClick={onSkip}
					className="text-sm text-blue-300/40 hover:text-blue-300/60 transition-colors"
				>
					Skip setup for now
				</button>
			</motion.div>
		</motion.div>
	);
}
