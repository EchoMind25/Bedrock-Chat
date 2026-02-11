"use client";

import type { Server } from "@/lib/types/server";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

interface ServerButtonProps {
	server: Server;
	isActive: boolean;
	onClick: () => void;
	isHome?: boolean;
}

export function ServerButton({
	server,
	isActive,
	onClick,
	isHome = false,
}: ServerButtonProps) {
	const hasUnread = !isHome && server.unreadCount > 0;

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
				onClick={onClick}
				className={cn(
					"relative w-12 h-12 rounded-full transition-all duration-200 flex items-center justify-center text-2xl overflow-hidden group",
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
				{/* Server Icon */}
				<span className="relative z-10">{server.icon}</span>
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
						{server.unreadCount > 99 ? "99+" : server.unreadCount}
					</span>
				</motion.div>
			)}
		</div>
	);
}
