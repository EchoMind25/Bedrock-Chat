"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { useMemberStore } from "@/store/member.store";
import { usePresenceStore } from "@/store/presence.store";
import { useAuthStore } from "@/store/auth.store";
import { useUIStore } from "@/store/ui.store";
import type { MemberWithProfile } from "@/store/member.store";
import { MemberListGroup } from "./member-list-group";
import { UserProfileCard } from "@/components/user-profile-card";

interface MemberListPanelProps {
	serverId: string;
}

const EMPTY_MEMBERS: MemberWithProfile[] = [];

const ROLE_ORDER = ["owner", "admin", "moderator", "member"] as const;
const ROLE_LABELS: Record<string, string> = {
	owner: "Owner",
	admin: "Admin",
	moderator: "Moderator",
	member: "Members",
};

export function MemberListPanel({ serverId }: MemberListPanelProps) {
	const members = useMemberStore((s) => s.membersByServer[serverId] ?? EMPTY_MEMBERS);
	const isLoading = useMemberStore((s) => s.loadingServers[serverId] ?? false);
	const onlineUsers = usePresenceStore((s) => s.onlineUsers);
	const currentUserId = useAuthStore((s) => s.user?.id);
	const [selectedMember, setSelectedMember] = useState<MemberWithProfile | null>(null);

	useEffect(() => {
		if (serverId && serverId !== "home") {
			useMemberStore.getState().loadMembers(serverId);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serverId]);

	const groupedMembers = useMemo(() => {
		const groups: Record<string, { online: MemberWithProfile[]; offline: MemberWithProfile[] }> = {};

		for (const role of ROLE_ORDER) {
			groups[role] = { online: [], offline: [] };
		}

		for (const member of members) {
			const group = groups[member.role];
			if (!group) continue;

			// Current user is always "online" from their own perspective
			const isOnline = member.userId === currentUserId || onlineUsers.has(member.userId);
			if (isOnline) {
				group.online.push(member);
			} else {
				group.offline.push(member);
			}
		}

		return groups;
	}, [members, onlineUsers, currentUserId]);

	const onlineCount = useMemo(() => {
		let count = 0;
		for (const member of members) {
			if (member.userId === currentUserId || onlineUsers.has(member.userId)) {
				count++;
			}
		}
		return count;
	}, [members, onlineUsers, currentUserId]);

	return (
		<div className="flex flex-col h-full relative">
			{/* Header */}
			<div className="shrink-0 h-12 flex items-center justify-between px-4 border-b border-white/10">
				<div className="text-sm font-semibold text-white/80">
					Members — {members.length}
				</div>
				<button
					type="button"
					onClick={() => useUIStore.getState().setMemberListVisible(false)}
					className="p-1 rounded-sm hover:bg-white/10 transition-colors text-white/60 hover:text-white/80 md:hidden"
				>
					<X className="w-4 h-4" />
				</button>
			</div>

			{/* Online count */}
			<div className="px-4 py-2 text-[11px] text-white/40">
				{onlineCount} online
			</div>

			{/* Member list */}
			<div className="flex-1 overflow-y-auto scrollbar-thin pb-4">
				{isLoading && members.length === 0 ? (
					<MemberListSkeleton />
				) : (
					ROLE_ORDER.map((role) => {
						const group = groupedMembers[role];
						return (
							<MemberListGroup
								key={role}
								label={ROLE_LABELS[role]}
								onlineMembers={group.online}
								offlineMembers={group.offline}
								onlineUsers={onlineUsers}
								onMemberClick={setSelectedMember}
							/>
						);
					})
				)}
			</div>

			{/* User Profile Card Overlay */}
			<AnimatePresence>
				{selectedMember && (
					<div className="absolute inset-0 z-50 flex items-start justify-center pt-14">
						<UserProfileCard
							member={selectedMember}
							serverId={serverId}
							onClose={() => setSelectedMember(null)}
						/>
					</div>
				)}
			</AnimatePresence>
		</div>
	);
}

function MemberListSkeleton() {
	return (
		<div className="px-3 space-y-3 pt-2">
			<div className="h-2.5 w-16 bg-white/10 rounded-sm animate-pulse" />
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-2.5 animate-pulse">
					<div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
					<div className="flex-1 space-y-1">
						<div className="h-3 w-24 bg-white/10 rounded-sm" />
					</div>
				</div>
			))}
		</div>
	);
}
