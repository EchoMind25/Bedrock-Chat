"use client";

import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useUIStore } from "@/store/ui.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { useFriendsStore } from "@/store/friends.store";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ServerButton } from "./server-button";
import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

export function ServerList() {
	const router = useRouter();
	const servers = useServerStore((state) => state.servers);
	const isInitialized = useServerStore((state) => state.isInitialized);
	const currentServerId = useServerStore((state) => state.currentServerId);
	const setCurrentServer = useServerStore((state) => state.setCurrentServer);
	const openAddServer = useServerManagementStore((state) => state.openAddServer);
	const pendingFriendRequests = useFriendsStore((state) => state.friendRequests.incoming.length);

	const isMobile = useIsMobile();
	const isMobileServerListOpen = useUIStore(
		(state) => state.isMobileServerListOpen
	);
	const setMobileServerListOpen = useUIStore(
		(state) => state.setMobileServerListOpen
	);

	const homeServer = servers.find((s) => s.id === "home");
	const otherServers = servers.filter((s) => s.id !== "home");

	// Show loading state while initializing
	if (!isInitialized || !homeServer) {
		return (
			<div className="w-[72px] h-screen bg-[oklch(0.12_0.02_250)] flex flex-col items-center py-3">
				<div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
			</div>
		);
	}

	// Mobile: slide-over overlay pattern
	if (isMobile) {
		return (
			<>
				{/* Dark overlay backdrop */}
				<AnimatePresence>
					{isMobileServerListOpen && (
						<motion.div
							className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setMobileServerListOpen(false)}
							aria-hidden="true"
						/>
					)}
				</AnimatePresence>

				{/* Slide-over panel */}
				<AnimatePresence>
					{isMobileServerListOpen && (
						<motion.div
							className="fixed left-0 top-0 bottom-0 w-[72px] bg-[oklch(0.12_0.02_250)] z-50 flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide"
							style={{
								paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
							}}
							initial={{ x: -72 }}
							animate={{ x: 0 }}
							exit={{ x: -72 }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
						>
							{/* Close button */}
							<button
								type="button"
								onClick={() => setMobileServerListOpen(false)}
								className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors touch-manipulation focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
								aria-label="Close server list"
							>
								<X className="w-6 h-6" />
							</button>

							<div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

							{/* Home Button */}
							<Tooltip content="Direct Messages" position="right">
								<ServerButton
									server={homeServer}
									isActive={currentServerId === "home"}
									onClick={() => {
										setCurrentServer("home");
										router.push("/friends");
										setMobileServerListOpen(false);
									}}
									isHome
									badgeCount={pendingFriendRequests}
								/>
							</Tooltip>

							<div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

							{/* Server List */}
							<motion.div
								className="flex flex-col gap-2 w-full items-center"
								initial="hidden"
								animate="visible"
								variants={{
									hidden: { opacity: 0 },
									visible: {
										opacity: 1,
										transition: {
											staggerChildren: 0.02,
										},
									},
								}}
							>
								{otherServers.map((server) => (
									<Tooltip key={server.id} content={server.name} position="right">
										<ServerButton
											server={server}
											isActive={currentServerId === server.id}
											onClick={() => {
												setCurrentServer(server.id);
												const firstTextChannel = server.channels.find(
													(c) => c.type === "text"
												);
												const channelId =
													firstTextChannel?.id ?? server.channels[0]?.id;
												if (channelId) {
													router.push(`/servers/${server.id}/${channelId}`);
												}
												setMobileServerListOpen(false);
											}}
										/>
									</Tooltip>
								))}
							</motion.div>

							{/* Add Server Button */}
							<motion.button
								type="button"
								className="w-12 h-12 rounded-full bg-[oklch(0.15_0.02_250)] hover:bg-primary hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-primary hover:text-white group mt-2 touch-manipulation focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
								whileTap={{ scale: 0.95 }}
								onClick={() => {
									openAddServer();
									setMobileServerListOpen(false);
								}}
								aria-label="Add a Server"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Add Server</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>
			</>
		);
	}

	// Desktop: persistent sidebar
	return (
		<nav aria-label="Servers" className="w-[72px] h-screen bg-[oklch(0.12_0.02_250)] flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide">
			{/* Home Button */}
			<Tooltip content="Direct Messages" position="right">
				<ServerButton
					server={homeServer}
					isActive={currentServerId === "home"}
					onClick={() => {
						setCurrentServer("home");
						router.push("/friends");
					}}
					isHome
					badgeCount={pendingFriendRequests}
				/>
			</Tooltip>

			{/* Divider */}
			<div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

			{/* Server List */}
			<motion.div
				className="flex flex-col gap-2 w-full items-center"
				initial="hidden"
				animate="visible"
				variants={{
					hidden: { opacity: 0 },
					visible: {
						opacity: 1,
						transition: {
							staggerChildren: 0.02,
						},
					},
				}}
			>
				{otherServers.map((server) => (
					<Tooltip key={server.id} content={server.name} position="right">
						<ServerButton
							server={server}
							isActive={currentServerId === server.id}
							onClick={() => {
								setCurrentServer(server.id);
								const firstTextChannel = server.channels.find((c) => c.type === "text");
								const channelId = firstTextChannel?.id ?? server.channels[0]?.id;
								if (channelId) {
									router.push(`/servers/${server.id}/${channelId}`);
								}
							}}
						/>
					</Tooltip>
				))}
			</motion.div>

			{/* Add Server Button - click-only, no hover tooltip */}
			<motion.button
				type="button"
				className="w-12 h-12 rounded-full bg-[oklch(0.15_0.02_250)] hover:bg-primary hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-primary hover:text-white group mt-2 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => openAddServer()}
				aria-label="Add a Server"
			>
				<svg
					className="w-6 h-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Add Server</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</motion.button>
		</nav>
	);
}
