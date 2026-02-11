"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar/avatar";
import { cn } from "@/lib/utils/cn";
import type { DirectMessage } from "@/lib/types/dm";
import { useDMStore } from "@/store/dm.store";

interface DMItemProps {
	dm: DirectMessage;
	isActive: boolean;
}

export function DMItem({ dm, isActive }: DMItemProps) {
	const router = useRouter();
	const setCurrentDm = useDMStore((state) => state.setCurrentDm);

	// Get the other participant (not the current user)
	const otherParticipant = dm.participants.find((p) => p.userId !== "current-user-id");
	if (!otherParticipant) return null;

	const handleClick = () => {
		setCurrentDm(dm.id);
		router.push(`/channels/@me/${dm.id}`);
	};

	// Format last message timestamp
	const formatTimestamp = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) {
			return date.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
			});
		}
		if (days === 1) return "Yesterday";
		if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	};

	return (
		<motion.button
			type="button"
			onClick={handleClick}
			className={cn(
				"w-full px-2 py-2 rounded-lg flex items-center gap-3 transition-colors relative group",
				isActive
					? "bg-white/10 text-white"
					: "text-white/70 hover:bg-white/5 hover:text-white"
			)}
			whileHover={{ x: 2 }}
			variants={{
				hidden: { opacity: 0, x: -10 },
				visible: { opacity: 1, x: 0 },
			}}
		>
			{/* Avatar with Status */}
			<Avatar
				src={otherParticipant.avatar}
				fallback={otherParticipant.displayName.slice(0, 2)}
				status={
					otherParticipant.status === "idle"
						? "away"
						: otherParticipant.status === "dnd"
							? "busy"
							: otherParticipant.status
				}
				size="md"
			/>

			{/* User Info and Last Message */}
			<div className="flex-1 min-w-0 text-left">
				<div className="flex items-center justify-between gap-2">
					<p
						className={cn(
							"text-sm font-medium truncate",
							dm.unreadCount > 0 ? "text-white font-semibold" : ""
						)}
					>
						{otherParticipant.displayName}
					</p>
					{dm.lastMessage && (
						<span className="text-[10px] text-white/40 flex-shrink-0">
							{formatTimestamp(dm.lastMessage.timestamp)}
						</span>
					)}
				</div>

				{/* Last Message Preview */}
				{dm.lastMessage && (
					<p className="text-xs text-white/50 truncate mt-0.5">
						{dm.lastMessage.authorId === "current-user-id" && "You: "}
						{dm.lastMessage.content}
					</p>
				)}
			</div>

			{/* Unread Badge */}
			{dm.unreadCount > 0 && !isActive && (
				<motion.div
					className="flex-shrink-0 min-w-[20px] h-5 bg-error rounded-full flex items-center justify-center px-1.5"
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					exit={{ scale: 0 }}
					transition={{
						type: "spring",
						stiffness: 400,
						damping: 15,
					}}
				>
					<span className="text-white text-[10px] font-bold">
						{dm.unreadCount > 99 ? "99+" : dm.unreadCount}
					</span>
				</motion.div>
			)}

			{/* Close DM on Hover (X button) */}
			<div
				role="button"
				tabIndex={0}
				className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
				onClick={(e) => {
					e.stopPropagation();
					// TODO: Implement close DM functionality
					console.log("Close DM:", dm.id);
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						console.log("Close DM:", dm.id);
					}
				}}
			>
				<svg
					className="w-4 h-4 text-white/40 hover:text-white/80"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Close DM</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</div>
		</motion.button>
	);
}
