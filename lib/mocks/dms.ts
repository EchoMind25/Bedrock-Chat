import { faker } from "@faker-js/faker";
import type { DirectMessage, DMParticipant } from "@/lib/types/dm";
import type { Friend } from "@/lib/types/friend";

/**
 * Generate a DM participant from a friend
 */
function generateDMParticipant(friend: Friend): DMParticipant {
	return {
		id: faker.string.uuid(),
		userId: friend.userId,
		username: friend.username,
		displayName: friend.displayName,
		avatar: friend.avatar,
		status: friend.status,
	};
}

/**
 * Generate a single mock DM
 */
export function generateMockDM(friend: Friend, hasUnread = false): DirectMessage {
	const hasLastMessage = Math.random() > 0.1; // 90% chance of having a message

	const lastMessageTemplates = [
		"Hey! How's it going?",
		"Did you see that?",
		"Thanks for your help!",
		"Sure, sounds good!",
		"Let me know when you're free",
		"Haha that's funny 😂",
		"I'll check it out later",
		"Great idea!",
		"See you tomorrow",
		"No problem at all!",
	];

	return {
		id: `dm-${friend.id}`,
		participants: [
			generateDMParticipant(friend),
			{
				id: faker.string.uuid(),
				userId: "current-user-id",
				username: "You",
				displayName: "You",
				avatar: "",
				status: "online",
			},
		],
		lastMessage: hasLastMessage
			? {
					content: faker.helpers.arrayElement(lastMessageTemplates),
					timestamp: faker.date.recent({ days: 7 }),
					authorId: Math.random() > 0.5 ? friend.userId : "current-user-id",
			  }
			: undefined,
		unreadCount: hasUnread || Math.random() > 0.7
			? faker.number.int({ min: 1, max: 15 })
			: 0,
		isEncrypted: true, // All DMs are encrypted
		createdAt: faker.date.past({ years: 1 }),
	};
}

/**
 * Generate initial DM conversations from friends
 */
export function generateInitialDMs(friends: Friend[]): DirectMessage[] {
	// Select 5-8 friends for DM conversations
	const dmCount = faker.number.int({ min: 5, max: Math.min(8, friends.length) });
	const selectedFriends = faker.helpers.shuffle(friends).slice(0, dmCount);

	const dms = selectedFriends.map((friend) => {
		const hasUnread = Math.random() > 0.7; // 30% chance of unread
		return generateMockDM(friend, hasUnread);
	});

	// Sort by last message timestamp (most recent first)
	dms.sort((a, b) => {
		const aTime = a.lastMessage?.timestamp?.getTime() ?? 0;
		const bTime = b.lastMessage?.timestamp?.getTime() ?? 0;
		return bTime - aTime;
	});

	return dms;
}

// Note: Mock data is now generated lazily by the store's init() function
// No module-level data generation to avoid blocking initial page load

// Helper functions that operate on passed-in data
export function getDMByUserId(userId: string, dms: DirectMessage[]): DirectMessage | undefined {
	return dms.find((dm) => dm.participants.some((p) => p.userId === userId));
}

export function getTotalUnreadCount(dms: DirectMessage[]): number {
	return dms.reduce((sum, dm) => sum + dm.unreadCount, 0);
}
