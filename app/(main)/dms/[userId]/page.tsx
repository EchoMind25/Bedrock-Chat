"use client";

import { use, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useDMStore } from "@/store/dm.store";
import { useAuthStore } from "@/store/auth.store";
import { useSettingsStore } from "@/store/settings.store";
import { useFriendsStore } from "@/store/friends.store";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { FriendProfileCard } from "@/components/friends/friend-profile-card";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Badge } from "@/components/ui/badge/badge";
import type { Message } from "@/lib/types/message";
import type { Friend } from "@/lib/types/friend";

// Stable empty array to prevent selector reference instability
const EMPTY_MESSAGES: Message[] = [];

interface PageProps {
	params: Promise<{
		userId: string;
	}>;
}

export default function DMPage({ params }: PageProps) {
	const { userId: rawUserId } = use(params);
	// Route param is `dm-<otherUserId>` from sidebar navigation.
	// Strip the prefix to get the actual user ID.
	const otherUserId = rawUserId.startsWith("dm-") ? rawUserId.slice(3) : rawUserId;

	const currentUser = useAuthStore((s) => s.user);
	const showAvatars = useSettingsStore((s) => s.settings?.show_avatars ?? true);
	const showTimestamps = useSettingsStore((s) => s.settings?.show_timestamps ?? true);

	const messagesRaw = useDMStore((s) => s.dmMessages[otherUserId]);
	const messages = messagesRaw ?? EMPTY_MESSAGES;
	const hasLoaded = messagesRaw !== undefined;

	const isLoading = useDMStore((s) => s.dmLoadingUsers[otherUserId] ?? false);
	const hasError = useDMStore((s) => s.dmLoadErrors[otherUserId] ?? false);

	// Get the DM conversation for the header
	const dm = useDMStore((s) => s.dms.find((d) => d.id === `dm-${otherUserId}`));
	const otherParticipant = dm?.participants.find((p) => p.userId === otherUserId);

	// Look up friend for profile card
	const friend = useFriendsStore(
		useCallback((s) => s.friends.find((f) => f.userId === otherUserId) ?? null, [otherUserId])
	);
	const [showProfileCard, setShowProfileCard] = useState(false);

	const handleProfileClick = useCallback(() => {
		if (friend) setShowProfileCard(true);
	}, [friend]);

	const bottomRef = useRef<HTMLDivElement>(null);
	const initializedRef = useRef<Set<string>>(new Set());

	// Load messages for this conversation
	useEffect(() => {
		if (initializedRef.current.has(otherUserId)) return;
		initializedRef.current.add(otherUserId);

		useDMStore.getState().loadDmMessages(otherUserId);

		return () => {
			initializedRef.current.delete(otherUserId);
		};
	}, [otherUserId]);

	// Mark conversation as read when viewing
	useEffect(() => {
		if (dm) {
			useDMStore.getState().markDmRead(dm.id);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dm?.id]);

	// Auto-scroll to bottom on new messages
	const lastMessageId = messages[messages.length - 1]?.id;
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [lastMessageId]);

	if (isLoading || !hasLoaded) {
		return (
			<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
				<DMHeaderDisplay name={otherParticipant?.displayName} avatar={otherParticipant?.avatar} status={otherParticipant?.status} onProfileClick={handleProfileClick} />
				<DMMessageSkeleton />
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
				<DMHeaderDisplay name={otherParticipant?.displayName} avatar={otherParticipant?.avatar} status={otherParticipant?.status} onProfileClick={handleProfileClick} />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center space-y-2">
						<h3 className="text-lg font-semibold text-white">Unable to load messages</h3>
						<p className="text-white/60 text-sm">Something went wrong. Check your connection and try again.</p>
						<button
							className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
							onClick={() => {
								initializedRef.current.delete(otherUserId);
								useDMStore.getState().loadDmMessages(otherUserId);
							}}
						>
							Try again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			{/* Header */}
			<DMHeaderDisplay name={otherParticipant?.displayName} avatar={otherParticipant?.avatar} status={otherParticipant?.status} onProfileClick={handleProfileClick} />

			{/* Messages */}
			<div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-1">
				{messages.length === 0 ? (
					<div className="flex-1 flex items-center justify-center h-full">
						<div className="text-center">
							<div className="text-6xl mb-4">💬</div>
							<h3 className="text-xl font-semibold text-white">
								{otherParticipant ? `Start a conversation with ${otherParticipant.displayName}` : "No messages yet"}
							</h3>
							<p className="text-white/60 mt-2">Messages are end-to-end encrypted.</p>
						</div>
					</div>
				) : (
					messages.map((msg, index) => {
						const prevMsg = messages[index - 1];
						const isGrouped =
							prevMsg &&
							prevMsg.author.id === msg.author.id &&
							msg.timestamp.getTime() - prevMsg.timestamp.getTime() < 300000;

						return (
							<DMMessageBubble
								key={msg.id}
								message={msg}
								isGrouped={isGrouped}
								isOwn={msg.author.id === currentUser?.id}
								showAvatars={showAvatars}
								showTimestamps={showTimestamps}
								onProfileClick={handleProfileClick}
							/>
						);
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<DMMessageInput
				otherUserId={otherUserId}
				otherName={otherParticipant?.displayName || "user"}
			/>

			{/* Friend profile card portal */}
			{showProfileCard && friend && typeof document !== "undefined" && createPortal(
				<AnimatePresence>
					{showProfileCard && (
						<motion.div
							key="dm-profile-overlay"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							className="fixed inset-0 z-[9998]"
						>
							<div
								className="absolute inset-0 bg-black/40"
								onClick={() => setShowProfileCard(false)}
							/>
							<div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
								<div className="pointer-events-auto">
									<FriendProfileCard
										friend={friend}
										onClose={() => setShowProfileCard(false)}
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body,
			)}
		</div>
	);
}

// --- Sub-components ---

function DMHeaderDisplay({
	name,
	avatar,
	status,
	onProfileClick,
}: {
	name?: string;
	avatar?: string;
	status?: string;
	onProfileClick?: () => void;
}) {
	const statusText =
		status === "online" ? "Online"
		: status === "idle" ? "Idle"
		: status === "dnd" ? "Do Not Disturb"
		: "Offline";

	return (
		<div className="h-12 px-4 flex items-center justify-between border-b border-white/10 bg-[oklch(0.15_0.02_250)] shrink-0">
			<div
				className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
				role="button"
				tabIndex={0}
				onClick={onProfileClick}
				onKeyDown={(e) => {
					if ((e.key === "Enter" || e.key === " ") && onProfileClick) {
						e.preventDefault();
						onProfileClick();
					}
				}}
			>
				<Avatar
					src={avatar || ""}
					fallback={(name || "DM").slice(0, 2)}
					status={
						status === "idle" ? "away"
						: status === "dnd" ? "busy"
						: (status as "online" | "offline") || "offline"
					}
					size="sm"
				/>
				<div className="flex flex-col">
					<h2 className="font-semibold text-white text-sm hover:underline">{name || "Direct Message"}</h2>
					<p className="text-xs text-white/50">{statusText}</p>
				</div>
			</div>

			<Badge variant="success" className="flex items-center gap-1.5">
				<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<title>Encrypted</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<span className="text-[10px]">E2E Encrypted</span>
			</Badge>
		</div>
	);
}

function DMMessageBubble({
	message,
	isGrouped,
	isOwn,
	showAvatars,
	showTimestamps,
	onProfileClick,
}: {
	message: Message;
	isGrouped: boolean;
	isOwn: boolean;
	showAvatars: boolean;
	showTimestamps: boolean;
	onProfileClick?: () => void;
}) {
	const formatTime = (date: Date) =>
		date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

	const clickable = !isOwn && onProfileClick;

	if (isGrouped) {
		return (
			<div className={`${showAvatars ? "pl-14" : "pl-0"} py-0.5 hover:bg-white/[0.02] rounded-sm`}>
				<p className="text-sm text-white/90">{message.content}</p>
			</div>
		);
	}

	return (
		<div className="flex gap-3 pt-2 pb-0.5 hover:bg-white/[0.02] rounded-sm">
			{showAvatars && (
				<div
					className={clickable ? "cursor-pointer rounded-full hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.12_250)] focus-visible:outline-hidden" : ""}
					role={clickable ? "button" : undefined}
					tabIndex={clickable ? 0 : undefined}
					onClick={clickable ? onProfileClick : undefined}
					onKeyDown={clickable ? (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							onProfileClick!();
						}
					} : undefined}
				>
					<Avatar
						src={message.author.avatar}
						fallback={message.author.displayName.slice(0, 2)}
						size="sm"
					/>
				</div>
			)}
			<div className="flex-1 min-w-0">
				<div className="flex items-baseline gap-2">
					<span
						className={`text-sm font-semibold ${isOwn ? "text-primary" : "text-white"} ${clickable ? "cursor-pointer hover:underline" : ""}`}
						role={clickable ? "button" : undefined}
						tabIndex={clickable ? 0 : undefined}
						onClick={clickable ? onProfileClick : undefined}
						onKeyDown={clickable ? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onProfileClick!();
							}
						} : undefined}
					>
						{message.author.displayName}
					</span>
					{showTimestamps && (
						<span className="text-[10px] text-white/40">{formatTime(message.timestamp)}</span>
					)}
				</div>
				<p className="text-sm text-white/90">{message.content}</p>
			</div>
		</div>
	);
}

const MAX_LENGTH = 2000;

function DMMessageInput({
	otherUserId,
	otherName,
}: {
	otherUserId: string;
	otherName: string;
}) {
	const [content, setContent] = useState("");
	const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	}, [content]);

	const handleSubmit = () => {
		if (!content.trim()) return;
		useDMStore.getState().sendDmMessage(otherUserId, content);
		setContent("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleEmojiSelect = (emoji: string) => {
		setContent((prev) => prev + emoji);
		textareaRef.current?.focus();
	};

	const remainingChars = MAX_LENGTH - content.length;
	const showCounter = content.length >= 1800;

	return (
		<div className="shrink-0 p-4">
			<div
				className="rounded-2xl relative"
				style={{
					backgroundColor: "oklch(0.18 0.02 250 / 0.7)",
					border: "1px solid oklch(0.25 0.02 285 / 0.5)",
				}}
			>
				<div className="flex items-end gap-2 p-3">
					<div className="flex-1 relative">
						<textarea
							ref={textareaRef}
							value={content}
							onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
							onKeyDown={handleKeyDown}
							placeholder={`Message @${otherName}`}
							className="w-full bg-transparent text-white placeholder:text-white/40 resize-none focus:outline-hidden scrollbar-thin max-h-[200px]"
							rows={1}
						/>
					</div>

					<div className="relative shrink-0">
						<button
							onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
							className="p-2 rounded-lg hover:bg-white/10 transition-colors"
							title="Add emoji"
						>
							<svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</button>

						<EmojiPicker
							isOpen={isEmojiPickerOpen}
							onClose={() => setIsEmojiPickerOpen(false)}
							onSelect={handleEmojiSelect}
							alignment="right"
						/>
					</div>
				</div>

				<div className="flex items-center justify-between px-4 pb-3 text-xs text-white/40">
					<span>Press Enter to send, Shift+Enter for newline</span>
					{showCounter && (
						<span className={remainingChars < 100 ? "text-red-400 font-medium" : ""}>
							{remainingChars} remaining
						</span>
					)}
				</div>
			</div>
		</div>
	);
}

function DMMessageSkeleton() {
	return (
		<div className="flex-1 p-4 space-y-4">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="flex gap-3 animate-pulse">
					<div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
					<div className="flex-1 space-y-2">
						<div className="h-3 w-24 bg-white/10 rounded-sm" />
						<div className="h-3 w-full max-w-xs bg-white/10 rounded-sm" />
					</div>
				</div>
			))}
		</div>
	);
}
