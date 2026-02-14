"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useServerStore } from "@/store/server.store";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { useUIStore } from "@/store/ui.store";
import { useIsMobile } from "@/lib/hooks/use-media-query";
import { ServerList } from "@/components/navigation/server-list/server-list";
import { ChannelList } from "@/components/navigation/channel-list/channel-list";
import { UserPanel } from "@/components/navigation/user-panel/user-panel";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { PortalOverlay } from "@/components/navigation/portal-overlay";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorRecovery } from "@/components/error-recovery";
import { useIdleDetection } from "@/lib/hooks/use-idle-detection";
import { initPerformanceMonitoring } from "@/store/performance.store";
import { PerformanceMonitor } from "@/lib/performance/monitoring";
import { PerformanceOverlay } from "@/components/performance/PerformanceOverlay";
import { PerformanceDashboard } from "@/components/performance/PerformanceDashboard";
import { logError } from "@/lib/utils/error-logger";

const MAX_INIT_ATTEMPTS = 3;
const INIT_TIMEOUT_MS = 30000; // 30 seconds

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
	const serversInitialized = useServerStore((s) => s.isInitialized);

	// Circuit breaker and error recovery state
	const [initError, setInitError] = useState<string | null>(null);
	const [loadingStage, setLoadingStage] = useState<"auth" | "servers" | "ready">("auth");

	// Idle detection: pauses CSS animations after 30s of inactivity
	const isIdle = useIdleDetection();

	// Mobile detection
	const isMobile = useIsMobile();

	// Initialize enhanced performance monitoring pipeline
	useEffect(() => {
		const cleanup = initPerformanceMonitoring();
		return cleanup;
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (isIdle) {
			root.classList.add("idle");
		} else {
			root.classList.remove("idle");
		}
		useUIStore.getState().setIdle(isIdle);

		// Sync idle state to performance monitor for threshold switching
		PerformanceMonitor.getInstance().setIdleState(isIdle);
	}, [isIdle]);

	// Sync mobile detection to UI store
	useEffect(() => {
		useUIStore.getState().setMobile(isMobile);
	}, [isMobile]);

	// Coordinated initialization: auth first, then data stores
	useEffect(() => {
		let cancelled = false;

		async function initialize() {
			// Check circuit breaker
			const storedAttempts = parseInt(localStorage.getItem("bedrock-init-attempts") || "0", 10);
			if (storedAttempts >= MAX_INIT_ATTEMPTS) {
				setInitError("Too many failed initialization attempts. Please clear cache.");
				logError("STORE_INIT", new Error("Circuit breaker: max init attempts exceeded"));
				return;
			}

			try {
				// Increment attempt counter
				localStorage.setItem("bedrock-init-attempts", String(storedAttempts + 1));

				// Create timeout promise
				const timeoutPromise = new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error("Initialization timeout after 30s")), INIT_TIMEOUT_MS)
				);

				// Create initialization promise
				const initPromise = async () => {
					setLoadingStage("auth");
					const authState = useAuthStore.getState();
					const hasPersistedAuth = authState.isAuthenticated && authState.user;

					if (hasPersistedAuth) {
						// Trust persisted auth — render the app immediately instead of
						// blocking on a network call. Verify session in background.
						if (authState.isInitializing) {
							useAuthStore.setState({ isInitializing: false });
						}
						useAuthStore.getState().checkAuth().catch(() => {});
					} else {
						// No persisted auth — must wait for verification
						await useAuthStore.getState().checkAuth();
						if (cancelled) return;
					}

					// Step 2: Only init data stores if authenticated
					const { isAuthenticated: authed } = useAuthStore.getState();
					if (!authed) return;

					// Step 2.5: DEV MODE - Ensure user is member of all servers (fire-and-forget to not block init)
					if (process.env.NODE_ENV !== "production") {
						import("@/lib/dev-mode-helpers")
							.then(({ ensureUserInAllServers }) => ensureUserInAllServers())
							.catch(() => {});
					}

					// Step 3: Init stores (servers awaited, friends/dm fire-and-forget)
					setLoadingStage("servers");
					const serverState = useServerStore.getState();
					const friendsState = useFriendsStore.getState();
					const dmState = useDMStore.getState();

					const promises: Promise<void>[] = [];
					if (!serverState.isInitialized) promises.push(serverState.loadServers());
					// Note: init() methods are synchronous wrappers that kick off async work
					// They set isInitialized = true internally after loading completes
					if (!friendsState.isInitialized) friendsState.init();
					if (!dmState.isInitialized) dmState.init();

					// Await server loading so child pages can rely on server data
					if (promises.length > 0) await Promise.all(promises);

					setLoadingStage("ready");
				};

				// Race between initialization and timeout
				await Promise.race([initPromise(), timeoutPromise]);

				// Success - reset circuit breaker
				localStorage.removeItem("bedrock-init-attempts");
			} catch (err) {
				if (!cancelled) {
					logError("STORE_INIT", err);
					setInitError(err instanceof Error ? err.message : "Initialization failed");
				}
			}
		}

		initialize();
		return () => {
			cancelled = true;
		};
	}, []);

	// Set up Supabase auth state change listener (token refresh, sign out, etc.)
	useEffect(() => {
		try {
			const unsubscribe = useAuthStore.getState().initAuthListener();
			return unsubscribe;
		} catch {
			// Supabase client may fail to initialize (e.g. missing env vars)
		}
	}, []);

	// Redirect to login only after auth check completes
	useEffect(() => {
		if (isInitializing) return;
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, isInitializing, router]);

	// Show error recovery UI if initialization failed
	if (initError) {
		return <ErrorRecovery error={initError} onRetry={() => window.location.reload()} />;
	}

	// Show loading while auth is being checked
	// BUT skip if servers are already loaded (user came from entrance transition)
	if (isInitializing && !serversInitialized) {
		return (
			<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-white/60">
						{loadingStage === "auth" && "Verifying authentication..."}
						{loadingStage === "servers" && "Loading your servers..."}
						{loadingStage === "ready" && "Almost ready..."}
					</p>
					<div className="mt-2 flex items-center justify-center gap-1">
						<div className={`w-2 h-2 rounded-full ${loadingStage === "auth" ? "bg-primary" : "bg-white/20"}`} />
						<div className={`w-2 h-2 rounded-full ${loadingStage === "servers" ? "bg-primary" : "bg-white/20"}`} />
						<div className={`w-2 h-2 rounded-full ${loadingStage === "ready" ? "bg-primary" : "bg-white/20"}`} />
					</div>
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
			{/* Skip to main content link for keyboard users */}
			<a
				href="#main-content"
				className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
			>
				Skip to main content
			</a>

			{/* Desktop: Server List - 72px (hidden on mobile) */}
			{!isMobile && (
				<ErrorBoundary level="feature" name="ServerList">
					<div className="relative z-10">
						<ServerList />
					</div>
				</ErrorBoundary>
			)}

			{/* Desktop: Channel List + User Panel - 240px (hidden on mobile) */}
			{!isMobile && (
				<ErrorBoundary level="feature" name="ChannelList">
					<div className="relative z-10 flex flex-col w-60 bg-[oklch(0.15_0.02_250)]">
						<ChannelList />
						<UserPanel />
					</div>
				</ErrorBoundary>
			)}

			{/* Mobile: Slide-over sidebars (rendered within ServerList/ChannelList) */}
			{isMobile && (
				<>
					<ErrorBoundary level="feature" name="ServerList">
						<ServerList />
					</ErrorBoundary>
					<ErrorBoundary level="feature" name="ChannelList">
						<ChannelList />
					</ErrorBoundary>
				</>
			)}

			{/* Main Content Area - Flexible */}
			<ErrorBoundary level="page" name="MainContent">
				<main
					id="main-content"
					className="relative z-20 flex-1 flex flex-col overflow-hidden"
					style={
						isMobile
							? { paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }
							: undefined
					}
				>
					{children}
				</main>
			</ErrorBoundary>

			{/* Mobile: Bottom Navigation */}
			{isMobile && (
				<ErrorBoundary level="feature" name="MobileNav">
					<MobileNav />
				</ErrorBoundary>
			)}

			{/* Portal transition overlay */}
			<PortalOverlay />

			{/* Performance monitoring overlays */}
			<PerformanceOverlay />
			<PerformanceDashboard />
		</div>
	);
}
