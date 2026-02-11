'use client';

import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMessageStore } from '@/store/message.store';
import { Message } from './message';
import { TypingIndicator } from './typing-indicator';
import { ScrollToBottom } from './scroll-to-bottom';

interface MessageListProps {
	channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const { messages, isLoading, loadMessages, typingUsers } = useMessageStore();
	const channelMessages = messages[channelId] || [];
	const typing = typingUsers[channelId] || [];

	// Load messages on mount
	useEffect(() => {
		loadMessages(channelId);
	}, [channelId, loadMessages]);

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
	}, [lastMessageId, channelMessages.length, virtualizer]);

	if (isLoading) {
		return <MessageListSkeleton />;
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
				scrollElement={parentRef.current}
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
						<div className="h-4 w-32 bg-white/10 rounded" />
						<div className="h-4 w-full max-w-md bg-white/10 rounded" />
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
