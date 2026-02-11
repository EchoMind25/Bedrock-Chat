export interface Message {
	id: string;
	content: string;
	author: MessageAuthor;
	timestamp: Date;
	editedAt?: Date;
	reactions: Reaction[];
	attachments: Attachment[];
	embeds: Embed[];
	replyTo?: {
		id: string;
		author: string;
		content: string;
	};
	isPinned: boolean;
	type: 'default' | 'system' | 'reply';
}

export interface MessageAuthor {
	id: string;
	username: string;
	displayName: string;
	avatar: string;
	isBot: boolean;
	roleColor?: string;
}

export interface Reaction {
	emoji: string;
	count: number;
	hasReacted: boolean;
}

export interface Attachment {
	id: string;
	filename: string;
	url: string;
	contentType: string;
	size: number;
	width?: number;
	height?: number;
}

export interface Embed {
	title?: string;
	description?: string;
	url?: string;
	color?: string;
	thumbnail?: string;
	image?: string;
}
