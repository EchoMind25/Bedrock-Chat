"use client";

import { use, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";
import { useMemberStore } from "@/store/member.store";

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
	const router = useRouter();
	const mountedRef = useRef(true);
	const hasRedirectedRef = useRef(false);

	// Track unmount to prevent competing router calls during navigation
	useEffect(() => {
		mountedRef.current = true;
		hasRedirectedRef.current = false;
		return () => {
			mountedRef.current = false;
		};
	}, [serverId, channelId]);

	// Use individual selectors to prevent re-renders from unrelated state changes
	const setCurrentServer = useServerStore((s) => s.setCurrentServer);
	const setCurrentChannel = useServerStore((s) => s.setCurrentChannel);
	const servers = useServerStore((s) => s.servers);
	const isInitialized = useServerStore((s) => s.isInitialized);

	// Derive server and channel from URL params directly (not store currentIds)
	// This prevents race conditions where the store hasn't updated yet
	const server = useMemo(
		() => servers.find((s) => s.id === serverId),
		[servers, serverId]
	);
	const channel = useMemo(
		() => server?.channels.find((c) => c.id === channelId),
		[server, channelId]
	);

	// Live member count from member store, fallback to server.memberCount
	const memberStoreCount = useMemberStore((s) => s.membersByServer[serverId]?.length ?? 0);
	const liveMemberCount = memberStoreCount || server?.memberCount || 0;

	// Update store when URL changes (with defensive checks to prevent loops)
	useEffect(() => {
		if (!serverId || !channelId || !mountedRef.current) return;

		// Only update if different from current store state
		const state = useServerStore.getState();
		if (state.currentServerId !== serverId) {
			setCurrentServer(serverId);
		}
		if (state.currentChannelId !== channelId) {
			setCurrentChannel(channelId);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [serverId, channelId]); // Exclude store actions - stable Zustand actions

	// Show loading skeleton while stores are initializing
	if (!isInitialized) {
		return (
			<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
				<ChannelLoadingSkeleton />
			</div>
		);
	}

	// Redirect to a valid channel if URL contains stale/invalid IDs
	// Guard: only redirect once and only if component is still mounted
	if (!server || !channel) {
		if (mountedRef.current && !hasRedirectedRef.current) {
			hasRedirectedRef.current = true;
			const fallbackServer = server || servers.find((s) => s.id !== "home" && s.channels.length > 0);
			const fallbackChannel = fallbackServer?.channels.find((c) => c.type === "text") || fallbackServer?.channels[0];
			if (fallbackServer && fallbackChannel) {
				router.replace(`/servers/${fallbackServer.id}/${fallbackChannel.id}`);
			} else {
				router.replace("/friends");
			}
		}
		return (
			<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
				<ChannelLoadingSkeleton />
			</div>
		);
	}

	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			<Suspense fallback={<ChannelLoadingSkeleton />}>
				{/* Channel Header */}
				<ChannelHeader channel={channel} memberCount={liveMemberCount} />

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
				<div className="w-5 h-5 bg-white/10 rounded-sm animate-pulse" />
				<div className="h-4 w-32 bg-white/10 rounded-sm animate-pulse" />
			</div>

			{/* Messages skeleton */}
			<div className="flex-1 p-4 space-y-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="flex gap-4 animate-pulse">
						<div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-32 bg-white/10 rounded-sm" />
							<div className="h-4 w-full max-w-md bg-white/10 rounded-sm" />
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
