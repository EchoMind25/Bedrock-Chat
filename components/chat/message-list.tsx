'use client';

import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMessageStore } from '@/store/message.store';
import { usePresenceStore } from '@/store/presence.store';
import { Message } from './message';
import { TypingIndicator } from './typing-indicator';
import { ScrollToBottom } from './scroll-to-bottom';
import type { Message as MessageType } from '@/lib/types/message';

// Stable empty array references to prevent Zustand selector reference instability.
// `|| []` creates a NEW array on every selector call when the key is undefined,
// causing re-renders on every unrelated store update (Object.is([], []) === false).
const EMPTY_MESSAGES: MessageType[] = [];
const EMPTY_STRINGS: string[] = [];

interface MessageListProps {
	channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const initializedRef = useRef<Set<string>>(new Set());

	// Read raw messages entry (may be undefined before first load).
	// Do NOT use `?? EMPTY_MESSAGES` here — undefined means "not yet loaded",
	// [] means "loaded with no messages". These are distinct states.
	const messagesRaw = useMessageStore((s) => s.messages[channelId]);
	const channelMessages = messagesRaw ?? EMPTY_MESSAGES;
	const hasLoaded = messagesRaw !== undefined; // a completed load attempt exists

	const isLoading = useMessageStore((s) => s.loadingChannels[channelId] ?? false);
	const hasError = useMessageStore((s) => s.loadErrors[channelId] ?? false);
	const typing = usePresenceStore((s) => s.typingUsers[channelId] ?? EMPTY_STRINGS);

	// Load messages and subscribe to real-time updates
	useEffect(() => {
		// Prevent multiple initializations for the same channel
		if (initializedRef.current.has(channelId)) {
			return;
		}

		initializedRef.current.add(channelId);

		// Call store methods directly to avoid unstable references
		useMessageStore.getState().loadMessages(channelId);
		useMessageStore.getState().subscribeToChannel(channelId);

		// Cleanup subscription when channel changes or component unmounts
		return () => {
			initializedRef.current.delete(channelId);
			useMessageStore.getState().unsubscribeFromChannel(channelId);
		};
	}, [channelId]); // Only depend on channelId

	// Virtual scrolling - CRITICAL: useFlushSync: false for React 19
	const virtualizer = useVirtualizer({
		count: channelMessages.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 80,
		overscan: 10,
	});

	const items = virtualizer.getVirtualItems();

	// Auto-scroll to bottom on new messages
	const lastMessageId = channelMessages[channelMessages.length - 1]?.id;
	useEffect(() => {
		const scrollElement = parentRef.current;
		if (!scrollElement) return;

		const isNearBottom =
			scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 200;

		if (isNearBottom) {
			virtualizer.scrollToIndex(channelMessages.length - 1, { align: 'end' });
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps -- virtualizer is intentionally excluded (unstable reference)
	}, [lastMessageId, channelMessages.length]);

	// Show skeleton while loading OR before the first load attempt resolves.
	// Without `!hasLoaded`, the component briefly flashes <EmptyMessages /> on
	// first render because messages[channelId] is undefined → length 0, before
	// the useEffect fires and loadingChannels[channelId] becomes true.
	if (isLoading || !hasLoaded) {
		return <MessageListSkeleton />;
	}

	if (hasError) {
		return <ChannelError channelId={channelId} />;
	}

	if (channelMessages.length === 0) {
		return <EmptyMessages />;
	}

	return (
		<div className="flex-1 relative">
			{/* Scrollable container */}
			<div
				ref={parentRef}
				className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin"
				style={{ contain: 'strict' }}
			>
				{/* Virtual spacer */}
				<div
					style={{
						height: virtualizer.getTotalSize(),
						width: '100%',
						position: 'relative',
					}}
				>
					{/* Virtual items */}
					<div
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							transform: `translateY(${items[0]?.start ?? 0}px)`,
						}}
					>
						{items.map((virtualRow) => {
							const message = channelMessages[virtualRow.index];
							const prevMessage = channelMessages[virtualRow.index - 1];

							// Group messages from same author within 5 minutes
							const isGrouped =
								prevMessage &&
								prevMessage.author.id === message.author.id &&
								message.timestamp.getTime() - prevMessage.timestamp.getTime() < 300000;

							return (
								<div
									key={virtualRow.key}
									data-index={virtualRow.index}
									ref={virtualizer.measureElement}
								>
									<Message message={message} isGrouped={isGrouped} channelId={channelId} />
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Typing indicator */}
			{typing.length > 0 && <TypingIndicator usernames={typing} />}

			{/* Scroll to bottom button */}
			<ScrollToBottom
				scrollRef={parentRef}
				onClick={() => virtualizer.scrollToIndex(channelMessages.length - 1, { align: 'end' })}
			/>
		</div>
	);
}

function MessageListSkeleton() {
	return (
		<div className="flex-1 p-4 space-y-4">
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex gap-4 animate-pulse">
					<div className="w-10 h-10 rounded-full bg-white/10" />
					<div className="flex-1 space-y-2">
						<div className="h-4 w-32 bg-white/10 rounded-sm" />
						<div className="h-4 w-full max-w-md bg-white/10 rounded-sm" />
					</div>
				</div>
			))}
		</div>
	);
}

function EmptyMessages() {
	return (
		<div className="flex-1 flex items-center justify-center">
			<div className="text-center">
				<div className="text-6xl mb-4">💬</div>
				<h3 className="text-xl font-semibold text-white">No messages yet</h3>
				<p className="text-white/60 mt-2">Start the conversation!</p>
			</div>
		</div>
	);
}

function ChannelError({ channelId }: { channelId: string }) {
	return (
		<div className="flex-1 flex items-center justify-center">
			<div className="text-center space-y-2">
				<h3 className="text-lg font-semibold text-white">Unable to load messages</h3>
				<p className="text-white/60 text-sm">Something went wrong. Check your connection and try again.</p>
				<button
					className="mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
					onClick={() => useMessageStore.getState().loadMessages(channelId)}
				>
					Try again
				</button>
			</div>
		</div>
	);
}
