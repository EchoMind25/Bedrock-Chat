"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { User, Shield, Palette, Lock, Bell, Mic, Code, Crown, X, LogOut, Sparkles, Trophy, ChevronRight, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { performFullLogout } from "@/lib/utils/logout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useIsMobile } from "@/lib/hooks/use-media-query";

const ProfileTab = lazy(() => import("./tabs/profile-tab").then(m => ({ default: m.ProfileTab })));
const AccountTab = lazy(() => import("./tabs/account-tab").then(m => ({ default: m.AccountTab })));
const AppearanceTab = lazy(() => import("./tabs/appearance-tab").then(m => ({ default: m.AppearanceTab })));
const PrivacyTab = lazy(() => import("./tabs/privacy-tab").then(m => ({ default: m.PrivacyTab })));
const NotificationsTab = lazy(() => import("./tabs/notifications-tab").then(m => ({ default: m.NotificationsTab })));
const VoiceTab = lazy(() => import("./tabs/voice-tab").then(m => ({ default: m.VoiceTab })));
const DeveloperTab = lazy(() => import("./tabs/developer-tab").then(m => ({ default: m.DeveloperTab })));
const AdminTab = lazy(() => import("./tabs/admin-tab").then(m => ({ default: m.AdminTab })));
const IdentityTab = lazy(() => import("./tabs/identity-tab").then(m => ({ default: m.IdentityTab })));
const RewardsTab = lazy(() => import("./tabs/rewards-tab").then(m => ({ default: m.RewardsTab })));

interface NavItem {
	id: string;
	label: string;
	icon: LucideIcon;
	category: string;
}

const NAV_ITEMS: NavItem[] = [
	{ id: "profile", label: "My Profile", icon: User, category: "USER SETTINGS" },
	{ id: "account", label: "Account", icon: Shield, category: "USER SETTINGS" },
	{ id: "appearance", label: "Appearance", icon: Palette, category: "APP SETTINGS" },
	{ id: "identity", label: "Style & Identity", icon: Sparkles, category: "APP SETTINGS" },
	{ id: "rewards", label: "Rewards", icon: Trophy, category: "APP SETTINGS" },
	{ id: "privacy", label: "Privacy & Safety", icon: Lock, category: "APP SETTINGS" },
	{ id: "notifications", label: "Notifications", icon: Bell, category: "APP SETTINGS" },
	{ id: "voice", label: "Voice & Audio", icon: Mic, category: "APP SETTINGS" },
	{ id: "developer", label: "Developer", icon: Code, category: "ADVANCED" },
	{ id: "admin", label: "Admin", icon: Crown, category: "ADVANCED" },
];

