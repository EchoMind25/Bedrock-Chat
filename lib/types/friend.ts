export type FriendStatus = "online" | "idle" | "dnd" | "offline";
export type FriendshipStatus = "accepted" | "pending_incoming" | "pending_outgoing" | "blocked";

export interface Friend {
	id: string;
	userId: string;
	username: string;
	displayName: string;
	avatar: string;
	status: FriendStatus;
	customStatus?: string;
	friendshipStatus: FriendshipStatus;
	lastSeen?: Date;
	createdAt: Date;
}

export interface FriendRequest {
	id: string;
	fromUserId: string;
	fromUsername: string;
	fromDisplayName: string;
	fromAvatar: string;
	toUserId: string;
	message?: string;
	createdAt: Date;
	direction: "incoming" | "outgoing";
}
