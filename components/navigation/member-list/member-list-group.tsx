"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import type { MemberWithProfile } from "@/store/member.store";
import type { UserPresence } from "@/store/presence.store";
import { MemberListItem } from "./member-list-item";

interface MemberListGroupProps {
	label: string;
	onlineMembers: MemberWithProfile[];
	offlineMembers: MemberWithProfile[];
	onlineUsers: Map<string, UserPresence>;
	onMemberClick?: (member: MemberWithProfile) => void;
}

export function MemberListGroup({
	label,
	onlineMembers,
	offlineMembers,
	onlineUsers,
	onMemberClick,
}: MemberListGroupProps) {
	const [collapsed, setCollapsed] = useState(false);
	const totalCount = onlineMembers.length + offlineMembers.length;

	if (totalCount === 0) return null;

	return (
		<div className="mb-2">
			<button
				type="button"
				onClick={() => setCollapsed(!collapsed)}
				className="flex items-center gap-1 w-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors"
			>
				<ChevronDown
					className={`w-3 h-3 transition-transform ${collapsed ? "-rotate-90" : ""}`}
				/>
				<span>{label}</span>
				<span className="ml-auto">{totalCount}</span>
			</button>

			<AnimatePresence initial={false}>
				{!collapsed && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="overflow-hidden"
					>
						{onlineMembers.map((member) => {
							const presence = onlineUsers.get(member.userId);
							return (
								<MemberListItem
									key={member.id}
									member={member}
									isOnline={true}
									presenceStatus={presence?.status}
									onClick={onMemberClick}
								/>
							);
						})}
						{offlineMembers.map((member) => (
							<MemberListItem
								key={member.id}
								member={member}
								isOnline={false}
								onClick={onMemberClick}
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
