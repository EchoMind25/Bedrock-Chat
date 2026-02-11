"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useDMStore } from "@/store/dm.store";
import { DMItem } from "./dm-item";

export function DMList() {
	const dms = useDMStore((state) => state.dms);
	const currentDmId = useDMStore((state) => state.currentDmId);

	// Sort DMs by last message timestamp
	const sortedDMs = useMemo(() => {
		return [...dms].sort((a, b) => {
			const aTime = a.lastMessage?.timestamp?.getTime() ?? 0;
			const bTime = b.lastMessage?.timestamp?.getTime() ?? 0;
			return bTime - aTime;
		});
	}, [dms]);

	return (
		<>
			{/* DM List Header */}
			<div className="h-12 px-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors">
				<h2 className="font-semibold text-white truncate">Direct Messages</h2>
			</div>

			{/* DM List */}
			<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-2 px-2">
				{sortedDMs.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center px-4">
						<svg
							className="w-16 h-16 text-white/20 mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>No DMs</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
						<p className="text-white/40 text-sm">No direct messages yet</p>
						<p className="text-white/30 text-xs mt-1">
							Start a conversation with a friend!
						</p>
					</div>
				) : (
					<motion.div
						initial="hidden"
						animate="visible"
						variants={{
							hidden: { opacity: 0 },
							visible: {
								opacity: 1,
								transition: {
									staggerChildren: 0.03,
								},
							},
						}}
					>
						{sortedDMs.map((dm) => (
							<DMItem
								key={dm.id}
								dm={dm}
								isActive={currentDmId === dm.id}
							/>
						))}
					</motion.div>
				)}
			</div>
		</>
	);
}
