import { faker } from '@faker-js/faker';
import type { Message, MessageAuthor, Reaction, Attachment } from '@/lib/types/message';

export function generateMockMessages(count: number): Message[] {
	const messages: Message[] = [];
	let currentDate = new Date();

	for (let i = 0; i < count; i++) {
		// Messages get progressively older
		currentDate = new Date(currentDate.getTime() - faker.number.int({ min: 10000, max: 3600000 }));

		messages.unshift({
			id: faker.string.uuid(),
			content: generateMessageContent(),
			author: generateAuthor(),
			timestamp: currentDate,
			editedAt: Math.random() > 0.95 ? new Date(currentDate.getTime() + 60000) : undefined,
			reactions: Math.random() > 0.8 ? generateReactions() : [],
			attachments: Math.random() > 0.9 ? generateAttachments() : [],
			embeds: [],
			replyTo: Math.random() > 0.9 && messages.length > 0
				? {
						id: messages[Math.floor(Math.random() * messages.length)].id,
						author: faker.internet.username(),
						content: faker.lorem.sentence().slice(0, 50),
					}
				: undefined,
			isPinned: Math.random() > 0.98,
			type: 'default',
		});
	}

	return messages;
}

function generateMessageContent(): string {
	const templates = [
		() => faker.lorem.sentence(),
		() => faker.lorem.sentences({ min: 2, max: 4 }),
		() => `Hey @${faker.internet.username()}, ${faker.lorem.sentence()}`,
		() => faker.hacker.phrase(),
		() => `\`\`\`js\n${faker.lorem.sentence()}\n\`\`\``,
		() => `> ${faker.lorem.sentence()}\n\n${faker.lorem.sentence()}`,
		() => `**${faker.word.adjective()}** ${faker.lorem.sentence()}`,
		() => faker.internet.emoji() + ' ' + faker.lorem.words(3),
	];
	return faker.helpers.arrayElement(templates)();
}

function generateAuthor(): MessageAuthor {
	return {
		id: faker.string.uuid(),
		username: faker.internet.username(),
		displayName: faker.person.fullName(),
		avatar: faker.image.avatar(),
		isBot: Math.random() > 0.95,
		roleColor: Math.random() > 0.5
			? faker.helpers.arrayElement(['#5865F2', '#57F287', '#FEE75C', '#EB459E', '#ED4245'])
			: undefined,
	};
}

function generateReactions(): Reaction[] {
	const emojis = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '💯', '🚀'];
	const count = faker.number.int({ min: 1, max: 4 });
	return faker.helpers.arrayElements(emojis, count).map(emoji => ({
		emoji,
		count: faker.number.int({ min: 1, max: 20 }),
		hasReacted: Math.random() > 0.8,
	}));
}

function generateAttachments(): Attachment[] {
	return [{
		id: faker.string.uuid(),
		filename: faker.system.fileName(),
		url: faker.image.url({ width: 400, height: 300 }),
		contentType: 'image/png',
		size: faker.number.int({ min: 10000, max: 5000000 }),
		width: 400,
		height: 300,
	}];
}
