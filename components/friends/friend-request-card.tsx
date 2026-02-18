"use client";

import { motion } from "motion/react";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card/card";
import type { FriendRequest } from "@/lib/types/friend";
import { useFriendsStore } from "@/store/friends.store";

interface FriendRequestCardProps {
	request: FriendRequest;
}

export function FriendRequestCard({ request }: FriendRequestCardProps) {
	const acceptRequest = useFriendsStore((state) => state.acceptFriendRequest);
	const declineRequest = useFriendsStore((state) => state.declineFriendRequest);
	const cancelRequest = useFriendsStore((state) => state.cancelFriendRequest);

	const isIncoming = request.direction === "incoming";

	// For incoming: show the sender (who sent us the request)
	// For outgoing: show the receiver (who we sent the request to)
	const displayAvatar = isIncoming ? request.fromAvatar : request.toAvatar;
	const displayName = isIncoming ? request.fromDisplayName : request.toDisplayName;
	const displayUsername = isIncoming ? request.fromUsername : request.toUsername;

	const handleAccept = () => {
		acceptRequest(request.id);
	};

	const handleDecline = () => {
		declineRequest(request.id);
	};

	const handleCancel = () => {
		cancelRequest(request.id);
	};

	const formatDate = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - new Date(date).getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (days === 0) return "Today";
		if (days === 1) return "Yesterday";
		if (days < 7) return `${days} days ago`;
		return new Date(date).toLocaleDateString();
	};

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 20 },
				visible: { opacity: 1, y: 0 },
			}}
			whileHover={{ y: -2 }}
		>
			<Card variant="medium" hoverable>
				<CardHeader className="flex-row items-center gap-4">
					<Avatar
						src={displayAvatar}
						fallback={displayName.slice(0, 2)}
						size="md"
					/>
					<div className="flex-1 min-w-0">
						<CardTitle className="truncate text-base">
							{displayName}
						</CardTitle>
						<CardDescription className="truncate">
							@{displayUsername}
						</CardDescription>
					</div>
					<span className="text-xs text-white/40">
						{formatDate(request.createdAt)}
					</span>
				</CardHeader>

				{request.message && (
					<CardContent>
						<p className="text-sm text-white/70 italic">"{request.message}"</p>
					</CardContent>
				)}

				<CardFooter className="gap-2">
					{isIncoming ? (
						<>
							<Button variant="primary" size="sm" onClick={handleAccept}>
								Accept
							</Button>
							<Button variant="danger" size="sm" onClick={handleDecline}>
								Decline
							</Button>
						</>
					) : (
						<Button variant="ghost" size="sm" onClick={handleCancel}>
							Cancel Request
						</Button>
					)}
				</CardFooter>
			</Card>
		</motion.div>
	);
}
