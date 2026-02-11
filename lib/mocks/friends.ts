import { faker } from "@faker-js/faker";
import type { Friend, FriendRequest, FriendStatus, FriendshipStatus } from "@/lib/types/friend";

/**
 * Generate a single mock friend
 */
export function generateMockFriend(options?: Partial<Friend>): Friend {
	const statusOptions: FriendStatus[] = ["online", "idle", "dnd", "offline"];
	const statusWeights = [0.3, 0.2, 0.1, 0.4]; // 30% online, 20% idle, 10% dnd, 40% offline

	const randomStatus = (): FriendStatus => {
		const random = Math.random();
		let sum = 0;
		for (let i = 0; i < statusWeights.length; i++) {
			sum += statusWeights[i];
			if (random < sum) return statusOptions[i];
		}
		return "offline";
	};

	const status = options?.status ?? randomStatus();
	const username = options?.username ?? faker.internet.username();

	return {
		id: options?.id ?? faker.string.uuid(),
		userId: options?.userId ?? faker.string.uuid(),
		username,
		displayName: options?.displayName ?? faker.person.fullName(),
		avatar: options?.avatar ?? faker.image.avatar(),
		status,
		customStatus: Math.random() > 0.6 ? faker.helpers.arrayElement([
			"🎮 Playing games",
			"🎧 Listening to music",
			"📚 Reading",
			"💻 Coding",
			"☕ Taking a break",
			"🎬 Watching movies",
			"🏃 Working out",
		]) : undefined,
		friendshipStatus: options?.friendshipStatus ?? "accepted",
		lastSeen: status === "offline" ? faker.date.recent({ days: 30 }) : undefined,
		createdAt: options?.createdAt ?? faker.date.past({ years: 2 }),
	};
}

/**
 * Generate mock friend requests
 */
export function generateMockFriendRequests(): {
	incoming: FriendRequest[];
	outgoing: FriendRequest[];
} {
	const incomingCount = faker.number.int({ min: 1, max: 5 });
	const outgoingCount = faker.number.int({ min: 0, max: 3 });

	const incoming: FriendRequest[] = Array.from({ length: incomingCount }, () => ({
		id: faker.string.uuid(),
		fromUserId: faker.string.uuid(),
		fromUsername: faker.internet.username(),
		fromDisplayName: faker.person.fullName(),
		fromAvatar: faker.image.avatar(),
		toUserId: "current-user-id", // Current user
		message: Math.random() > 0.5 ? faker.helpers.arrayElement([
			"Hey! Let's connect!",
			"I'd like to add you as a friend",
			"Found you through mutual friends!",
			"Let's chat sometime!",
		]) : undefined,
		createdAt: faker.date.recent({ days: 14 }),
		direction: "incoming",
	}));

	const outgoing: FriendRequest[] = Array.from({ length: outgoingCount }, () => ({
		id: faker.string.uuid(),
		fromUserId: "current-user-id", // Current user
		fromUsername: "You",
		fromDisplayName: "You",
		fromAvatar: "",
		toUserId: faker.string.uuid(),
		message: Math.random() > 0.7 ? "Hey! Want to connect?" : undefined,
		createdAt: faker.date.recent({ days: 7 }),
		direction: "outgoing",
	}));

	return { incoming, outgoing };
}

/**
 * Generate mock blocked users
 */
export function generateMockBlockedUsers(): Friend[] {
	const count = faker.number.int({ min: 0, max: 2 });
	return Array.from({ length: count }, () =>
		generateMockFriend({ friendshipStatus: "blocked", status: "offline" })
	);
}

/**
 * Generate initial friends data
 */
export function generateInitialFriends(): {
	friends: Friend[];
	requests: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
	blocked: Friend[];
} {
	const friendCount = faker.number.int({ min: 15, max: 25 });
	const friends = Array.from({ length: friendCount }, () => generateMockFriend());

	// Sort by online status first, then by name
	friends.sort((a, b) => {
		const statusOrder = { online: 0, idle: 1, dnd: 2, offline: 3 };
		const statusDiff = statusOrder[a.status] - statusOrder[b.status];
		if (statusDiff !== 0) return statusDiff;
		return a.displayName.localeCompare(b.displayName);
	});

	const requests = generateMockFriendRequests();
	const blocked = generateMockBlockedUsers();

	return { friends, requests, blocked };
}

// Note: Mock data is now generated lazily by the store's init() function
// No module-level data generation to avoid blocking initial page load
