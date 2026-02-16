"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Check, Clock, ChevronDown, Shield, Crown, X } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, type AvatarStatus } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { useFriendsStore } from "@/store/friends.store";
import { useAuthStore } from "@/store/auth.store";
import { useServerStore } from "@/store/server.store";
import { useMemberStore } from "@/store/member.store";
import type { MemberWithProfile } from "@/store/member.store";
import { toast } from "@/lib/stores/toast-store";

interface UserProfileCardProps {
	member: MemberWithProfile;
	serverId: string;
	onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
	owner: "text-yellow-400",
	admin: "text-red-400",
	moderator: "text-blue-400",
	member: "text-slate-400",
};

const ROLE_BG: Record<string, string> = {
	owner: "bg-yellow-500/15 border-yellow-500/30",
	admin: "bg-red-500/15 border-red-500/30",
	moderator: "bg-blue-500/15 border-blue-500/30",
	member: "bg-slate-500/15 border-slate-500/30",
};

const ASSIGNABLE_ROLES: { value: MemberWithProfile["role"]; label: string }[] = [
	{ value: "admin", label: "Admin" },
	{ value: "moderator", label: "Moderator" },
	{ value: "member", label: "Member" },
];

function getAvatarStatus(status: string): AvatarStatus {
	switch (status) {
		case "online": return "online";
		case "idle": return "away";
		case "dnd": return "busy";
		default: return "offline";
	}
}

