"use client";

import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { ServerButton } from "./server-button";
import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { motion } from "motion/react";

export function ServerList() {
	const router = useRouter();
	const servers = useServerStore((state) => state.servers);
	const isInitialized = useServerStore((state) => state.isInitialized);
	const currentServerId = useServerStore((state) => state.currentServerId);
	const setCurrentServer = useServerStore((state) => state.setCurrentServer);
	const openAddServer = useServerManagementStore((state) => state.openAddServer);

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

	return (
		<div className="w-[72px] h-screen bg-[oklch(0.12_0.02_250)] flex flex-col items-center py-3 gap-2 overflow-y-auto scrollbar-hide">
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
				className="w-12 h-12 rounded-full bg-[oklch(0.15_0.02_250)] hover:bg-primary hover:rounded-2xl transition-all duration-200 flex items-center justify-center text-primary hover:text-white group mt-2"
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
		</div>
	);
}
