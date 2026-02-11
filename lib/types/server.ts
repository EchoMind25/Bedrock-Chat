import type { Role, PermissionOverride } from "./permissions";
import type { ServerSettings } from "./server-settings";

export type ChannelType = "text" | "voice" | "announcement";

export interface VoiceUser {
	id: string;
	username: string;
	avatar: string;
	isMuted: boolean;
	isDeafened: boolean;
	isSpeaking: boolean;
}

export interface Channel {
	id: string;
	name: string;
	type: ChannelType;
	serverId: string;
	position: number;
	description?: string;
	categoryId?: string;
	unreadCount: number;
	lastMessageAt?: Date;
	isNsfw: boolean;
	// Voice channel specific
	connectedUsers?: VoiceUser[];
	// Channel settings
	topic?: string;
	slowMode?: number; // Seconds (0 = off)
	permissionOverrides?: PermissionOverride[];
}

export interface ChannelCategory {
	id: string;
	name: string;
	serverId: string;
	position: number;
	collapsed?: boolean;
}

export interface Server {
	id: string;
	name: string;
	icon: string | null;
	ownerId: string;
	memberCount: number;
	isOwner: boolean;
	categories: ChannelCategory[];
	channels: Channel[];
	unreadCount: number;
	createdAt: Date;
	// Server management
	roles?: Role[];
	settings?: ServerSettings;
	banner?: string | null;
	description?: string;
}

export interface ServerMember {
	id: string;
	userId: string;
	serverId: string;
	nickname?: string;
	role: "owner" | "admin" | "moderator" | "member";
	joinedAt: Date;
}
