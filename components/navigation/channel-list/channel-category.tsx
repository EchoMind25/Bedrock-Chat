"use client";

import type { ChannelCategory as ChannelCategoryType } from "@/lib/types/server";
import { Plus } from "lucide-react";
import { useServerManagementStore } from "@/store/server-management.store";
import { motion } from "motion/react";

interface ChannelCategoryProps {
	category: ChannelCategoryType;
	isCollapsed: boolean;
	onToggle: () => void;
}

export function ChannelCategory({
	category,
	isCollapsed,
	onToggle,
}: ChannelCategoryProps) {
	// ✅ Use selector to subscribe only to specific value, not entire store
	const openCreateChannel = useServerManagementStore((state) => state.openCreateChannel);

	return (
		<div className="w-full px-2 py-1 flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white/80 uppercase tracking-wide group">
			<motion.button
				type="button"
				onClick={onToggle}
				className="flex items-center gap-1 flex-1 min-w-0"
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
			>
				<motion.svg
					className="w-3 h-3 shrink-0"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					animate={{ rotate: isCollapsed ? -90 : 0 }}
					transition={{ duration: 0.2 }}
				>
					<title>{isCollapsed ? "Expand" : "Collapse"}</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={3}
						d="M19 9l-7 7-7-7"
					/>
				</motion.svg>
				<span className="truncate">{category.name}</span>
			</motion.button>

			{/* Add Channel Button */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					openCreateChannel(category.id);
				}}
				className="p-0.5 hover:bg-white/10 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
				aria-label="Create Channel"
			>
				<Plus className="w-3.5 h-3.5" />
			</button>
		</div>
	);
}
