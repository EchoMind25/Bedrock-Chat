'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ServerEmojiCategory } from './emoji-picker/server-emoji-category';

interface EmojiPickerProps {
	onSelect: (emoji: string) => void;
	isOpen: boolean;
	onClose: () => void;
	alignment?: "left" | "right";
}

const EMOJI_CATEGORIES = {
	'Server': [],  // Custom server emojis - rendered separately
	'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙'],
	'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌'],
	'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
	'Reactions': ['🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
	'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '✨', '⚡', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤'],
	'Fun': ['🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🍪', '🍩', '🍕', '🍔', '🌮', '🌯', '🥙', '🍿', '🥤', '🍻', '🎮', '🎯'],
};

export function EmojiPicker({ onSelect, isOpen, onClose, alignment = "left" }: EmojiPickerProps) {
	const [activeCategory, setActiveCategory] = useState('Server');

	const handleSelect = (emoji: string) => {
		onSelect(emoji);
		onClose();
	};

	const isServerCategory = activeCategory === 'Server';

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 z-40"
						onClick={onClose}
					/>

					{/* Picker */}
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 10 }}
						transition={{ type: 'spring', stiffness: 400, damping: 25 }}
						className={`absolute bottom-full ${alignment === "right" ? "right-0" : "left-0"} mb-2 z-50 w-80 rounded-2xl overflow-hidden`}
						style={{
							backgroundColor: 'oklch(0.15 0.02 250 / 0.95)',
							border: '1px solid oklch(0.25 0.02 285 / 0.5)',
							backdropFilter: 'blur(20px)',
							boxShadow: '0 20px 60px oklch(0 0 0 / 0.5)',
						}}
					>
						{/* Categories */}
						<div className="flex gap-1 p-2 border-b border-white/10 overflow-x-auto scrollbar-thin">
							{Object.keys(EMOJI_CATEGORIES).map((category) => (
								<button
									key={category}
									onClick={() => setActiveCategory(category)}
									className={`
										px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
										${
											activeCategory === category
												? 'bg-white/20 text-white'
												: 'text-white/60 hover:bg-white/10 hover:text-white'
										}
									`}
								>
									{category}
								</button>
							))}
						</div>

						{/* Content */}
						<div className="max-h-60 overflow-y-auto scrollbar-thin">
							{isServerCategory ? (
								<ServerEmojiCategory onSelect={handleSelect} />
							) : (
								<div className="p-2 grid grid-cols-8 gap-1">
									{EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, i) => (
										<motion.button
											key={`${emoji}-${i}`}
											onClick={() => handleSelect(emoji)}
											className="aspect-square flex items-center justify-center text-2xl rounded-lg hover:bg-white/10 transition-colors"
											whileHover={{ scale: 1.2 }}
											whileTap={{ scale: 0.9 }}
										>
											{emoji}
										</motion.button>
									))}
								</div>
							)}
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
