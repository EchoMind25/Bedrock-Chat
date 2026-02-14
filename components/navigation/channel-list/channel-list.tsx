"use client";

import { useMemo, lazy, Suspense } from "react";
import { Settings, X } from "lucide-react";
import { useServerStore } from "@/store/server.store";
import { useUIStore } from "@/store/ui.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ChannelCategory } from "./channel-category";
import { ChannelItem } from "./channel-item";
import { DMList } from "@/components/dm/dm-list";
import { ErrorBoundary } from "@/components/error-boundary";
import { motion, AnimatePresence } from "motion/react";

// Lazy load modal components for better performance (30% smaller initial bundle)
const ServerSettingsModal = lazy(() => import("@/components/server-management/modals/server-settings-modal/server-settings-modal").then(m => ({ default: m.ServerSettingsModal })));
const AddServerModal = lazy(() => import("@/components/server-management/modals/add-server-modal").then(m => ({ default: m.AddServerModal })));
const CreateChannelModal = lazy(() => import("@/components/server-management/modals/create-channel-modal").then(m => ({ default: m.CreateChannelModal })));
const ChannelSettingsModal = lazy(() => import("@/components/server-management/modals/channel-settings-modal/channel-settings-modal").then(m => ({ default: m.ChannelSettingsModal })));

