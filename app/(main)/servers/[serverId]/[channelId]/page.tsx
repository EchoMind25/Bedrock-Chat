"use client";

import { use, useEffect, lazy, Suspense } from "react";
import { useServerStore } from "@/store/server.store";
import { Glass } from "@/components/ui/glass/glass";
import { useRealtimeSimulation } from "@/lib/hooks/use-realtime-simulation";

// Lazy load heavy chat components (includes @tanstack/react-virtual)
const ChannelHeader = lazy(() =>
	import("@/components/chat/channel-header").then(m => ({ default: m.ChannelHeader }))
);
const MessageList = lazy(() =>
	import("@/components/chat/message-list").then(m => ({ default: m.MessageList }))
);
const MessageInput = lazy(() =>
	import("@/components/chat/message-input").then(m => ({ default: m.MessageInput }))
);

interface PageProps {
	params: Promise<{
		serverId: string;
		channelId: string;
	}>;
}

export default function ChannelPage({ params }: PageProps) {
	const { serverId, channelId } = use(params);
	const { setCurrentServer, setCurrentChannel, getCurrentServer, getCurrentChannel } = useServerStore();

	// Update store when URL changes
	useEffect(() => {
		if (serverId && channelId) {
			setCurrentServer(serverId);
			setCurrentChannel(channelId);
		}
	}, [serverId, channelId, setCurrentServer, setCurrentChannel]);

	// Enable realtime simulation
	useRealtimeSimulation(channelId);

	const server = getCurrentServer();
	const channel = getCurrentChannel();

	if (!server || !channel) {
		return (
			<div className="flex-1 flex items-center justify-center bg-[oklch(0.14_0.02_250)]">
				<Glass variant="strong" border="medium" className="p-8 text-center">
					<h2 className="text-xl font-semibold text-white mb-2">
						Channel Not Found
					</h2>
					<p className="text-white/60">
						The channel you're looking for doesn't exist.
					</p>
				</Glass>
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			<Suspense fallback={<ChannelLoadingSkeleton />}>
				{/* Channel Header */}
				<ChannelHeader channel={channel} memberCount={server.memberCount} />

				{/* Message List */}
				<MessageList channelId={channelId} />

				{/* Message Input */}
				<MessageInput channelId={channelId} channelName={channel.name} />
			</Suspense>
		</div>
	);
}

function ChannelLoadingSkeleton() {
	return (
		<>
			{/* Header skeleton */}
			<div className="h-12 border-b border-white/10 flex items-center px-4 gap-2">
				<div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
				<div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
			</div>

			{/* Messages skeleton */}
			<div className="flex-1 p-4 space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex gap-4 animate-pulse">
						<div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-32 bg-white/10 rounded" />
							<div className="h-4 w-full max-w-md bg-white/10 rounded" />
						</div>
					</div>
				))}
			</div>

			{/* Input skeleton */}
			<div className="p-4">
				<div className="h-16 bg-white/10 rounded-2xl animate-pulse" />
			</div>
		</>
	);
}
