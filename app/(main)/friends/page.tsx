"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFriendsStore } from "@/store/friends.store";
import { usePresenceStore } from "@/store/presence.store";
import type { FriendTab } from "@/store/friends.store";
import { FriendCard } from "@/components/friends/friend-card";
import { FriendRequestCard } from "@/components/friends/friend-request-card";
import { AddFriendModal } from "@/components/friends/add-friend-modal";
import { Input } from "@/components/ui/input/input";
import { Button } from "@/components/ui/button/button";

const tabs: { id: FriendTab; label: string }[] = [
	{ id: "all", label: "All" },
	{ id: "online", label: "Online" },
	{ id: "pending", label: "Pending" },
	{ id: "blocked", label: "Blocked" },
];

export default function FriendsPage() {
	const friends = useFriendsStore((state) => state.friends);
	const friendRequests = useFriendsStore((state) => state.friendRequests);
	const blockedUsers = useFriendsStore((state) => state.blockedUsers);
	const currentTab = useFriendsStore((state) => state.currentTab);
	const searchQuery = useFriendsStore((state) => state.searchQuery);
	const setCurrentTab = useFriendsStore((state) => state.setCurrentTab);
	const setSearchQuery = useFriendsStore((state) => state.setSearchQuery);
	const openAddFriendModal = useFriendsStore((state) => state.openAddFriendModal);
	const unblockUser = useFriendsStore((state) => state.unblockUser);
	const onlineUsers = usePresenceStore((state) => state.onlineUsers);

	const pendingCount = friendRequests.incoming.length + friendRequests.outgoing.length;

	const filteredFriends = useMemo(() => {
		let list = friends;

		if (currentTab === "online") {
			// Use real-time presence data for online filtering
			list = list.filter((f) => onlineUsers.has(f.userId));
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(f) =>
					f.displayName.toLowerCase().includes(q) ||
					f.username.toLowerCase().includes(q),
			);
		}

		return list;
	}, [friends, currentTab, searchQuery, onlineUsers]);

	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			{/* Header */}
			<div className="h-12 px-4 flex items-center gap-4 border-b border-white/10 bg-[oklch(0.15_0.02_250)] shrink-0">
				<svg
					className="w-5 h-5 text-white/60"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Friends</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
				<h1 className="font-semibold text-white">Friends</h1>

				{/* Tabs */}
				<div className="flex items-center gap-1 ml-4">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setCurrentTab(tab.id)}
							className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
								currentTab === tab.id
									? "bg-white/10 text-white"
									: "text-white/60 hover:text-white/80 hover:bg-white/5"
							}`}
						>
							{tab.label}
							{tab.id === "pending" && pendingCount > 0 && (
								<span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
									{pendingCount}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Add Friend Button */}
				<div className="ml-auto">
					<Button variant="primary" size="sm" onClick={openAddFriendModal}>
						Add Friend
					</Button>
				</div>
			</div>

			{/* Search */}
			{(currentTab === "all" || currentTab === "online") && (
				<div className="px-4 py-3 border-b border-white/5">
					<Input
						type="text"
						placeholder="Search friends..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="bg-[oklch(0.12_0.02_250)]! border-white/10!"
					/>
				</div>
			)}

			{/* Content */}
			<div className="flex-1 overflow-y-auto scrollbar-thin p-4">
				{/* All / Online tab */}
				{(currentTab === "all" || currentTab === "online") && (
					<div>
						<h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
							{currentTab === "online" ? "Online" : "All Friends"} &mdash; {filteredFriends.length}
						</h2>

						{filteredFriends.length === 0 ? (
							<EmptyState
								icon={
									<svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
								}
								title={currentTab === "online" ? "No friends online" : "No friends yet"}
								description={currentTab === "online" ? "Your friends will appear here when they're online." : "Add some friends to get started!"}
							/>
						) : (
							<motion.div
								className="grid gap-3"
								initial="hidden"
								animate="visible"
								variants={{
									visible: { transition: { staggerChildren: 0.05 } },
								}}
							>
								{filteredFriends.map((friend) => (
									<FriendCard key={friend.id} friend={friend} />
								))}
							</motion.div>
						)}
					</div>
				)}

				{/* Pending tab */}
				{currentTab === "pending" && (
					<div className="space-y-6">
						{/* Incoming */}
						<div>
							<h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
								Incoming &mdash; {friendRequests.incoming.length}
							</h2>
							{friendRequests.incoming.length === 0 ? (
								<p className="text-sm text-white/40 py-4">No incoming requests</p>
							) : (
								<motion.div
									className="grid gap-3"
									initial="hidden"
									animate="visible"
									variants={{
										visible: { transition: { staggerChildren: 0.05 } },
									}}
								>
									{friendRequests.incoming.map((request) => (
										<FriendRequestCard key={request.id} request={request} />
									))}
								</motion.div>
							)}
						</div>

						{/* Outgoing */}
						<div>
							<h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
								Outgoing &mdash; {friendRequests.outgoing.length}
							</h2>
							{friendRequests.outgoing.length === 0 ? (
								<p className="text-sm text-white/40 py-4">No outgoing requests</p>
							) : (
								<motion.div
									className="grid gap-3"
									initial="hidden"
									animate="visible"
									variants={{
										visible: { transition: { staggerChildren: 0.05 } },
									}}
								>
									{friendRequests.outgoing.map((request) => (
										<FriendRequestCard key={request.id} request={request} />
									))}
								</motion.div>
							)}
						</div>
					</div>
				)}

				{/* Blocked tab */}
				{currentTab === "blocked" && (
					<div>
						<h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
							Blocked &mdash; {blockedUsers.length}
						</h2>
						{blockedUsers.length === 0 ? (
							<EmptyState
								icon={
									<svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
									</svg>
								}
								title="No blocked users"
								description="Users you block will appear here."
							/>
						) : (
							<motion.div
								className="grid gap-3"
								initial="hidden"
								animate="visible"
								variants={{
									visible: { transition: { staggerChildren: 0.05 } },
								}}
							>
								{blockedUsers.map((user) => (
									<motion.div
										key={user.id}
										variants={{
											hidden: { opacity: 0, y: 20 },
											visible: { opacity: 1, y: 0 },
										}}
										className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5"
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-linear-to-br from-red-500/50 to-red-800/50 flex items-center justify-center">
												<span className="text-white font-semibold text-sm">
													{user.displayName.slice(0, 2).toUpperCase()}
												</span>
											</div>
											<div>
												<p className="text-sm font-medium text-white">{user.displayName}</p>
												<p className="text-xs text-white/40">@{user.username}</p>
											</div>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => unblockUser(user.userId)}
										>
											Unblock
										</Button>
									</motion.div>
								))}
							</motion.div>
						)}
					</div>
				)}
			</div>

			{/* Add Friend Modal */}
			<AddFriendModal />
		</div>
	);
}

function EmptyState({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 260, damping: 20 }}
			className="flex flex-col items-center justify-center py-16"
		>
			<div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
				{icon}
			</div>
			<p className="text-white/60 font-medium">{title}</p>
			<p className="text-sm text-white/40 mt-1">{description}</p>
		</motion.div>
	);
}