export function UserProfileCard({ member, serverId, onClose }: UserProfileCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const currentUserId = useAuthStore((s) => s.user?.id);
	const friends = useFriendsStore((s) => s.friends);
	const outgoingRequests = useFriendsStore((s) => s.friendRequests.outgoing);
	const incomingRequests = useFriendsStore((s) => s.friendRequests.incoming);
	const server = useServerStore((s) => s.servers.find((sv) => sv.id === serverId));
	const members = useMemberStore((s) => s.membersByServer[serverId] ?? []);

	const [showRoleDropdown, setShowRoleDropdown] = useState(false);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);
	const [isSendingRequest, setIsSendingRequest] = useState(false);
	const [requestSent, setRequestSent] = useState(false);

	const isCurrentUser = member.userId === currentUserId;
	const friendStatus = friends.some((f) => f.userId === member.userId);
	const pendingStatus = outgoingRequests.some((r) => r.toUserId === member.userId)
		|| incomingRequests.some((r) => r.fromUserId === member.userId);

	// Permission check: can current user manage roles?
	const currentMember = members.find((m) => m.userId === currentUserId);
	const isOwner = server?.ownerId === currentUserId;
	const canManageRoles = isOwner || currentMember?.role === "admin" || currentMember?.role === "owner";
	const canAssignRole = canManageRoles && !isCurrentUser && member.role !== "owner";

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
				onClose();
			}
		}
		function handleEscape(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("mousedown", handleClick);
		document.addEventListener("keydown", handleEscape);
		return () => {
			document.removeEventListener("mousedown", handleClick);
			document.removeEventListener("keydown", handleEscape);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSendFriendRequest = async () => {
		if (isSendingRequest || friendStatus || pendingStatus) return;
		setIsSendingRequest(true);
		try {
			const success = await useFriendsStore.getState().sendFriendRequest(member.username);
			if (success) {
				setRequestSent(true);
				toast.success("Friend Request Sent", `Sent a friend request to ${member.displayName}`);
			} else {
				toast.error("Failed", "Could not send friend request");
			}
		} catch {
			toast.error("Failed", "Could not send friend request");
		} finally {
			setIsSendingRequest(false);
		}
	};

	const handleRoleChange = async (newRole: MemberWithProfile["role"]) => {
		setIsUpdatingRole(true);
		try {
			await useMemberStore.getState().updateMemberRole(serverId, member.id, newRole);
			setShowRoleDropdown(false);
			toast.success("Role Updated", `${member.displayName} is now ${newRole}`);
		} catch {
			toast.error("Failed", "Could not update role");
		} finally {
			setIsUpdatingRole(false);
		}
	};

	const joinDate = member.joinedAt instanceof Date
		? member.joinedAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
		: "Unknown";

	return (
		<motion.div
			ref={cardRef}
			initial={{ opacity: 0, scale: 0.95, y: -4 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95, y: -4 }}
			transition={{ duration: 0.15 }}
			className="w-72 bg-[oklch(0.16_0.02_250)] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
		>
			{/* Banner */}
			<div
				className="h-16 relative"
				style={{ backgroundColor: ROLE_COLORS[member.role] ? undefined : "oklch(0.25 0.05 265)" }}
			>
				<div
					className="absolute inset-0 opacity-40"
					style={{
						background: member.role === "owner"
							? "linear-gradient(135deg, oklch(0.7 0.2 90), oklch(0.6 0.2 50))"
							: member.role === "admin"
								? "linear-gradient(135deg, oklch(0.6 0.2 25), oklch(0.5 0.2 350))"
								: member.role === "moderator"
									? "linear-gradient(135deg, oklch(0.6 0.2 265), oklch(0.5 0.2 240))"
									: "linear-gradient(135deg, oklch(0.3 0.02 265), oklch(0.2 0.02 250))",
					}}
				/>
				<button
					type="button"
					onClick={onClose}
					className="absolute top-2 right-2 p-1 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors"
				>
					<X className="w-3.5 h-3.5" />
				</button>
			</div>

			{/* Avatar + Info */}
			<div className="px-4 -mt-8 pb-3">
				<div className="mb-3">
					<Avatar
						src={member.avatar || undefined}
						fallback={member.displayName?.[0]?.toUpperCase() || "?"}
						size="lg"
						status={getAvatarStatus(member.status)}
					/>
				</div>

				<div className="mb-1">
					<h3 className={`text-base font-semibold ${ROLE_COLORS[member.role] || "text-white"}`}>
						{member.nickname || member.displayName}
					</h3>
					<p className="text-xs text-white/50">@{member.username}</p>
				</div>

				{/* Role Badge */}
				<div className="flex items-center gap-2 mb-3">
					<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_BG[member.role] || ROLE_BG.member}`}>
						{member.role === "owner" && <Crown className="w-3 h-3" />}
						{(member.role === "admin" || member.role === "moderator") && <Shield className="w-3 h-3" />}
						<span className={ROLE_COLORS[member.role] || "text-slate-400"}>
							{member.role.charAt(0).toUpperCase() + member.role.slice(1)}
						</span>
					</span>
					<span className="text-[10px] text-white/30">
						Joined {joinDate}
					</span>
				</div>

				{/* Divider */}
				<div className="border-t border-white/10 my-3" />

				{/* Actions */}
				<div className="space-y-2">
					{/* Friend status / Add Friend */}
					{!isCurrentUser && (
						<div>
							{friendStatus ? (
								<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
									<Check className="w-3.5 h-3.5 text-green-400" />
									<span className="text-xs font-medium text-green-400">Friends</span>
								</div>
							) : pendingStatus || requestSent ? (
								<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
									<Clock className="w-3.5 h-3.5 text-blue-400" />
									<span className="text-xs font-medium text-blue-400">Pending</span>
								</div>
							) : (
								<Button
									size="sm"
									onClick={handleSendFriendRequest}
									disabled={isSendingRequest}
									className="w-full gap-1.5 h-8 text-xs"
								>
									<UserPlus className="w-3.5 h-3.5" />
									Add Friend
								</Button>
							)}
						</div>
					)}

					{/* Role Assignment (admins/owners only) */}
					{canAssignRole && (
						<div className="relative">
							<button
								type="button"
								onClick={() => setShowRoleDropdown(!showRoleDropdown)}
								disabled={isUpdatingRole}
								className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70"
							>
								<span>{isUpdatingRole ? "Updating..." : "Assign Role"}</span>
								<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
							</button>

							{showRoleDropdown && (
								<div className="absolute top-full left-0 right-0 mt-1 bg-[oklch(0.18_0.02_250)] border border-white/10 rounded-lg shadow-xl z-10 py-1">
									{ASSIGNABLE_ROLES.map((role) => (
										<button
											key={role.value}
											type="button"
											onClick={() => handleRoleChange(role.value)}
											className={`w-full text-left px-3 py-1.5 text-xs hover:bg-white/5 transition-colors ${
												member.role === role.value
													? "text-blue-400 font-medium"
													: "text-white/70"
											}`}
										>
											{role.label}
											{member.role === role.value && " (current)"}
										</button>
									))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
