"use client";

import type { Channel, VoiceUser } from "@/lib/types/server";
import { useServerStore } from "@/store/server.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/avatar/avatar";

interface ChannelItemProps {
	channel: Channel;
	isActive: boolean;
}

export function ChannelItem({ channel, isActive }: ChannelItemProps) {
	const router = useRouter();
	const setCurrentChannel = useServerStore((s) => s.setCurrentChannel);
	const currentServerId = useServerStore((s) => s.currentServerId);
	const openChannelSettings = useServerManagementStore((s) => s.openChannelSettings);

	const getChannelIcon = () => {
		switch (channel.type) {
			case "text":
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Text Channel</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
						/>
					</svg>
				);
			case "voice":
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Voice Channel</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
						/>
					</svg>
				);
			case "announcement":
				return (
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Announcement Channel</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
						/>
					</svg>
				);
			default:
				return null;
		}
	};

	const hasUnread = channel.unreadCount > 0;
	const isVoice = channel.type === "voice";
	const hasConnectedUsers =
		isVoice && channel.connectedUsers && channel.connectedUsers.length > 0;

	const handleChannelClick = () => {
		setCurrentChannel(channel.id);

		// Navigate to voice channel page if it's a voice channel
		if (isVoice && currentServerId) {
			router.push(`/channels/${currentServerId}/voice/${channel.id}`);
		}
	};

	return (
		<div>
			<motion.button
				type="button"
				onClick={handleChannelClick}
				className={cn(
					"w-full px-2 py-3 md:py-1.5 mx-1 min-h-[44px] md:min-h-0 rounded flex items-center gap-2 text-sm transition-colors group touch-manipulation",
					isActive
						? "bg-white/10 text-white"
						: "text-white/60 hover:bg-white/5 hover:text-white/80"
				)}
				variants={{
					hidden: { opacity: 0, x: -10 },
					visible: {
						opacity: 1,
						x: 0,
						transition: {
							type: "spring",
							stiffness: 260,
							damping: 20,
						},
					},
				}}
				whileHover={{ x: 2 }}
			>
				{getChannelIcon()}
				<span
					className={cn(
						"truncate",
						hasUnread && !isActive && "font-semibold text-white"
					)}
				>
					{channel.name}
				</span>

				{/* Unread Badge or Channel Actions */}
				<div className="ml-auto flex items-center gap-1">
					{/* Unread Badge */}
					{hasUnread && !isActive && (
						<div className="min-w-[18px] h-[18px] bg-error rounded-full flex items-center justify-center px-1">
							<span className="text-white text-[10px] font-bold">
								{channel.unreadCount > 99 ? "99+" : channel.unreadCount}
							</span>
						</div>
					)}

					{/* Channel Settings (visible on hover) */}
					<div
						role="button"
						tabIndex={0}
						aria-label={`Settings for ${channel.name}`}
						className="p-2 md:p-1 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center hover:bg-white/10 rounded transition-colors cursor-pointer md:opacity-0 md:group-hover:opacity-100 touch-manipulation"
						onClick={(e) => {
							e.stopPropagation();
							openChannelSettings(channel.id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								openChannelSettings(channel.id);
							}
						}}
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Channel Settings</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</div>
				</div>
			</motion.button>

			{/* Voice Channel Users */}
			{hasConnectedUsers && (
				<motion.div
					className="ml-6 mt-1 space-y-1"
					initial={{ opacity: 0, height: 0 }}
					animate={{ opacity: 1, height: "auto" }}
					exit={{ opacity: 0, height: 0 }}
					transition={{ duration: 0.2 }}
				>
					{channel.connectedUsers?.map((user) => (
						<VoiceUserItem key={user.id} user={user} />
					))}
				</motion.div>
			)}
		</div>
	);
}

function VoiceUserItem({ user }: { user: VoiceUser }) {
	return (
		<motion.div
			className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer group"
			initial={{ opacity: 0, x: -10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
		>
			<div className="relative">
				<Avatar
					src={user.avatar}
					fallback={user.username.slice(0, 2).toUpperCase()}
					size="xs"
					status={user.isSpeaking ? "online" : undefined}
				/>
				{user.isSpeaking && (
					<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[oklch(0.15_0.02_250)] animate-pulse" />
				)}
			</div>

			<span className="text-xs text-white/70 truncate flex-1">
				{user.username}
			</span>

			{/* Voice Status Icons */}
			<div className="flex items-center gap-1">
				{user.isDeafened && (
					<svg
						className="w-3.5 h-3.5 text-error"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Deafened</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
						/>
					</svg>
				)}
				{user.isMuted && !user.isDeafened && (
					<svg
						className="w-3.5 h-3.5 text-error"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Muted</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 11l-6-6m0 6l6-6"
						/>
					</svg>
				)}
			</div>
		</motion.div>
	);
}
