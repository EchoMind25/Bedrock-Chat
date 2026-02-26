'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar/avatar';
import type { AvatarStatus } from '@/components/ui/avatar/avatar';
import { ReactionBar } from './reaction-bar';
import { EmojiPicker } from './emoji-picker';
import { ReportDialog } from './report-dialog';
import { UserProfileCard } from '@/components/user-profile-card';
import { ContextMenu } from '@/components/ui/context-menu/context-menu';
import type { ContextMenuEntry } from '@/components/ui/context-menu/context-menu';
import type { Message } from '@/lib/types/message';
import { parseMarkdown, renderMarkdown } from '@/lib/utils/markdown';
import { useMessageStore } from '@/store/message.store';
import { usePresenceStore } from '@/store/presence.store';
import { useAuthStore } from '@/store/auth.store';
import { useServerStore } from '@/store/server.store';
import { useSettingsStore } from '@/store/settings.store';
import { useThemeStore } from '@/store/theme.store';
import { useMemberStore } from '@/store/member.store';
import type { MemberWithProfile } from '@/store/member.store';
import { useServerEmojiStore } from '@/store/server-emoji.store';

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
	const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
	const addReaction = useMessageStore((state) => state.addReaction);
	const editMessage = useMessageStore((state) => state.editMessage);
	const deleteMessage = useMessageStore((state) => state.deleteMessage);
	const currentUser = useAuthStore(state => state.user);
	const currentServerId = useServerStore((state) => state.currentServerId);
	const showAvatars = useSettingsStore((state) => state.settings?.show_avatars ?? true);
	const showTimestamps = useSettingsStore((state) => state.settings?.show_timestamps ?? true);
	const timestampFormat = useSettingsStore((state) => state.settings?.timestamp_format ?? "relative");
	const rawMessageStyle = useSettingsStore((state) => state.settings?.message_style ?? "flat");
	const overrideMode = useThemeStore((s) => s.preferences.overrideMode);
	// In server channels, only apply personal message style when user chose "Force personal theme"
	const effectiveStyle = overrideMode === "force_personal" ? rawMessageStyle : "flat";
	const isBubble = effectiveStyle === "bubble";
	const isMinimal = effectiveStyle === "minimal";

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

	const getServerEmojis = useServerEmojiStore((s) => s.getServerEmojis);

	const isOwnMessage = currentUser?.id === message.author.id;

	// Check if user has moderation privileges (server role or platform role)
	const currentUserPlatformRole = useAuthStore((s) => s.user?.platformRole);
	const currentUserServerRole = useMemberStore(
		useCallback((s) => {
			if (!currentServerId) return undefined;
			const members = s.membersByServer[currentServerId];
			if (!members || !currentUser) return undefined;
			const member = members.find((m) => m.userId === currentUser.id);
			return member?.role;
		}, [currentServerId, currentUser])
	);

	const canDelete = isOwnMessage
		|| currentUserServerRole === "owner"
		|| currentUserServerRole === "admin"
		|| currentUserServerRole === "moderator"
		|| currentUserPlatformRole === "super_admin";

	const handleAuthorClick = async () => {
		if (message.author.isBot || !currentServerId) return;

		const store = useMemberStore.getState();
		let members = store.membersByServer[currentServerId];

		// Load members if they haven't been fetched yet
		if (!members || members.length === 0) {
			await store.loadMembers(currentServerId);
			members = useMemberStore.getState().membersByServer[currentServerId];
		}

		const member = members?.find((m) => m.userId === message.author.id);
		if (member) {
			setSelectedMember(member);
		}
	};

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
		const prompt = isOwnMessage
			? 'Delete this message?'
			: `Delete this message from ${message.author.displayName}?`;
		if (confirm(prompt)) {
			deleteMessage(channelId, message.id);
		}
	};

	const handleContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY });
	}, []);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	// Build context menu items (cheap to compute, no useMemo needed)
	const contextMenuItems: ContextMenuEntry[] = [];

	contextMenuItems.push({
		id: "add-reaction",
		label: "Add Reaction",
		icon: (
			<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		),
		onClick: () => setIsEmojiPickerOpen(true),
	});

	if (isOwnMessage) {
		contextMenuItems.push({
			id: "edit",
			label: "Edit Message",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			),
			onClick: handleEdit,
		});
	}

	contextMenuItems.push(
		{ id: "divider-1", type: "divider" },
		{
			id: "copy-text",
			label: "Copy Text",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
				</svg>
			),
			onClick: () => {
				navigator.clipboard.writeText(message.content);
			},
		},
		{
			id: "copy-id",
			label: "Copy Message ID",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
				</svg>
			),
			onClick: () => {
				navigator.clipboard.writeText(message.id);
			},
		},
	);

	if (!isOwnMessage) {
		contextMenuItems.push(
			{ id: "divider-2", type: "divider" },
			{
				id: "report",
				label: "Report Message",
				icon: (
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
					</svg>
				),
				variant: "danger" as const,
				onClick: () => setIsReportOpen(true),
			},
		);
	}

	if (canDelete) {
		// Add divider before delete if we haven't added one via report
		if (isOwnMessage) {
			contextMenuItems.push({ id: "divider-3", type: "divider" });
		}
		contextMenuItems.push({
			id: "delete",
			label: "Delete Message",
			icon: (
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			),
			variant: "danger" as const,
			onClick: handleDelete,
		});
	}

	const formatTimestamp = (date: Date) => {
		switch (timestampFormat) {
			case "12h":
				return date.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				});
			case "24h":
				return date.toLocaleTimeString('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false,
				});
			case "full": {
				const now = new Date();
				const isToday = date.toDateString() === now.toDateString();
				const yesterday = new Date(now);
				yesterday.setDate(yesterday.getDate() - 1);
				const isYesterday = date.toDateString() === yesterday.toDateString();
				const time = date.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				});
				if (isToday) return `Today at ${time}`;
				if (isYesterday) return `Yesterday at ${time}`;
				return `${date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} ${time}`;
			}
			default: {
				// "relative" format
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
			}
		}
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

	// Build custom emoji URL map for the current server
	const emojiMap = useMemo(() => {
		if (!currentServerId) return undefined;
		const emojis = getServerEmojis(currentServerId);
		if (emojis.length === 0) return undefined;
		const map = new Map<string, string>();
		for (const emoji of emojis) {
			map.set(emoji.id, emoji.imageUrl);
		}
		return map;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentServerId, getServerEmojis]);

	return (
		<motion.div
			className={cn(
				"group hover:bg-white/5 transition-colors",
				isGrouped ? "py-0.5" : "py-3 mt-3",
				isBubble ? "px-3" : "px-4",
				isMinimal && !isGrouped && "py-1.5 mt-1",
				isMinimal && isGrouped && "py-0",
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onContextMenu={handleContextMenu}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
		>
			<div className={cn(
				"flex gap-3",
				isBubble && isOwnMessage && "justify-end",
			)}>
				{/* Avatar (hidden when grouped, when showAvatars is off, or in bubble mode) */}
				{showAvatars && !isBubble && (
					<div className="w-10 shrink-0">
						{!isGrouped && (
							<div
								role="button"
								tabIndex={0}
								onClick={handleAuthorClick}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleAuthorClick();
									}
								}}
								className="cursor-pointer rounded-full hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.12_250)] focus-visible:outline-hidden"
							>
								<Avatar
									src={message.author.avatar}
									alt={message.author.displayName}
									fallback={message.author.displayName}
									size="md"
									status={authorPresenceStatus}
								/>
							</div>
						)}
					</div>
				)}

				{/* Content */}
				<div className={cn(
					"min-w-0",
					isBubble ? "max-w-[80%]" : "flex-1",
				)}>
					{/* Header (hidden when grouped; in bubble mode only show username for others) */}
					{!isGrouped && !isBubble && (
						<div className="flex items-baseline gap-2 mb-1">
							<span
								className="font-semibold cursor-pointer hover:underline"
								role="button"
								tabIndex={0}
								onClick={handleAuthorClick}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleAuthorClick();
									}
								}}
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
							{showTimestamps && (
								<span
									className="text-xs text-white/40 cursor-default"
									title={formatAbsoluteTime(message.timestamp)}
								>
									{formatTimestamp(message.timestamp)}
								</span>
							)}
						</div>
					)}
					{/* Bubble mode: show sender name for non-own, non-grouped messages */}
					{!isGrouped && isBubble && !isOwnMessage && (
						<span
							className="text-xs font-semibold mb-0.5 block cursor-pointer hover:underline"
							role="button"
							tabIndex={0}
							onClick={handleAuthorClick}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleAuthorClick();
								}
							}}
							style={{ color: message.author.roleColor || 'oklch(0.7 0.15 250)' }}
						>
							{message.author.displayName}
						</span>
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
							<div
								className={cn(
									"message-content-wrapper text-white/90 break-words whitespace-pre-wrap",
									isOwnMessage && "own-message",
									isBubble && "rounded-2xl px-3.5 py-2 w-fit",
									isMinimal && "py-0.5",
								)}
								style={{
									fontSize: 'var(--message-font-size)',
									lineHeight: 'var(--message-line-height)',
									...(isBubble ? {
										backgroundColor: isOwnMessage
											? 'var(--bubble-color-sent, oklch(0.55 0.20 265))'
											: 'var(--bubble-color-received, oklch(0.30 0.04 250))',
										color: isOwnMessage ? 'white' : 'oklch(0.92 0.01 250)',
									} : {}),
								}}
							>
								{renderMarkdown(parsedContent, emojiMap)}
							</div>

							{/* Edit indicator */}
							{message.editedAt && (
								<span className={cn(
									"text-xs text-white/40 ml-1",
									isBubble && isOwnMessage && "text-right block mr-1",
								)}>(edited)</span>
							)}

							{/* Attachments */}
							{message.attachments.length > 0 && (
								<div className="mt-2 space-y-2">
									{message.attachments.map((attachment) => {
										const isImage = attachment.contentType?.startsWith('image/');
										const isVideo = attachment.contentType?.startsWith('video/');

										if (isImage && attachment.url) {
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

							{/* Bubble mode: timestamp below the message */}
							{isBubble && showTimestamps && !isGrouped && (
								<span
									className={cn(
										"text-xs text-white/40 mt-0.5 block",
										isOwnMessage && "text-right",
									)}
									title={formatAbsoluteTime(message.timestamp)}
								>
									{formatTimestamp(message.timestamp)}
								</span>
							)}
						</>
					)}
				</div>

				{/* Hover quick action: emoji reaction */}
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
					</motion.div>
				)}
			</div>

			{/* Right-click context menu */}
			{contextMenu && (
				<ContextMenu
					items={contextMenuItems}
					position={contextMenu}
					isOpen={true}
					onClose={handleCloseContextMenu}
				/>
			)}

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

			{/* User profile card */}
			{selectedMember && currentServerId && typeof document !== "undefined" && createPortal(
				<AnimatePresence>
					{selectedMember && (
						<motion.div
							key="message-profile-overlay"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							className="fixed inset-0 z-[9998]"
						>
							<div
								className="absolute inset-0 bg-black/40"
								onClick={() => setSelectedMember(null)}
							/>
							<div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
								<div className="pointer-events-auto">
									<UserProfileCard
										member={selectedMember}
										serverId={currentServerId}
										onClose={() => setSelectedMember(null)}
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body,
			)}
		</motion.div>
	);
}
