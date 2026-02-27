"use client";

import { Suspense, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils/cn";

const NAV_TABS = [
	{ id: "navigation", label: "Navigation & Funnels", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
	{ id: "features", label: "Feature Usage", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
	{ id: "performance", label: "Performance", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
	{ id: "sessions", label: "Sessions & Engagement", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
	{ id: "bugs", label: "Bug Reports", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
] as const;

function AnalyticsSidebar({ userEmail }: { userEmail?: string }) {
	const searchParams = useSearchParams();
	const activeTab = searchParams.get("tab") ?? "navigation";

	return (
		<aside className="w-[240px] shrink-0 border-r border-slate-800/50 flex flex-col">
			<div className="p-4 border-b border-slate-800/50">
				<h1 className="text-lg font-semibold text-white">Analytics</h1>
				<p className="text-xs text-slate-400 mt-0.5">Bedrock Chat · Super Admin</p>
			</div>

			<nav className="flex-1 p-2 space-y-0.5" aria-label="Analytics sections">
				{NAV_TABS.map((tab) => {
					const href = `/admin/analytics?tab=${tab.id}`;
					const isActive = activeTab === tab.id;
					return (
						<Link key={tab.id} href={href}>
							<div
								className={cn(
									"flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
									isActive
										? "bg-primary/10 text-primary"
										: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
								)}
							>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d={tab.icon} />
								</svg>
								{tab.label}
							</div>
						</Link>
					);
				})}
			</nav>

			<div className="p-3 border-t border-slate-800/50 space-y-1">
				<Link href="/admin/bugs">
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3.003 3.003 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" />
						</svg>
						BCC Bug Reports
					</div>
				</Link>
				<Link href="/channels">
					<div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="m12 19-7-7 7-7M19 12H5" />
						</svg>
						Back to Chat
					</div>
				</Link>
				{userEmail && (
					<div className="px-3 py-1 text-xs text-slate-500">{userEmail}</div>
				)}
			</div>
		</aside>
	);
}

export default function AdminAnalyticsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const isInitializing = useAuthStore((s) => s.isInitializing);
	const initAuthListener = useAuthStore((s) => s.initAuthListener);

	const isSuperAdmin = user?.platformRole === "super_admin";

	// This page is outside the main (main) route group so auth is never
	// initialized by layout-client. Start the listener here instead.
	useEffect(() => {
		const unsubscribe = initAuthListener();
		return unsubscribe;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (isInitializing) return;
		if (!isAuthenticated || !isSuperAdmin) {
			router.push("/channels");
		}
	}, [isAuthenticated, isSuperAdmin, isInitializing, router]);

	if (isInitializing || !isAuthenticated || !isSuperAdmin) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-950">
				<div className="text-center">
					<div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-slate-400 text-sm">Loading Analytics Dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen bg-slate-950 text-slate-100">
			<Suspense fallback={
				<aside className="w-[240px] shrink-0 border-r border-slate-800/50">
					<div className="p-4 border-b border-slate-800/50">
						<h1 className="text-lg font-semibold text-white">Analytics</h1>
					</div>
				</aside>
			}>
				<AnalyticsSidebar userEmail={user?.email} />
			</Suspense>

			<main className="flex-1 overflow-y-auto">
				{children}
			</main>
		</div>
	);
}
