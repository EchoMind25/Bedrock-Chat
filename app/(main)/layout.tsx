"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useServerStore } from "@/store/server.store";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { ServerList } from "@/components/navigation/server-list/server-list";
import { ChannelList } from "@/components/navigation/channel-list/channel-list";
import { UserPanel } from "@/components/navigation/user-panel/user-panel";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { isAuthenticated, user, checkAuth } = useAuthStore();
	const { init: initServers, isInitialized: serversInitialized } = useServerStore();
	const { init: initFriends, isInitialized: friendsInitialized } = useFriendsStore();
	const { init: initDMs, isInitialized: dmsInitialized } = useDMStore();

	// Check auth with Supabase on mount (picks up sessions from callback redirect)
	useEffect(() => {
		checkAuth();
	}, [checkAuth]);

	// Initialize all stores in parallel for maximum performance
	useEffect(() => {
		if (!serversInitialized) {
			initServers();
		}
		if (!friendsInitialized) {
			initFriends();
		}
		if (!dmsInitialized) {
			initDMs();
		}
	}, [initServers, serversInitialized, initFriends, friendsInitialized, initDMs, dmsInitialized]);

	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, router]);

	// Only block on authentication, not on data loading
	if (!isAuthenticated || !user) {
		return (
			<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-white/60">
						Loading Bedrock Chat...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[oklch(0.12_0.02_250)]">
			{/* Server List - 72px */}
			<ServerList />

			{/* Channel List + User Panel - 240px */}
			<div className="flex flex-col w-60 bg-[oklch(0.15_0.02_250)]">
				<ChannelList />
				<UserPanel />
			</div>

			{/* Main Content Area - Flexible */}
			<main className="flex-1 flex flex-col overflow-hidden">{children}</main>
		</div>
	);
}
