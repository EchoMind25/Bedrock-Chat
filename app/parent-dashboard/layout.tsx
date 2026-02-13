"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useFamilyStore } from "@/store/family.store";
import { useParentDashboardStore } from "@/store/parent-dashboard.store";
import { motion, AnimatePresence } from "motion/react";
import {
	LayoutDashboard,
	Eye,
	Activity,
	Server,
	Shield,
	Settings,
	Menu,
	X,
	ArrowLeft,
	Sun,
	Moon,
	Bell,
	ChevronDown,
} from "lucide-react";

const navigationItems = [
	{ href: "/parent-dashboard/overview", label: "Overview", icon: LayoutDashboard },
	{ href: "/parent-dashboard/monitoring", label: "Monitoring", icon: Eye },
	{ href: "/parent-dashboard/activity", label: "Activity", icon: Activity },
	{ href: "/parent-dashboard/servers", label: "Servers", icon: Server },
	{ href: "/parent-dashboard/safety", label: "Safety Tools", icon: Shield },
	{ href: "/parent-dashboard/settings", label: "Settings", icon: Settings },
];

export default function ParentDashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const user = useAuthStore((s) => s.user);
	const isAuthInitializing = useAuthStore((s) => s.isInitializing);
	const isParent = useFamilyStore((s) => s.isParent);
	const isInitialized = useFamilyStore((s) => s.isInitialized);
	const init = useFamilyStore((s) => s.init);
	const teenAccounts = useFamilyStore((s) => s.teenAccounts);
	const selectedTeenId = useFamilyStore((s) => s.selectedTeenId);
	const setSelectedTeen = useFamilyStore((s) => s.setSelectedTeen);
	const {
		isSidebarCollapsed,
		isMobileSidebarOpen,
		toggleSidebar,
		toggleMobileSidebar,
		closeMobileSidebar,
		darkMode,
		toggleDarkMode,
	} = useParentDashboardStore();

	useEffect(() => {
		if (user && !isInitialized) {
			init(user.id, user.accountType);
		}
	}, [user, isInitialized, init]);

	useEffect(() => {
		// Wait for auth check to complete before redirecting
		if (isAuthInitializing) return;

		if (!isAuthenticated) {
			router.push("/login");
		} else if (isInitialized && !isParent) {
			router.push("/channels");
		}
	}, [isAuthenticated, isAuthInitializing, isInitialized, isParent, router]);

	if (!isAuthenticated || !user || !isInitialized || !isParent) {
		return (
			<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--pd-bg, #f5f5f7)" }}>
				<div className="text-center">
					<div className="w-10 h-10 border-3 border-[oklch(0.55_0.15_240)] border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-[oklch(0.50_0.015_250)] text-sm">Loading Parent Dashboard...</p>
				</div>
			</div>
		);
	}

	const selectedTeen = teenAccounts.find((ta) => ta.id === selectedTeenId);
	const currentPage = navigationItems.find((item) => pathname.startsWith(item.href));
	const pendingCount =
		(selectedTeen?.contentFlags.filter((f) => f.status === "pending").length || 0) +
		(selectedTeen?.pendingServers.filter((s) => s.status === "pending").length || 0) +
		(selectedTeen?.pendingFriends.filter((f) => f.status === "pending").length || 0);

	return (
		<div className={`parent-dashboard ${darkMode ? "pd-dark" : ""} flex h-screen overflow-hidden`}>
			{/* Mobile sidebar overlay */}
			<AnimatePresence>
				{isMobileSidebarOpen && (
					<motion.div
						className="fixed inset-0 z-40 bg-black/30 lg:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={closeMobileSidebar}
					/>
				)}
			</AnimatePresence>

			{/* Sidebar */}
			<aside
				className={`
					fixed lg:relative z-50 h-full flex flex-col
					border-r transition-all duration-200
					${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
					${isSidebarCollapsed ? "lg:w-[72px]" : "lg:w-[260px]"}
					w-[260px]
				`}
				style={{
					backgroundColor: "var(--pd-sidebar)",
					borderColor: "var(--pd-border)",
				}}
			>
				{/* Sidebar header */}
				<div className="p-4 border-b" style={{ borderColor: "var(--pd-border)" }}>
					<div className="flex items-center justify-between">
						{!isSidebarCollapsed && (
							<div>
								<h1 className="text-lg font-semibold" style={{ color: "var(--pd-text)" }}>
									Parent Dashboard
								</h1>
								<p className="text-xs mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
									Family Safety Center
								</p>
							</div>
						)}
						<button
							type="button"
							onClick={toggleSidebar}
							className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-80"
							style={{ background: "var(--pd-bg-secondary)" }}
							aria-label="Toggle sidebar"
						>
							<Menu size={16} style={{ color: "var(--pd-text-muted)" }} />
						</button>
						<button
							type="button"
							onClick={closeMobileSidebar}
							className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg"
							aria-label="Close sidebar"
						>
							<X size={16} style={{ color: "var(--pd-text-muted)" }} />
						</button>
					</div>
				</div>

				{/* Teen selector */}
				{!isSidebarCollapsed && teenAccounts.length > 0 && (
					<div className="px-3 py-3 border-b" style={{ borderColor: "var(--pd-border)" }}>
						<label className="text-xs font-medium mb-1.5 block" style={{ color: "var(--pd-text-muted)" }}>
							Monitoring
						</label>
						<div className="relative">
							<select
								value={selectedTeenId || ""}
								onChange={(e) => setSelectedTeen(e.target.value)}
								className="w-full px-3 py-2 text-sm rounded-lg appearance-none cursor-pointer pr-8 focus:outline-none focus:ring-2"
								style={{
									background: "var(--pd-bg-secondary)",
									color: "var(--pd-text)",
									borderColor: "var(--pd-border)",
									border: "1px solid var(--pd-border)",
								}}
							>
								{teenAccounts.map((ta) => (
									<option key={ta.id} value={ta.id}>
										{ta.user.displayName}
									</option>
								))}
							</select>
							<ChevronDown
								size={14}
								className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
								style={{ color: "var(--pd-text-muted)" }}
							/>
						</div>
					</div>
				)}

				{/* Navigation */}
				<nav className="flex-1 p-2 space-y-0.5 overflow-y-auto pd-scrollbar">
					{navigationItems.map((item) => {
						const isActive = pathname.startsWith(item.href);
						const Icon = item.icon;
						return (
							<Link key={item.href} href={item.href} onClick={closeMobileSidebar}>
								<div
									className={`
										flex items-center gap-3 px-3 py-2.5 rounded-lg
										transition-colors cursor-pointer text-sm font-medium
										${isSidebarCollapsed ? "justify-center" : ""}
									`}
									style={{
										backgroundColor: isActive ? "var(--pd-sidebar-active)" : "transparent",
										color: isActive ? "var(--pd-primary)" : "var(--pd-text-secondary)",
									}}
									title={isSidebarCollapsed ? item.label : undefined}
								>
									<Icon size={20} />
									{!isSidebarCollapsed && <span>{item.label}</span>}
								</div>
							</Link>
						);
					})}
				</nav>

				{/* Sidebar footer */}
				<div className="p-3 border-t space-y-2" style={{ borderColor: "var(--pd-border)" }}>
					{!isSidebarCollapsed && (
						<Link href="/channels">
							<div
								className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
								style={{ color: "var(--pd-text-muted)" }}
							>
								<ArrowLeft size={16} />
								<span>Back to Chat</span>
							</div>
						</Link>
					)}
					<button
						type="button"
						onClick={toggleDarkMode}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${isSidebarCollapsed ? "justify-center" : ""}`}
						style={{ color: "var(--pd-text-muted)" }}
					>
						{darkMode ? <Sun size={16} /> : <Moon size={16} />}
						{!isSidebarCollapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
					</button>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex-1 flex flex-col overflow-hidden min-w-0">
				{/* Top bar */}
				<header
					className="flex items-center justify-between px-4 lg:px-6 h-14 border-b shrink-0 pd-no-print"
					style={{
						backgroundColor: "var(--pd-surface)",
						borderColor: "var(--pd-border)",
					}}
				>
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={toggleMobileSidebar}
							className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg"
							style={{ background: "var(--pd-bg-secondary)" }}
							aria-label="Open menu"
						>
							<Menu size={18} style={{ color: "var(--pd-text)" }} />
						</button>
						<div>
							<h2 className="text-base font-semibold" style={{ color: "var(--pd-text)" }}>
								{currentPage?.label || "Parent Dashboard"}
							</h2>
							{selectedTeen && (
								<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
									Monitoring {selectedTeen.user.displayName}
								</p>
							)}
						</div>
					</div>

					<div className="flex items-center gap-2">
						{pendingCount > 0 && (
							<Link href="/parent-dashboard/safety">
								<div className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors" style={{ background: "var(--pd-bg-secondary)" }}>
									<Bell size={18} style={{ color: "var(--pd-text-secondary)" }} />
									<span
										className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
										style={{ background: "var(--pd-danger)" }}
									>
										{pendingCount}
									</span>
								</div>
							</Link>
						)}
					</div>
				</header>

				{/* Page content */}
				<main className="flex-1 overflow-y-auto pd-scrollbar" style={{ backgroundColor: "var(--pd-bg)" }}>
					{children}
				</main>
			</div>
		</div>
	);
}
