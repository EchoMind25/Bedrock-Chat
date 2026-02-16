'use client';

import { motion } from 'motion/react';
import { useState, useMemo, useCallback } from 'react';
import { Avatar } from '@/components/ui/avatar/avatar';
import type { AvatarStatus } from '@/components/ui/avatar/avatar';
import { ReactionBar } from './reaction-bar';
import { EmojiPicker } from './emoji-picker';
import { ReportDialog } from './report-dialog';
import type { Message } from '@/lib/types/message';
import { parseMarkdown, renderMarkdown } from '@/lib/utils/markdown';
import { useMessageStore } from '@/store/message.store';
import { usePresenceStore } from '@/store/presence.store';
import { useAuthStore } from '@/store/auth.store';
import { useServerStore } from '@/store/server.store';

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
	const [isReportOpen, setIsReportOpen] = useState(false);
	const addReaction = useMessageStore((state) => state.addReaction);
	const editMessage = useMessageStore((state) => state.editMessage);
	const deleteMessage = useMessageStore((state) => state.deleteMessage);
	const currentUser = useAuthStore(state => state.user);
	const currentServerId = useServerStore((state) => state.currentServerId);

	// Presence-aware status: only re-renders when THIS author's status changes
	const authorPresenceStatus = usePresenceStore(
		useCallback((s) => {
			const presence = s.onlineUsers.get(message.author.id);
			if (!presence) return undefined;
			const statusMap: Record<string, AvatarStatus> = {
				online: "online", idle: "away", dnd: "busy", offline: "offline",
			};
			return statusMap[presence.status] ?? undefined;
		}, [message.author.id])
	);

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
							status={authorPresenceStatus}
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
									{message.attachments.map((attachment) => {
										const isImage = attachment.contentType?.startsWith('image/');
										const isVideo = attachment.contentType?.startsWith('video/');

										if (isImage) {
											return (
												<div key={attachment.id} className="max-w-md">
													<img
														src={attachment.url}
														alt={attachment.filename}
														className="rounded-lg border border-white/10 max-h-80 object-contain"
														loading="lazy"
													/>
													<div className="text-xs text-white/60 mt-1">{attachment.filename}</div>
												</div>
											);
										}

										if (isVideo) {
											return (
												<div key={attachment.id} className="max-w-md">
													<video
														src={attachment.url}
														controls
														className="rounded-lg border border-white/10 max-h-80"
														preload="metadata"
													/>
													<div className="text-xs text-white/60 mt-1">{attachment.filename}</div>
												</div>
											);
										}

										// PDF, text, or other document
										return (
											<a
												key={attachment.id}
												href={attachment.url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-3 p-3 rounded-lg max-w-sm hover:brightness-110 transition-all"
												style={{
													backgroundColor: 'oklch(0.15 0.02 250 / 0.6)',
													border: '1px solid oklch(0.25 0.02 285 / 0.4)',
												}}
											>
												<svg className="w-8 h-8 text-white/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
														d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
												</svg>
												<div className="min-w-0">
													<div className="text-sm text-[oklch(0.7_0.15_250)] truncate">{attachment.filename}</div>
													<div className="text-xs text-white/40">
														{attachment.size < 1024 * 1024
															? `${(attachment.size / 1024).toFixed(1)} KB`
															: `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`}
													</div>
												</div>
												<svg className="w-4 h-4 text-white/40 shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
												</svg>
											</a>
										);
									})}
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
						{!isOwnMessage && (
							<button
								onClick={() => setIsReportOpen(true)}
								className="p-2 rounded-lg bg-[oklch(0.2_0.02_250)] hover:bg-[oklch(0.3_0.05_0)] transition-colors"
								title="Report message"
							>
								<svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
								</svg>
							</button>
						)}
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

			{/* Report dialog */}
			{isReportOpen && currentServerId && (
				<ReportDialog
					messageId={message.id}
					channelId={channelId}
					serverId={currentServerId}
					messageContent={message.content}
					messageAuthorId={message.author.id}
					isOpen={isReportOpen}
					onClose={() => setIsReportOpen(false)}
				/>
			)}
		</motion.div>
	);
}
