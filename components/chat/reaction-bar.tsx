'use client';

import { motion } from 'motion/react';
import type { Reaction } from '@/lib/types/message';
import { useMessageStore } from '@/store/message.store';

interface ReactionBarProps {
	reactions: Reaction[];
	messageId: string;
	channelId: string;
}

export function ReactionBar({ reactions, messageId, channelId }: ReactionBarProps) {
	const { addReaction, removeReaction } = useMessageStore();

	if (reactions.length === 0) return null;

	const handleReactionClick = (emoji: string, hasReacted: boolean) => {
		if (hasReacted) {
			removeReaction(channelId, messageId, emoji);
		} else {
			addReaction(channelId, messageId, emoji);
		}
	};

	return (
		<div className="flex flex-wrap gap-1 mt-1">
			{reactions.map((reaction) => (
				<motion.button
					key={reaction.emoji}
					onClick={() => handleReactionClick(reaction.emoji, reaction.hasReacted)}
					className={`
						flex items-center gap-1 px-2 py-0.5 rounded-full text-sm
						transition-all duration-200
						${
							reaction.hasReacted
								? 'bg-[oklch(0.35_0.08_250)] border border-[oklch(0.5_0.12_250)]'
								: 'bg-white/5 border border-white/10 hover:bg-white/10'
						}
					`}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
				>
					<span>{reaction.emoji}</span>
					<span
						className={`text-xs ${reaction.hasReacted ? 'text-[oklch(0.75_0.15_250)] font-medium' : 'text-white/60'}`}
					>
						{reaction.count}
					</span>
				</motion.button>
			))}
		</div>
	);
}
