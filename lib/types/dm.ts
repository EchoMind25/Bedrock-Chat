import type { FriendStatus } from "./friend";

export interface DirectMessage {
	id: string;
	participants: DMParticipant[];
	lastMessage?: {
		content: string;
		timestamp: Date;
		authorId: string;
	};
	unreadCount: number;
	isEncrypted: boolean;
	createdAt: Date;
}

export interface DMParticipant {
	id: string;
	userId: string;
	username: string;
	displayName: string;
	avatar: string;
	status: FriendStatus;
}
