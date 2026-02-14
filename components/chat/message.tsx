'use client';

import { motion } from 'motion/react';
import { useState, useMemo } from 'react';
import { Avatar } from '@/components/ui/avatar/avatar';
import { ReactionBar } from './reaction-bar';
import { EmojiPicker } from './emoji-picker';
import type { Message } from '@/lib/types/message';
import { parseMarkdown, renderMarkdown } from '@/lib/utils/markdown';
import { useMessageStore } from '@/store/message.store';
import { useAuthStore } from '@/store/auth.store';

interface MessageProps {
	message: Message;
	isGrouped: boolean;
	channelId: string;
}

export function Message({ message, isGrouped, channelId }: MessageProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editContent, setEditContent] = useState(message.content);
	const addReaction = useMessageStore((state) => state.addReaction);
	const editMessage = useMessageStore((state) => state.editMessage);
	const deleteMessage = useMessageStore((state) => state.deleteMessage);
	const currentUser = useAuthStore(state => state.user);

	const isOwnMessage = currentUser?.id === message.author.id;

	const handleAddReaction = (emoji: string) => {
		addReaction(channelId, message.id, emoji);
	};

	const handleEdit = () => {
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		if (editContent.trim() && editContent !== message.content) {
			editMessage(channelId, message.id, editContent.trim());
		}
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setEditContent(message.content);
		setIsEditing(false);
	};

	const handleDelete = () => {
		if (confirm('Delete this message?')) {
			deleteMessage(channelId, message.id);
		}
	};

	const formatTimestamp = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (seconds < 60) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	};

	const formatAbsoluteTime = (date: Date) => {
		return date.toLocaleString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// Memoize markdown parsing to avoid re-parsing on every render (performance optimization)
	const parsedContent = useMemo(() => parseMarkdown(message.content), [message.content]);

	return (
		<motion.div
			className={`group px-4 hover:bg-white/5 transition-colors ${isGrouped ? 'py-0.5' : 'py-3 mt-3'}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			<div className="flex gap-3">
				{/* Avatar (hidden when grouped) */}
				<div className={isGrouped ? 'w-10 shrink-0' : 'w-10 shrink-0'}>
					{!isGrouped && (
						<Avatar
							src={message.author.avatar}
							alt={message.author.displayName}
							fallback={message.author.displayName}
							size="md"
						/>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					{/* Header (hidden when grouped) */}
					{!isGrouped && (
						<div className="flex items-baseline gap-2 mb-1">
							<span
								className="font-semibold"
								style={{
									color: message.author.roleColor || 'white',
								}}
							>
								{message.author.displayName}
							</span>
							{message.author.isBot && (
								<span className="px-1.5 py-0.5 text-xs font-semibold rounded-sm bg-[oklch(0.35_0.08_250)] text-[oklch(0.75_0.15_250)]">
									BOT
								</span>
							)}
							<span
								className="text-xs text-white/40 cursor-default"
								title={formatAbsoluteTime(message.timestamp)}
							>
								{formatTimestamp(message.timestamp)}
							</span>
						</div>
					)}

					{/* Reply reference */}
					{message.replyTo && (
						<div className="flex items-center gap-2 mb-1 text-xs text-white/60">
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
							</svg>
							<span className="font-medium">{message.replyTo.author}</span>
							<span className="truncate max-w-xs">{message.replyTo.content}</span>
						</div>
					)}

					{/* Message content */}
					{isEditing ? (
						<div>
							<textarea
								value={editContent}
								onChange={(e) => setEditContent(e.target.value)}
								className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-white resize-none focus:outline-hidden focus:border-[oklch(0.5_0.12_250)]"
								rows={3}
								autoFocus
							/>
							<div className="flex gap-2 mt-2">
								<button
									onClick={handleSaveEdit}
									className="px-3 py-1 rounded-lg bg-[oklch(0.35_0.08_250)] text-white text-sm font-medium hover:bg-[oklch(0.4_0.1_250)] transition-colors"
								>
									Save
								</button>
								<button
									onClick={handleCancelEdit}
									className="px-3 py-1 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<>
							<div className="text-white/90 wrap-break-word">
								{renderMarkdown(parsedContent)}
							</div>

							{/* Edit indicator */}
							{message.editedAt && (
								<span className="text-xs text-white/40 ml-1">(edited)</span>
							)}

							{/* Attachments */}
							{message.attachments.length > 0 && (
								<div className="mt-2 space-y-2">
									{message.attachments.map((attachment) => (
										<div key={attachment.id} className="max-w-md">
											<img
												src={attachment.url}
												alt={attachment.filename}
												className="rounded-lg border border-white/10 max-h-80 object-contain"
												loading="lazy"
											/>
											<div className="text-xs text-white/60 mt-1">{attachment.filename}</div>
										</div>
									))}
								</div>
							)}

							{/* Reactions */}
							<ReactionBar
								reactions={message.reactions}
								messageId={message.id}
								channelId={channelId}
							/>
						</>
					)}
				</div>

				{/* Hover actions */}
				{isHovered && !isEditing && (
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="flex items-start gap-1 shrink-0"
					>
						<button
							onClick={() => setIsEmojiPickerOpen(true)}
							className="p-2 rounded-lg bg-[oklch(0.2_0.02_250)] hover:bg-border-dark transition-colors"
							title="Add reaction"
						>
							<svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</button>
						{isOwnMessage && (
							<>
								<button
									onClick={handleEdit}
									className="p-2 rounded-lg bg-[oklch(0.2_0.02_250)] hover:bg-border-dark transition-colors"
									title="Edit message"
								>
									<svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
								</button>
								<button
									onClick={handleDelete}
									className="p-2 rounded-lg bg-[oklch(0.2_0.02_250)] hover:bg-[oklch(0.3_0.05_0)] transition-colors"
									title="Delete message"
								>
									<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</>
						)}
					</motion.div>
				)}
			</div>

			{/* Emoji picker */}
			{isEmojiPickerOpen && (
				<div className="relative mt-2">
					<EmojiPicker
						isOpen={isEmojiPickerOpen}
						onClose={() => setIsEmojiPickerOpen(false)}
						onSelect={handleAddReaction}
					/>
				</div>
			)}
		</motion.div>
	);
}
