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

	// Use individual selectors to prevent re-renders from unrelated state changes
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const checkAuth = useAuthStore((s) => s.checkAuth);

	const initServers = useServerStore((s) => s.init);
	const serversInitialized = useServerStore((s) => s.isInitialized);

	const initFriends = useFriendsStore((s) => s.init);
	const friendsInitialized = useFriendsStore((s) => s.isInitialized);

	const initDMs = useDMStore((s) => s.init);
	const dmsInitialized = useDMStore((s) => s.isInitialized);

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
			<div className="relative z-10">
				<ServerList />
			</div>

			{/* Channel List + User Panel - 240px */}
			<div className="relative z-10 flex flex-col w-60 bg-[oklch(0.15_0.02_250)]">
				<ChannelList />
				<UserPanel />
			</div>

			{/* Main Content Area - Flexible */}
			<main className="relative z-20 flex-1 flex flex-col overflow-hidden">{children}</main>
		</div>
	);
}
