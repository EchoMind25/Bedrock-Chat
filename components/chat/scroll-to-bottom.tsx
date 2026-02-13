'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface ScrollToBottomProps {
	scrollElement: HTMLElement | null;
	onClick: () => void;
}

export function ScrollToBottom({ scrollElement, onClick }: ScrollToBottomProps) {
	const [showButton, setShowButton] = useState(false);

	useEffect(() => {
		if (!scrollElement) return;

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = scrollElement;
			const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
			setShowButton(distanceFromBottom > 200);
		};

		scrollElement.addEventListener('scroll', handleScroll);
		handleScroll(); // Check initial state

		return () => scrollElement.removeEventListener('scroll', handleScroll);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Empty deps - effect should only run on mount/unmount, scrollElement is captured in closure

	return (
		<AnimatePresence>
			{showButton && (
				<motion.button
					initial={{ opacity: 0, scale: 0.8, y: 20 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.8, y: 20 }}
					transition={{ type: 'spring', stiffness: 400, damping: 25 }}
					onClick={onClick}
					className="absolute bottom-4 right-4 z-30 p-3 rounded-full shadow-2xl"
					style={{
						backgroundColor: 'oklch(0.35 0.08 250)',
						border: '1px solid oklch(0.5 0.12 250)',
					}}
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.95 }}
				>
					<svg
						className="w-6 h-6 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 14l-7 7m0 0l-7-7m7 7V3"
						/>
					</svg>
				</motion.button>
			)}
		</AnimatePresence>
	);
}
