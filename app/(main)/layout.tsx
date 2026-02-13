"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useServerStore } from "@/store/server.store";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { useUIStore } from "@/store/ui.store";
import { ServerList } from "@/components/navigation/server-list/server-list";
import { ChannelList } from "@/components/navigation/channel-list/channel-list";
import { UserPanel } from "@/components/navigation/user-panel/user-panel";
import { PortalOverlay } from "@/components/navigation/portal-overlay";
import { ErrorBoundary } from "@/components/error-boundary";
import { useIdleDetection } from "@/lib/hooks/use-idle-detection";
import { usePerformanceMonitor } from "@/lib/hooks/use-performance-monitor";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();

	// Only subscribe to state needed for rendering (3 selectors, not 9)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const isInitializing = useAuthStore((s) => s.isInitializing);

	// Idle detection: pauses CSS animations after 30s of inactivity
	const isIdle = useIdleDetection();
	usePerformanceMonitor();

	useEffect(() => {
		const root = document.documentElement;
		if (isIdle) {
			root.classList.add("idle");
		} else {
			root.classList.remove("idle");
		}
		useUIStore.getState().setIdle(isIdle);
	}, [isIdle]);

	// Coordinated initialization: auth first, then data stores
	useEffect(() => {
		let cancelled = false;

		async function initialize() {
			// Step 1: Check auth with Supabase (sets isInitializing to false)
			await useAuthStore.getState().checkAuth();
			if (cancelled) return;

			// Step 2: Only init data stores if authenticated
			const { isAuthenticated: authed } = useAuthStore.getState();
			if (!authed) return;

			// Step 3: Init stores in parallel via getState() (no subscriptions needed)
			const serverState = useServerStore.getState();
			const friendsState = useFriendsStore.getState();
			const dmState = useDMStore.getState();

			if (!serverState.isInitialized) serverState.init();
			if (!friendsState.isInitialized) friendsState.init();
			if (!dmState.isInitialized) dmState.init();
		}

		initialize();
		return () => { cancelled = true; };
	}, []);

	// Set up Supabase auth state change listener (token refresh, sign out, etc.)
	useEffect(() => {
		const unsubscribe = useAuthStore.getState().initAuthListener();
		return unsubscribe;
	}, []);

	// Redirect to login only after auth check completes
	useEffect(() => {
		if (isInitializing) return;
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isInitializing, router]);

	// Show loading while auth is being checked
	if (isInitializing) {
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

	// After init, if not authenticated the redirect effect above handles it
	if (!isAuthenticated || !user) {
		return (
			<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-white/60">
						Redirecting...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[oklch(0.12_0.02_250)]">
			{/* Server List - 72px */}
			<ErrorBoundary level="feature" name="ServerList">
				<div className="relative z-10">
					<ServerList />
				</div>
			</ErrorBoundary>

			{/* Channel List + User Panel - 240px */}
			<ErrorBoundary level="feature" name="ChannelList">
				<div className="relative z-10 flex flex-col w-60 bg-[oklch(0.15_0.02_250)]">
					<ChannelList />
					<UserPanel />
				</div>
			</ErrorBoundary>

			{/* Main Content Area - Flexible */}
			<ErrorBoundary level="page" name="MainContent">
				<main className="relative z-20 flex-1 flex flex-col overflow-hidden">{children}</main>
			</ErrorBoundary>

			{/* Portal transition overlay */}
			<PortalOverlay />
		</div>
	);
}
