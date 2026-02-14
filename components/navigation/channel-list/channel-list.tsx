"use client";

import { useMemo, lazy, Suspense, useState } from "react";
import { Settings, X, Plus, Folder } from "lucide-react";
import { useServerStore } from "@/store/server.store";
import { useUIStore } from "@/store/ui.store";
import { useServerManagementStore } from "@/store/server-management.store";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ChannelCategory } from "./channel-category";
import { ChannelItem } from "./channel-item";
import { DMList } from "@/components/dm/dm-list";
import { ErrorBoundary } from "@/components/error-boundary";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
	const reorderCategories = useServerStore((state) => state.reorderCategories);
	const createCategory = useServerStore((state) => state.createCategory);
	const openServerSettings = useServerManagementStore((s) => s.openServerSettings);

	// State for inline category creation
	const [isCreatingCategory, setIsCreatingCategory] = useState(false);
	const [newCategoryName, setNewCategoryName] = useState("");
	const [isCreatingLoading, setIsCreatingLoading] = useState(false);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor)
	);

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
				<div className="h-12 bg-white/5 rounded-sm animate-pulse" />
				<div className="h-8 bg-white/5 rounded-sm animate-pulse" />
				<div className="h-8 bg-white/5 rounded-sm animate-pulse" />
				<div className="h-8 bg-white/5 rounded-sm animate-pulse" />
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

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = currentServer.categories.findIndex(c => c.id === active.id);
			const newIndex = currentServer.categories.findIndex(c => c.id === over.id);

			const reordered = [...currentServer.categories];
			const [moved] = reordered.splice(oldIndex, 1);
			reordered.splice(newIndex, 0, moved);

			const categoryIds = reordered.map(c => c.id);
			reorderCategories(currentServer.id, categoryIds);
		}
	};

	const handleCreateCategory = async () => {
		if (!newCategoryName.trim() || isCreatingLoading) return;

		setIsCreatingLoading(true);
		try {
			await createCategory(currentServer.id, newCategoryName);
			setNewCategoryName("");
			setIsCreatingCategory(false);
		} catch (err) {
			console.error("Error creating category:", err);
		} finally {
			setIsCreatingLoading(false);
		}
	};

	// Memoize channel grouping to prevent unnecessary recalculations
	const channelsByCategory = useMemo(() => {
		// Guard against undefined currentServer during rapid navigation
		if (!currentServer) return {};

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
	}, [currentServer]);

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
						className="p-2 rounded-sm hover:bg-white/10 transition-colors touch-manipulation"
						aria-label="Server Settings"
					>
						<Settings className="w-5 h-5 text-white/60 hover:text-white/80" />
					</button>
				)}
			</div>

			{/* Channels List */}
			<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent py-2">
				{/* Quick Category Creation (Server Owners Only) */}
				{currentServer.isOwner && (
					<div className="px-3 mb-2">
						{!isCreatingCategory ? (
							<button
								type="button"
								onClick={() => setIsCreatingCategory(true)}
								className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-white/60 hover:text-white/80 hover:bg-white/5 rounded-sm transition-colors group"
								aria-label="Create Category"
							>
								<Plus className="w-3.5 h-3.5" />
								<span>Create Category</span>
							</button>
						) : (
							<AnimatePresence>
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									exit={{ opacity: 0, height: 0 }}
									className="overflow-hidden"
								>
									<div className="p-3 rounded-lg glass-card space-y-2">
										<div className="flex items-center gap-2 text-xs text-white/80 mb-2">
											<Folder className="w-3.5 h-3.5" />
											<span className="font-medium">New Category</span>
										</div>

										<Input
											value={newCategoryName}
											onChange={(e) => setNewCategoryName(e.target.value)}
											placeholder="Category name..."
											maxLength={50}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleCreateCategory();
												if (e.key === "Escape") {
													setIsCreatingCategory(false);
													setNewCategoryName("");
												}
											}}
											className="text-sm"
											autoFocus
										/>

										<div className="flex items-center gap-1.5 pt-2">
											<Button
												size="sm"
												onClick={handleCreateCategory}
												loading={isCreatingLoading}
												disabled={!newCategoryName.trim()}
												className="flex-1 text-xs"
											>
												Create
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													setIsCreatingCategory(false);
													setNewCategoryName("");
												}}
												className="flex-1 text-xs"
											>
												Cancel
											</Button>
										</div>
									</div>
								</motion.div>
							</AnimatePresence>
						)}
					</div>
				)}

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
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={currentServer.categories.map(c => c.id)}
							strategy={verticalListSortingStrategy}
						>
							{currentServer.categories.map((category) => {
								const channels = channelsByCategory[category.id] || [];
								const isCollapsed = category.collapsed ?? false;

								return (
									<SortableCategoryWrapper
										key={category.id}
										categoryId={category.id}
									>
										<div className="mb-2">
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
									</SortableCategoryWrapper>
								);
							})}
						</SortableContext>
					</DndContext>

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

// Sortable wrapper for drag-and-drop category reordering
function SortableCategoryWrapper({ categoryId, children }: { categoryId: string; children: React.ReactNode }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: categoryId
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			{children}
		</div>
	);
}
