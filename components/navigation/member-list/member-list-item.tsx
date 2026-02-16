"use client";

import { Avatar } from "@/components/ui/avatar/avatar";
import type { MemberWithProfile } from "@/store/member.store";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";

interface MemberListItemProps {
	member: MemberWithProfile;
	isOnline: boolean;
	presenceStatus?: string;
	onClick?: (member: MemberWithProfile) => void;
}

const ROLE_COLORS: Record<string, string> = {
	owner: "text-yellow-400",
	admin: "text-red-400",
	moderator: "text-blue-400",
	member: "",
};

function mapStatus(status: string | undefined): AvatarStatus | undefined {
	switch (status) {
		case "online":
			return "online";
		case "idle":
			return "away";
		case "dnd":
			return "busy";
		case "offline":
		case "invisible":
			return "offline";
		default:
			return undefined;
	}
}

export function MemberListItem({ member, isOnline, presenceStatus, onClick }: MemberListItemProps) {
	const displayName = member.nickname || member.displayName;
	const roleColor = ROLE_COLORS[member.role] || "";
	const avatarStatus = isOnline ? mapStatus(presenceStatus || "online") : "offline";

	return (
		<div
			onClick={() => onClick?.(member)}
			className={`flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-sm hover:bg-white/5 transition-colors cursor-pointer group ${
				!isOnline ? "opacity-40" : ""
			}`}
		>
			<Avatar
				src={member.avatar}
				fallback={displayName.slice(0, 2)}
				size="sm"
				status={avatarStatus}
			/>
			<div className="min-w-0 flex-1">
				<div className={`text-sm font-medium truncate ${roleColor || "text-white/90"}`}>
					{displayName}
				</div>
				{member.nickname && (
					<div className="text-[11px] text-white/40 truncate">
						{member.username}
					</div>
				)}
			</div>
		</div>
	);
}
