"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { useServerStore } from "@/store/server.store";
import { useFriendsStore } from "@/store/friends.store";
import { useDMStore } from "@/store/dm.store";
import { useUIStore } from "@/store/ui.store";
import { useFavoritesStore } from "@/store/favorites.store";
import { usePresenceStore } from "@/store/presence.store";
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

const MemberListPanel = lazy(() =>
	import("@/components/navigation/member-list/member-list-panel").then((m) => ({
		default: m.MemberListPanel,
	}))
);

const MAX_INIT_ATTEMPTS = 3;
const INIT_TIMEOUT_MS = 10000; // 10 seconds

export function MainLayoutClient({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();

	// Only subscribe to state needed for rendering
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

	// Initialize enhanced performance monitoring pipeline (deferred until app is ready)
	useEffect(() => {
		if (loadingStage !== "ready") return;
		const cleanup = initPerformanceMonitoring();
		return cleanup;
	}, [loadingStage]);

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

		// Sync idle state to presence — auto-set "idle" / restore previous status
		const presenceState = usePresenceStore.getState();
		if (isIdle && presenceState.status === "online") {
			presenceState.setStatus("idle");
		} else if (!isIdle && presenceState.status === "idle") {
			presenceState.setStatus("online");
		}
	}, [isIdle]);

	// Member list panel visibility
	const isMemberListVisible = useUIStore((s) => s.isMemberListVisible);

	// Sync mobile detection to UI store
	useEffect(() => {
		useUIStore.getState().setMobile(isMobile);
	}, [isMobile]);

	// Auto-close mobile sidebars on route change
	useEffect(() => {
		if (isMobile) {
			useUIStore.getState().closeMobileSidebars();
		}
	}, [pathname, isMobile]);

	// Coordinated initialization: auth first, then data stores
	useEffect(() => {
		let cancelled = false;
		let initTimeoutId: ReturnType<typeof setTimeout> | undefined;

		async function initialize() {
			// Check circuit breaker
			const storedAttempts = parseInt(localStorage.getItem("bedrock-init-attempts") || "0", 10);
			if (storedAttempts >= MAX_INIT_ATTEMPTS) {
				setInitError("Too many failed initialization attempts. Please clear cache.");
				logError("STORE_INIT", new Error("Circuit breaker: max init attempts exceeded"));
				return;
			}

			try {
				// Create timeout that RESOLVES instead of rejecting — a timeout
				// is a graceful degradation to "not authenticated", not a crash.
				const timeoutPromise = new Promise<"timeout">((resolve) => {
					initTimeoutId = setTimeout(() => resolve("timeout"), INIT_TIMEOUT_MS);
				});

				// Create initialization promise
				const initPromise = async (): Promise<"done"> => {
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
						if (cancelled) return "done";
					}

					// Step 2: Only init data stores if authenticated
					const { isAuthenticated: authed } = useAuthStore.getState();
					if (!authed) return "done";

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
					promises.push(useFavoritesStore.getState().loadFavorites());
					if (!serverState.isInitialized) promises.push(serverState.loadServers());
					// Note: init() methods are synchronous wrappers that kick off async work
					// They set isInitialized = true internally after loading completes
					if (!friendsState.isInitialized) friendsState.init();
					if (!dmState.isInitialized) dmState.init();

					// Await server loading so child pages can rely on server data
					if (promises.length > 0) await Promise.all(promises);

					setLoadingStage("ready");
					return "done";
				};

				// Race between initialization and timeout
				const result = await Promise.race([initPromise(), timeoutPromise]);
				clearTimeout(initTimeoutId);

				if (result === "timeout") {
					// Timeout is NOT fatal — ensure the app isn't stuck in loading
					// state, then let the redirect-to-login effect handle it.
					logError("STORE_INIT", new Error("Initialization timed out — falling back to login"));
					useAuthStore.setState({ isInitializing: false });
					// Don't set initError — the redirect effect will handle it
				}

				// Success or graceful timeout — reset circuit breaker
				localStorage.removeItem("bedrock-init-attempts");
			} catch (err) {
				clearTimeout(initTimeoutId);
				if (!cancelled) {
					// Only increment circuit breaker for actual JS errors, not timeouts
					const attempts = parseInt(localStorage.getItem("bedrock-init-attempts") || "0", 10);
					localStorage.setItem("bedrock-init-attempts", String(attempts + 1));
					logError("STORE_INIT", err);
					setInitError(err instanceof Error ? err.message : "Initialization failed");
				}
			}
		}

		initialize();
		return () => {
			cancelled = true;
			clearTimeout(initTimeoutId);
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

	// Join/leave presence channel when current server changes
	const currentServerId = useServerStore((s) => s.currentServerId);

	useEffect(() => {
		if (!isAuthenticated || !currentServerId) return;

		// Sync persisted status from auth store to presence before joining
		const authStatus = useAuthStore.getState().user?.status;
		if (authStatus && authStatus !== "offline") {
			usePresenceStore.getState().setStatus(authStatus);
		}

		usePresenceStore.getState().joinServer(currentServerId);
		return () => {
			usePresenceStore.getState().leaveServer();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentServerId, isAuthenticated]); // Exclude store actions — stable Zustand actions

	// Destroy presence on full unmount
	useEffect(() => {
		return () => {
			usePresenceStore.getState().destroy();
		};
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

			{/* Member List Panel - toggleable popout */}
			<AnimatePresence>
				{isMemberListVisible && currentServerId && currentServerId !== "home" && (
					isMobile ? (
						/* Mobile: slide-over from right */
						<ErrorBoundary level="feature" name="MemberList">
							<motion.div
								key="member-backdrop"
								className="fixed inset-0 z-40 bg-black/50"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => useUIStore.getState().setMemberListVisible(false)}
							/>
							<motion.div
								key="member-panel-mobile"
								className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-[oklch(0.15_0.02_250)] border-l border-white/10"
								initial={{ x: "100%" }}
								animate={{ x: 0 }}
								exit={{ x: "100%" }}
								transition={{ type: "spring", stiffness: 300, damping: 30 }}
							>
								<Suspense fallback={<MemberListSkeleton />}>
									<MemberListPanel serverId={currentServerId} />
								</Suspense>
							</motion.div>
						</ErrorBoundary>
					) : (
						/* Desktop: inline panel */
						<ErrorBoundary level="feature" name="MemberList">
							<motion.div
								key="member-panel-desktop"
								className="relative z-10 w-60 bg-[oklch(0.15_0.02_250)] border-l border-white/10 overflow-hidden"
								initial={{ width: 0, opacity: 0 }}
								animate={{ width: 240, opacity: 1 }}
								exit={{ width: 0, opacity: 0 }}
								transition={{ type: "spring", stiffness: 300, damping: 30 }}
							>
								<Suspense fallback={<MemberListSkeleton />}>
									<MemberListPanel serverId={currentServerId} />
								</Suspense>
							</motion.div>
						</ErrorBoundary>
					)
				)}
			</AnimatePresence>

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

function MemberListSkeleton() {
	return (
		<div className="w-60 p-4 space-y-3">
			<div className="h-2.5 w-20 bg-white/10 rounded-sm animate-pulse" />
			{Array.from({ length: 8 }).map((_, i) => (
				<div key={i} className="flex items-center gap-2.5 animate-pulse">
					<div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
					<div className="h-3 w-24 bg-white/10 rounded-sm" />
				</div>
			))}
		</div>
	);
}