export function ChannelList() {
	// Derive currentServer from primitive selectors instead of calling getCurrentServer()
	// which is a function call inside a selector (anti-pattern for Zustand equality checks)
	const currentServerId = useServerStore((state) => state.currentServerId);
	const servers = useServerStore((state) => state.servers);
	const currentServer = useMemo(
		() => servers.find((s) => s.id === currentServerId),
		[servers, currentServerId]
	);
	const isInitialized = useServerStore((state) => state.isInitialized);
	const currentChannelId = useServerStore((state) => state.currentChannelId);
	const toggleCategoryStore = useServerStore((state) => state.toggleCategory);
	const openServerSettings = useServerManagementStore((s) => s.openServerSettings);

	const isMobile = useIsMobile();
	const isMobileChannelListOpen = useUIStore(
		(state) => state.isMobileChannelListOpen
	);
	const setMobileChannelListOpen = useUIStore(
		(state) => state.setMobileChannelListOpen
	);

	// Check if we're in home/DM context
	const isHomeContext = currentServer?.id === "home";

	// Show loading state while initializing
	if (!isInitialized || !currentServer) {
		const loadingContent = (
			<div className="w-60 h-screen bg-[oklch(0.15_0.02_250)] flex flex-col gap-2 p-3">
				<div className="h-12 bg-white/5 rounded animate-pulse" />
				<div className="h-8 bg-white/5 rounded animate-pulse" />
				<div className="h-8 bg-white/5 rounded animate-pulse" />
				<div className="h-8 bg-white/5 rounded animate-pulse" />
				{/* AddServerModal must always render so the + button works even during load failures */}
				<Suspense fallback={null}>
					<ErrorBoundary level="component" name="Modals">
						<AddServerModal />
					</ErrorBoundary>
				</Suspense>
			</div>
		);

		if (isMobile) {
			return (
				<>
					<AnimatePresence>
						{isMobileChannelListOpen && (
							<>
								<motion.div
									className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={() => setMobileChannelListOpen(false)}
									aria-hidden="true"
								/>
								<motion.div
									className="fixed left-0 top-0 bottom-0 z-50"
									initial={{ x: -280 }}
									animate={{ x: 0 }}
									exit={{ x: -280 }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								>
									{loadingContent}
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</>
			);
		}

		return loadingContent;
	}

	// Show DM list when in home context
	if (isHomeContext) {
		const dmContent = (
			<div className="w-60 h-screen bg-[oklch(0.15_0.02_250)] flex flex-col">
				<DMList />
				{/* Modals must always render so Add Server works from home screen */}
				<Suspense fallback={null}>
					<ErrorBoundary level="component" name="Modals">
						<AddServerModal />
						<CreateChannelModal />
					</ErrorBoundary>
				</Suspense>
			</div>
		);

		if (isMobile) {
			return (
				<>
					<AnimatePresence>
						{isMobileChannelListOpen && (
							<>
								<motion.div
									className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={() => setMobileChannelListOpen(false)}
									aria-hidden="true"
								/>
								<motion.div
									className="fixed left-0 top-0 bottom-0 z-50"
									style={{
										paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
									}}
									initial={{ x: -280 }}
									animate={{ x: 0 }}
									exit={{ x: -280 }}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								>
									{dmContent}
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</>
			);
		}

		return dmContent;
	}

	const toggleCategory = (categoryId: string) => {
		toggleCategoryStore(currentServer.id, categoryId);
	};

	// Memoize channel grouping to prevent unnecessary recalculations
	const channelsByCategory = useMemo(() => {
		// Group channels by category
		const grouped = currentServer.channels.reduce(
			(acc, channel) => {
				const categoryId = channel.categoryId || "uncategorized";
				if (!acc[categoryId]) {
					acc[categoryId] = [];
				}
				acc[categoryId].push(channel);
				return acc;
			},
			{} as Record<string, typeof currentServer.channels>
		);

		// Sort channels by position within each category
		for (const categoryId of Object.keys(grouped)) {
			grouped[categoryId].sort((a, b) => a.position - b.position);
		}

		return grouped;
	}, [currentServer.channels]);

	const channelListContent = (
		<div className="w-60 h-screen bg-[oklch(0.15_0.02_250)] flex flex-col">
			{/* Server Header */}
			<div className="h-12 px-4 flex items-center justify-between border-b border-white/10 hover:bg-white/5 transition-colors group">
				{isMobile && (
					<button
						type="button"
						onClick={() => setMobileChannelListOpen(false)}
						className="p-2 -ml-2 text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors touch-manipulation"
						aria-label="Close channel list"
					>
						<X className="w-5 h-5" />
					</button>
				)}
				<h2 className="font-semibold text-white truncate flex-1">
					{currentServer.name}
				</h2>
				{currentServer.isOwner && (
					<button
						type="button"
						onClick={() => openServerSettings()}
						className="p-2 rounded hover:bg-white/10 transition-colors touch-manipulation"
						aria-label="Server Settings"
					>
						<Settings className="w-5 h-5 text-white/60 hover:text-white/80" />
					</button>
				)}
			</div>

			{/* Channels List */}
			<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-2">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={{
						hidden: { opacity: 0 },
						visible: {
							opacity: 1,
							transition: {
								staggerChildren: 0.03,
							},
						},
					}}
				>
					{currentServer.categories.map((category) => {
						const channels = channelsByCategory[category.id] || [];
						const isCollapsed = category.collapsed ?? false;

						return (
							<div key={category.id} className="mb-2">
								<ChannelCategory
									category={category}
									isCollapsed={isCollapsed}
									onToggle={() => toggleCategory(category.id)}
								/>
								{!isCollapsed && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										transition={{ duration: 0.2 }}
									>
										{channels.map((channel) => (
											<ChannelItem
												key={channel.id}
												channel={channel}
												isActive={currentChannelId === channel.id}
											/>
										))}
									</motion.div>
								)}
							</div>
						);
					})}

					{/* Uncategorized channels */}
					{channelsByCategory.uncategorized && (
						<div>
							{channelsByCategory.uncategorized.map((channel) => (
								<ChannelItem
									key={channel.id}
									channel={channel}
									isActive={currentChannelId === channel.id}
								/>
							))}
						</div>
					)}
				</motion.div>
			</div>

			{/* Modals - Lazy loaded for performance */}
			<Suspense fallback={null}>
				<ErrorBoundary level="component" name="Modals">
					<ServerSettingsModal />
					<AddServerModal />
					<CreateChannelModal />
					<ChannelSettingsModal />
				</ErrorBoundary>
			</Suspense>
		</div>
	);

	// Mobile: slide-over overlay pattern
	if (isMobile) {
		return (
			<>
				<AnimatePresence>
					{isMobileChannelListOpen && (
						<>
							{/* Dark overlay backdrop */}
							<motion.div
								className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setMobileChannelListOpen(false)}
								aria-hidden="true"
							/>

							{/* Slide-over panel */}
							<motion.div
								className="fixed left-0 top-0 bottom-0 z-50"
								style={{
									paddingBottom: "calc(56px + env(safe-area-inset-bottom))",
								}}
								initial={{ x: -280 }}
								animate={{ x: 0 }}
								exit={{ x: -280 }}
								transition={{ type: "spring", stiffness: 300, damping: 30 }}
							>
								{channelListContent}
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</>
		);
	}

	// Desktop: persistent sidebar
	return channelListContent;
}
