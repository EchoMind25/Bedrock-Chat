"use client";

import type { Server } from "@/lib/types/server";
import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getImageUrl, SERVER_ICON_TRANSFORM } from "@/lib/utils/image-url";

interface ServerButtonProps {
	server: Server;
	isActive: boolean;
	onClick: () => void;
	isHome?: boolean;
	badgeCount?: number;
}

export function ServerButton({
	server,
	isActive,
	onClick,
	isHome = false,
	badgeCount = 0,
}: ServerButtonProps) {
	const hasUnread = (!isHome && server.unreadCount > 0) || badgeCount > 0;
	const displayBadge = isHome ? badgeCount : server.unreadCount;

	return (
		<div className="relative">
			{/* Active Indicator Pill */}
			<motion.div
				className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 bg-white rounded-r-full"
				initial={false}
				animate={{
					height: isActive ? 40 : hasUnread ? 8 : 0,
					opacity: isActive || hasUnread ? 1 : 0,
				}}
				transition={{
					type: "spring",
					stiffness: 500,
					damping: 30,
				}}
			/>

			<motion.button
				type="button"
				layoutId={isActive ? "portal-server-icon" : undefined}
				onClick={onClick}
				className={cn(
					"relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-full transition-all duration-200 flex items-center justify-center text-2xl overflow-hidden group touch-manipulation focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
					isActive
						? "rounded-2xl bg-primary text-white"
						: "bg-[oklch(0.15_0.02_250)] hover:bg-primary/80 hover:rounded-2xl hover:text-white"
				)}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				variants={{
					hidden: { scale: 0, opacity: 0 },
					visible: {
						scale: 1,
						opacity: 1,
						transition: {
							type: "spring",
							stiffness: 260,
							damping: 20,
						},
					},
				}}
			>
				{/* Server Icon: home icon, image URL, or emoji/initial fallback */}
				{isHome ? (
					<MessageCircle className="relative z-10 w-6 h-6" />
				) : server.icon?.startsWith("http") ? (
					<img
						src={getImageUrl(server.icon, SERVER_ICON_TRANSFORM)}
						alt={server.name}
						width={48}
						height={48}
						className="absolute inset-0 w-full h-full object-cover"
					/>
				) : (
					<span className="relative z-10">{server.icon ?? server.name[0]?.toUpperCase()}</span>
				)}
			</motion.button>

			{/* Unread Badge */}
			{hasUnread && !isActive && (
				<motion.div
					className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-error rounded-full flex items-center justify-center px-1 border-2 border-[oklch(0.12_0.02_250)]"
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
						{displayBadge > 99 ? "99+" : displayBadge}
					</span>
				</motion.div>
			)}
		</div>
	);
}
