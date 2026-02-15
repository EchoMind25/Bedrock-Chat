"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card/card";
import type { Friend } from "@/lib/types/friend";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { usePresenceStore } from "@/store/presence.store";

interface FriendCardProps {
	friend: Friend;
}

export function FriendCard({ friend }: FriendCardProps) {
	const router = useRouter();
	const removeFriend = useFriendsStore((state) => state.removeFriend);
	const blockUser = useFriendsStore((state) => state.blockUser);
	const createDm = useDMStore((state) => state.createDm);

	// Real-time presence status — only re-renders when THIS friend's status changes
	const liveStatus = usePresenceStore(
		useCallback((s) => {
			const presence = s.onlineUsers.get(friend.userId);
			return presence?.status ?? null;
		}, [friend.userId])
	);

	// Use live presence if available, fall back to stored friend status
	const effectiveStatus = liveStatus ?? friend.status;

	const handleMessage = () => {
		// Create or get existing DM
		const dm = createDm(friend.userId);
		if (dm) {
			router.push(`/dms/${dm.id}`);
		}
	};

	const handleRemove = () => {
		if (confirm(`Remove ${friend.displayName} from friends?`)) {
			removeFriend(friend.id);
		}
	};

	const handleBlock = () => {
		if (confirm(`Block ${friend.displayName}?`)) {
			blockUser(friend.userId);
		}
	};

	const statusVariant =
		effectiveStatus === "online"
			? "success"
			: effectiveStatus === "dnd"
				? "danger"
				: "default";

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: { opacity: 1, y: 0 },
			}}
			whileHover={{ y: -2 }}
		>
			<Card hoverable variant="medium">
				<CardHeader className="flex-row items-center gap-4">
					<Avatar
						src={friend.avatar}
						fallback={friend.displayName.slice(0, 2)}
						status={
							effectiveStatus === "idle"
								? "away"
								: effectiveStatus === "dnd"
									? "busy"
									: effectiveStatus === "online"
										? "online"
										: "offline"
						}
						size="lg"
					/>
					<div className="flex-1 min-w-0">
						<CardTitle className="truncate">{friend.displayName}</CardTitle>
						<CardDescription className="truncate">@{friend.username}</CardDescription>
						{friend.customStatus && (
							<p className="text-xs text-white/50 mt-1 truncate">{friend.customStatus}</p>
						)}
					</div>
					<div className="flex flex-col items-end gap-1">
						<Badge variant={statusVariant} pulse={effectiveStatus === "online"}>
							{effectiveStatus}
						</Badge>
						{effectiveStatus === "offline" && friend.lastSeen && (
							<span className="text-[10px] text-white/40">
								{new Date(friend.lastSeen).toLocaleDateString()}
							</span>
						)}
					</div>
				</CardHeader>

				<CardFooter className="gap-2">
					<Button variant="primary" size="sm" onClick={handleMessage}>
						Message
					</Button>
					<Button variant="ghost" size="sm" onClick={handleRemove}>
						Remove
					</Button>
					<Button variant="ghost" size="sm" onClick={handleBlock}>
						Block
					</Button>
				</CardFooter>
			</Card>
		</motion.div>
	);
}
