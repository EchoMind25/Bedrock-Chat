"use client";

import { useRef, useCallback, useState, type MouseEvent } from "react";
import type { Server } from "@/lib/types/server";
import { motion } from "motion/react";
import { MessageCircle, Settings, LogOut, Trash2, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getImageUrl, SERVER_ICON_TRANSFORM } from "@/lib/utils/image-url";
import { createClickCounter } from "@/lib/easter-eggs";
import { usePointsStore } from "@/store/points.store";
import { useServerStore } from "@/store/server.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { ContextMenu, type ContextMenuEntry } from "@/components/ui/context-menu/context-menu";
import { toast } from "@/lib/stores/toast-store";

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
	const discoverEasterEgg = usePointsStore((s) => s.discoverEasterEgg);
	const clickCounterRef = useRef(
		isHome
			? createClickCounter(7, 5000, () => discoverEasterEgg("logo-click-7"))
			: null,
	);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

	const handleClick = useCallback(() => {
		if (isHome) clickCounterRef.current?.handleClick();
		onClick();
	}, [isHome, onClick]);

	const handleContextMenu = useCallback((e: MouseEvent) => {
		if (isHome) return;
		e.preventDefault();
		setContextMenu({ x: e.clientX, y: e.clientY });
	}, [isHome]);

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	const hasUnread = (!isHome && server.unreadCount > 0) || badgeCount > 0;
	const displayBadge = isHome ? badgeCount : server.unreadCount;

	// Build context menu items
	const contextMenuItems: ContextMenuEntry[] = [];
	if (!isHome) {
		contextMenuItems.push({
			id: "mark-read",
			label: "Mark as Read",
			icon: <CheckCheck className="w-4 h-4" />,
			onClick: () => {
				for (const ch of server.channels) {
					useServerStore.getState().markChannelRead(ch.id);
				}
			},
			disabled: server.unreadCount === 0,
		});

		if (server.isOwner) {
			contextMenuItems.push({
				id: "settings",
				label: "Server Settings",
				icon: <Settings className="w-4 h-4" />,
				onClick: () => {
					useServerStore.getState().setCurrentServer(server.id);
					useServerManagementStore.getState().openServerSettings();
				},
			});
		}

		contextMenuItems.push(
			{ id: "divider-1", type: "divider" },
			{
				id: "copy-id",
				label: "Copy Server ID",
				icon: <Copy className="w-4 h-4" />,
				onClick: () => {
					navigator.clipboard.writeText(server.id);
					toast.success("Copied", "Server ID copied to clipboard");
				},
			},
		);

		contextMenuItems.push({ id: "divider-2", type: "divider" });

		if (server.isOwner) {
			contextMenuItems.push({
				id: "delete",
				label: "Delete Server",
				icon: <Trash2 className="w-4 h-4" />,
				variant: "danger",
				onClick: () => {
					if (confirm(`Are you sure you want to delete "${server.name}"? This cannot be undone.`)) {
						useServerStore.getState().deleteServer(server.id);
					}
				},
			});
		} else {
			contextMenuItems.push({
				id: "leave",
				label: "Leave Server",
				icon: <LogOut className="w-4 h-4" />,
				variant: "danger",
				onClick: () => {
					useServerStore.getState().leaveServer(server.id);
				},
			});
		}
	}

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
				onClick={handleClick}
				onContextMenu={handleContextMenu}
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

			{/* Context Menu */}
			{contextMenu && (
				<ContextMenu
					items={contextMenuItems}
					position={contextMenu}
					isOpen={true}
					onClose={handleCloseContextMenu}
				/>
			)}
		</div>
	);
}