export function SettingsModal() {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	// Mobile: slide-over nav drawer open state
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	const isOpen = useUIStore((s) => s.isSettingsOpen);
	const activeTab = useUIStore((s) => s.settingsTab);
	const closeSettings = useUIStore((s) => s.closeSettings);
	const setTab = useUIStore((s) => s.setSettingsTab);
	const user = useAuthStore((s) => s.user);
	const platformRoleLoaded = usePlatformRoleStore((s) => s.isLoaded);
	const platformIsDeveloper = usePlatformRoleStore((s) => s.isDeveloper());
	const platformIsStaff = usePlatformRoleStore((s) => s.isStaff());
	const { trackFeature } = useAnalytics();
	const isMobile = useIsMobile();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (isOpen) {
			trackFeature('SETTINGS_OPEN');
		} else {
			setMobileNavOpen(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	// Escape key handler
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") {
				if (mobileNavOpen) setMobileNavOpen(false);
				else closeSettings();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, mobileNavOpen]);

	// Body scroll lock + pointer-events cleanup
	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
			document.body.style.pointerEvents = "";
		};
	}, [isOpen]);

	if (!mounted) return null;

	// Filter restricted tabs based on platform role
	const isDeveloperFallback = process.env.NODE_ENV === "development" ||
		(user?.id && process.env.NEXT_PUBLIC_DEVELOPER_IDS?.split(",").includes(user.id));
	const showDeveloperTab = platformRoleLoaded ? platformIsDeveloper : isDeveloperFallback;
	const showAdminTab = platformRoleLoaded ? platformIsStaff : (user?.accountType === "parent");
	const visibleItems = NAV_ITEMS.filter((item) => {
		if (item.id === "developer" && !showDeveloperTab) return false;
		if (item.id === "admin" && !showAdminTab) return false;
		return true;
	});

	// Group items by category
	const categories = visibleItems.reduce<Record<string, NavItem[]>>((acc, item) => {
		if (!acc[item.category]) acc[item.category] = [];
		acc[item.category].push(item);
		return acc;
	}, {});

	const handleLogout = async () => {
		closeSettings();
		await performFullLogout();
		router.push("/login");
	};

	const activeNavItem = visibleItems.find((item) => item.id === activeTab);

	function renderTabContent() {
		switch (activeTab) {
			case "profile": return <ProfileTab />;
			case "account": return <AccountTab />;
			case "appearance": return <AppearanceTab />;
			case "identity": return <IdentityTab />;
			case "rewards": return <RewardsTab />;
			case "privacy": return <PrivacyTab />;
			case "notifications": return <NotificationsTab />;
			case "voice": return <VoiceTab />;
			case "developer": return <DeveloperTab />;
			case "admin": return <AdminTab />;
			default: return <ProfileTab />;
		}
	}

	// Nav list — used in desktop sidebar and mobile drawer
	function renderNavList(onItemClick?: () => void) {
		return (
			<>
				<div className="flex-1 py-4 px-3 overflow-y-auto scrollbar-thin">
					{Object.entries(categories).map(([category, items]) => (
						<div key={category} className="mb-4">
							<p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1">
								{category}
							</p>
							{items.map((item) => {
								const Icon = item.icon;
								const isActive = activeTab === item.id;
								return (
									<button
										key={item.id}
										type="button"
										onClick={() => {
											setTab(item.id);
											onItemClick?.();
										}}
										className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-left transition-colors ${
											isActive
												? "bg-white/10 text-white"
												: "text-slate-400 hover:text-slate-200 hover:bg-white/5"
										}`}
									>
										<Icon className="w-4 h-4 shrink-0" />
										<span className="flex-1">{item.label}</span>
										{isMobile && <ChevronRight className="w-4 h-4 shrink-0 text-slate-600" />}
									</button>
								);
							})}
						</div>
					))}
				</div>

				{/* Separator + Logout */}
				<div className="border-t border-white/5 px-3 py-3 shrink-0">
					<button
						type="button"
						onClick={handleLogout}
						className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<LogOut className="w-4 h-4 shrink-0" />
						Log Out
					</button>
				</div>
			</>
		);
	}

	return createPortal(
		<AnimatePresence onExitComplete={() => {
			document.body.style.overflow = "";
			document.body.style.pointerEvents = "";
		}}>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						key="settings-backdrop"
						initial={{ opacity: 0, pointerEvents: "none" as const }}
						animate={{ opacity: 1, pointerEvents: "auto" as const }}
						exit={{ opacity: 0, pointerEvents: "none" as const }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
						onClick={closeSettings}
					/>

					{/* Settings container */}
					<motion.div
						key="settings-content"
						initial={{ opacity: 0, scale: 0.98, pointerEvents: "none" as const }}
						animate={{ opacity: 1, scale: 1, pointerEvents: "auto" as const }}
						exit={{ opacity: 0, scale: 0.98, pointerEvents: "none" as const }}
						transition={{ type: "spring", stiffness: 260, damping: 20 }}
						className="fixed inset-0 z-50 flex"
					>
						{isMobile ? (
							/* ── Mobile: full-screen content + slide-over nav drawer ── */
							<div className="relative w-full h-full bg-[oklch(0.14_0.02_250)] flex flex-col">
								{/* Safe-area spacer for notch */}
								<div
									className="shrink-0 bg-[oklch(0.11_0.02_250)]"
									style={{ height: "env(safe-area-inset-top)" }}
								/>

								{/* Header bar — always visible, below notch */}
								<div className="shrink-0 flex items-center gap-3 px-4 h-14 bg-[oklch(0.11_0.02_250)] border-b border-white/10">
									<button
										type="button"
										onClick={() => setMobileNavOpen(true)}
										className="p-2 -ml-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
										aria-label="Open settings menu"
									>
										<Menu className="w-5 h-5" />
									</button>
									<h2 className="flex-1 text-base font-semibold text-white truncate">
										{activeNavItem?.label ?? "Settings"}
									</h2>
									<button
										type="button"
										onClick={closeSettings}
										className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
										aria-label="Close settings"
									>
										<X className="w-5 h-5" />
									</button>
								</div>

								{/* Scrollable tab content */}
								<div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
									<div
										className="px-4 pt-6"
										style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
									>
										<AnimatePresence mode="wait">
											<motion.div
												key={activeTab ?? "default"}
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												transition={{ duration: 0.15 }}
											>
												<Suspense fallback={<SettingsTabSkeleton />}>
													{renderTabContent()}
												</Suspense>
											</motion.div>
										</AnimatePresence>
									</div>
								</div>

								{/* Slide-over nav drawer */}
								<AnimatePresence>
									{mobileNavOpen && (
										<>
											{/* Drawer backdrop */}
											<motion.div
												className="absolute inset-0 bg-black/50 z-10"
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.2 }}
												onClick={() => setMobileNavOpen(false)}
											/>

											{/* Drawer panel */}
											<motion.div
												className="absolute left-0 top-0 bottom-0 z-20 flex flex-col bg-[oklch(0.11_0.02_250)]"
												style={{
													width: "min(300px, 85vw)",
													paddingTop: "env(safe-area-inset-top)",
												}}
												initial={{ x: "-100%" }}
												animate={{ x: 0 }}
												exit={{ x: "-100%" }}
												transition={{ type: "spring", stiffness: 320, damping: 32 }}
											>
												{/* Drawer header */}
												<div className="shrink-0 flex items-center justify-between px-4 h-14 border-b border-white/10">
													<h2 className="text-base font-bold text-white">Settings</h2>
													<button
														type="button"
														onClick={() => setMobileNavOpen(false)}
														className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
														aria-label="Close menu"
													>
														<X className="w-5 h-5" />
													</button>
												</div>
												{renderNavList(() => setMobileNavOpen(false))}
											</motion.div>
										</>
									)}
								</AnimatePresence>
							</div>
						) : (
							/* ── Desktop: two-column layout ── */
							<div className="flex w-full h-full">
								{/* Sidebar */}
								<div className="w-[240px] shrink-0 bg-[oklch(0.11_0.02_250)] flex flex-col">
									<div className="shrink-0 px-6 pt-6 pb-2">
										<p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settings</p>
									</div>
									{renderNavList()}
								</div>

								{/* Content area */}
								<div className="flex-1 bg-[oklch(0.14_0.02_250)] relative">
									{/* Close button */}
									<button
										type="button"
										onClick={closeSettings}
										className="absolute top-4 right-4 z-10 p-2 rounded-full border border-white/10 bg-[oklch(0.14_0.02_250)]/80 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary"
										aria-label="Close settings"
									>
										<X className="w-5 h-5" />
									</button>

									{/* Scrollable tab content */}
									<div className="h-full overflow-y-auto settings-scrollbar">
										<div className="max-w-[740px] mx-auto px-10 py-8">
											<AnimatePresence mode="wait">
												<motion.div
													key={activeTab}
													initial={{ opacity: 0, y: 8 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -8 }}
													transition={{ duration: 0.15 }}
												>
													<Suspense fallback={<SettingsTabSkeleton />}>
														{renderTabContent()}
													</Suspense>
												</motion.div>
											</AnimatePresence>
										</div>
									</div>
								</div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);
}

function SettingsTabSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			<div className="h-6 w-48 bg-white/10 rounded-sm" />
			<div className="h-4 w-72 bg-white/10 rounded-sm" />
			<div className="space-y-3 mt-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="h-12 bg-white/10 rounded-lg" />
				))}
			</div>
		</div>
	);
}
