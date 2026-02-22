"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { Badge } from "@/components/ui/badge/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card/card";
import { FriendProfileCard } from "@/components/friends/friend-profile-card";
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
	const [showProfileCard, setShowProfileCard] = useState(false);

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

	const handleProfileClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowProfileCard(true);
	};

	const handleProfileKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			e.stopPropagation();
			setShowProfileCard(true);
		}
	};

	const statusVariant =
		effectiveStatus === "online"
			? "success"
			: effectiveStatus === "dnd"
				? "danger"
				: "default";

	return (
		<>
			<motion.div
				variants={{
					hidden: { opacity: 0, y: 20 },
					visible: { opacity: 1, y: 0 },
				}}
				whileHover={{ y: -2 }}
			>
				<Card hoverable variant="medium">
					<CardHeader className="flex-row items-center gap-4">
						<div
							role="button"
							tabIndex={0}
							onClick={handleProfileClick}
							onKeyDown={handleProfileKeyDown}
							className="cursor-pointer rounded-full hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.12_250)] focus-visible:outline-hidden"
						>
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
						</div>
						<div
							className="flex-1 min-w-0 cursor-pointer"
							role="button"
							tabIndex={0}
							onClick={handleProfileClick}
							onKeyDown={handleProfileKeyDown}
						>
							<CardTitle className="truncate hover:underline">{friend.displayName}</CardTitle>
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

			{/* Friend profile card portal */}
			{showProfileCard && typeof document !== "undefined" && createPortal(
				<AnimatePresence>
					{showProfileCard && (
						<motion.div
							key="friend-profile-overlay"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.15 }}
							className="fixed inset-0 z-[9998]"
						>
							<div
								className="absolute inset-0 bg-black/40"
								onClick={() => setShowProfileCard(false)}
							/>
							<div className="absolute inset-0 z-[1] flex items-center justify-center pointer-events-none">
								<div className="pointer-events-auto">
									<FriendProfileCard
										friend={friend}
										onClose={() => setShowProfileCard(false)}
									/>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body,
			)}
		</>
	);
}
