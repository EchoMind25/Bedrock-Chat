'use client';

import { motion } from 'motion/react';

interface TypingIndicatorProps {
	usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
	if (usernames.length === 0) return null;

	const displayText = (() => {
		if (usernames.length === 1) {
			return `${usernames[0]} is typing...`;
		}
		if (usernames.length === 2) {
			return `${usernames[0]} and ${usernames[1]} are typing...`;
		}
		return `${usernames.length} people are typing...`;
	})();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			className="absolute bottom-0 left-0 right-0 px-4 py-2"
			style={{
				backgroundColor: 'oklch(0.12 0.02 250 / 0.8)',
				backdropFilter: 'blur(10px)',
				borderTop: '1px solid oklch(0.25 0.02 285 / 0.3)',
			}}
		>
			<div className="flex items-center gap-2 text-sm text-white/70">
				<div className="flex gap-1">
					{[0, 1, 2].map((i) => (
						<motion.div
							key={i}
							className="w-2 h-2 rounded-full bg-white/50"
							animate={{
								scale: [1, 1.2, 1],
								opacity: [0.5, 1, 0.5],
							}}
							transition={{
								duration: 1.2,
								repeat: Number.POSITIVE_INFINITY,
								delay: i * 0.2,
								ease: 'easeInOut',
							}}
						/>
					))}
				</div>
				<span>{displayText}</span>
			</div>
		</motion.div>
	);
}
