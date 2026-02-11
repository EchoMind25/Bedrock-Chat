import { faker } from "@faker-js/faker";
import type {
	Server,
	ChannelCategory,
	Channel,
	VoiceUser,
} from "@/lib/types/server";

/**
 * Generate mock voice users for voice channels
 */
function generateVoiceUsers(count?: number): VoiceUser[] {
	const userCount = count ?? faker.number.int({ min: 0, max: 5 });
	return Array.from({ length: userCount }, () => ({
		id: faker.string.uuid(),
		username: faker.internet.username(),
		avatar: faker.image.avatar(),
		isMuted: Math.random() > 0.7,
		isDeafened: Math.random() > 0.9,
		isSpeaking: Math.random() > 0.8,
	}));
}

/**
 * Generate mock channels for a server
 */
function generateChannels(
	serverId: string,
	categoryId: string,
	channelNames: string[],
	type: "text" | "voice" | "announcement" = "text"
): Channel[] {
	return channelNames.map((name, index) => {
		const hasUnread = Math.random() > 0.6;
		const isVoice = type === "voice";
		const hasConnectedUsers = isVoice && Math.random() > 0.5;

		return {
			id: `${serverId}-${categoryId}-${faker.string.uuid()}`,
			name: type === "voice" ? name : name.toLowerCase().replace(/\s+/g, "-"),
			type,
			serverId,
			categoryId,
			position: index,
			description:
				Math.random() > 0.5
					? faker.lorem.sentence({ min: 3, max: 8 })
					: undefined,
			unreadCount: hasUnread ? faker.number.int({ min: 1, max: 50 }) : 0,
			lastMessageAt:
				hasUnread || Math.random() > 0.3
					? faker.date.recent({ days: 7 })
					: undefined,
			isNsfw: false,
			connectedUsers: hasConnectedUsers ? generateVoiceUsers() : undefined,
		};
	});
}

/**
 * Generate categories and channels for a server
 */
function generateServerContent(serverId: string): {
	categories: ChannelCategory[];
	channels: Channel[];
} {
	const categoryTemplates = [
		{
			name: "INFORMATION",
			channelNames: ["welcome", "rules", "announcements"],
			type: "announcement" as const,
		},
		{
			name: "TEXT CHANNELS",
			channelNames: ["general", "random", "off-topic", "introductions"],
			type: "text" as const,
		},
		{
			name: "TOPICS",
			channelNames: ["gaming", "music", "movies", "tech", "memes"],
			type: "text" as const,
		},
		{
			name: "VOICE CHANNELS",
			channelNames: ["General Voice", "Gaming", "Music", "Chill Zone"],
			type: "voice" as const,
		},
	];

	const categories: ChannelCategory[] = [];
	const channels: Channel[] = [];

	for (const [index, template] of categoryTemplates.entries()) {
		const categoryId = `cat-${serverId}-${index}`;

		categories.push({
			id: categoryId,
			name: template.name,
			serverId,
			position: index,
			collapsed: false,
		});

		// Generate channels for this category (pick 2-4 channels from template)
		const numChannels = faker.number.int({
			min: 2,
			max: Math.min(4, template.channelNames.length),
		});
		const selectedChannels = faker.helpers
			.shuffle(template.channelNames)
			.slice(0, numChannels);

		channels.push(
			...generateChannels(serverId, categoryId, selectedChannels, template.type)
		);
	}

	return { categories, channels };
}

/**
 * Generate a mock server with all its content
 */
export function generateMockServer(options?: {
	isOwner?: boolean;
	isEmpty?: boolean;
	id?: string;
	name?: string;
	icon?: string;
}): Server {
	const serverId = options?.id ?? faker.string.uuid();
	const isEmpty = options?.isEmpty ?? false;
	const isOwner = options?.isOwner ?? false;

	let categories: ChannelCategory[] = [];
	let channels: Channel[] = [];

	if (!isEmpty) {
		const content = generateServerContent(serverId);
		categories = content.categories;
		channels = content.channels;
	}

	// Calculate total unread count across all channels
	const unreadCount = channels.reduce((sum, ch) => sum + ch.unreadCount, 0);

	// Helper to capitalize first letter
	const capitalize = (str: string) =>
		str.charAt(0).toUpperCase() + str.slice(1);

	return {
		id: serverId,
		name:
			options?.name ??
			faker.helpers.arrayElement([
				`${faker.company.name()} Community`,
				`${capitalize(faker.word.adjective())} ${capitalize(faker.word.noun())}`,
				`The ${capitalize(faker.hacker.noun())} Hub`,
			]),
		icon:
			options?.icon ??
			(Math.random() > 0.2
				? faker.image.url({ width: 128, height: 128 })
				: null),
		ownerId: isOwner ? "current-user" : faker.string.uuid(),
		memberCount: faker.number.int({ min: 10, max: 50000 }),
		isOwner,
		categories,
		channels,
		unreadCount,
		createdAt: faker.date.past({ years: 1 }),
	};
}

/**
 * Generate the initial set of servers for the app
 */
export function generateInitialServers(): Server[] {
	return [
		// Home server (special, always first)
		{
			id: "home",
			name: "Home",
			icon: null,
			ownerId: "current-user",
			memberCount: 1,
			isOwner: true,
			categories: [],
			channels: [],
			unreadCount: 0,
			createdAt: new Date("2026-01-01"),
		},
		// Bedrock Community (user's main server with full content)
		generateMockServer({
			id: "server-1",
			name: "Bedrock Community",
			icon: "💎",
			isOwner: true,
		}),
		// Additional servers
		generateMockServer({
			id: "server-2",
			name: "Tech Enthusiasts",
			icon: "🚀",
		}),
		generateMockServer({
			id: "server-3",
			name: "Gaming Hub",
			icon: "🎮",
		}),
		generateMockServer({
			id: "server-4",
			name: "Art & Design",
			icon: "🎨",
			isEmpty: Math.random() > 0.5, // 50% chance of being empty
		}),
	];
}

// Note: Mock data is now generated lazily by the store's init() function
// No module-level data generation to avoid blocking initial page load
