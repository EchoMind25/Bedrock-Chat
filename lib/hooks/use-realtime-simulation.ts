'use client';

import { useEffect } from 'react';
import { useMessageStore } from '@/store/message.store';

/**
 * Simulates realtime message activity in a channel
 * - Random messages every 10-30 seconds
 * - Typing indicators before messages
 *
 * Performance: Lazy loads faker only when needed (not on initial page load)
 */
export function useRealtimeSimulation(channelId: string) {
	useEffect(() => {
		// Simulate random messages every 10-30 seconds
		const interval = setInterval(async () => {
			if (Math.random() > 0.5) {
				// Lazy load faker only when needed (not on initial page load)
				const { faker } = await import('@faker-js/faker');

				const username = faker.internet.username();

				// Simulate someone typing
				useMessageStore.getState().setTyping(channelId, username);

				// Then send message after typing
				setTimeout(() => {
					useMessageStore.getState().sendMessage(channelId, faker.lorem.sentence());
				}, 2000);
			}
		}, 15000 + Math.random() * 15000);

		return () => clearInterval(interval);
	}, [channelId]);
}
