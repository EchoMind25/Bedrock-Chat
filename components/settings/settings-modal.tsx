"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { User, Shield, Palette, Lock, Bell, Mic, Code, Crown, X, LogOut, Sparkles, Trophy, ChevronRight, ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { usePlatformRoleStore } from "@/store/platform-role.store";
import { performFullLogout } from "@/lib/utils/logout";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useIsMobile } from "@/lib/hooks/use-media-query";

import { ProfileTab } from "./tabs/profile-tab";
import { AccountTab } from "./tabs/account-tab";
import { AppearanceTab } from "./tabs/appearance-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { VoiceTab } from "./tabs/voice-tab";
import { DeveloperTab } from "./tabs/developer-tab";
import { AdminTab } from "./tabs/admin-tab";
import { IdentityTab } from "./tabs/identity-tab";
import { RewardsTab } from "./tabs/rewards-tab";

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
	// Mobile: track whether we're showing the nav list or the active tab's content
	const [mobileShowContent, setMobileShowContent] = useState(false);

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
			// If opened with a specific tab (e.g. from a deep-link), go straight to content on mobile
			if (isMobile && activeTab) setMobileShowContent(true);
		} else {
			setMobileShowContent(false);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	// Escape key handler
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") closeSettings();
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]);

	// Body scroll lock + pointer-events cleanup
	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			// CRITICAL: always clean up, even if component unmounts while open
			document.body.style.overflow = "";
			document.body.style.pointerEvents = "";
		};
	}, [isOpen]);

	if (!mounted) return null;

	// Filter restricted tabs based on platform role
	// Fall back to env-var check while platform roles haven't loaded yet
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

	// Shared nav list (used on both desktop sidebar and mobile nav screen)
	function renderNavList() {
		return (
			<>
				<div className="flex-1 py-6 px-3 overflow-y-auto scrollbar-thin">
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
											if (isMobile) setMobileShowContent(true);
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
			// Guaranteed cleanup after exit animation completes
			document.body.style.overflow = "";
			document.body.style.pointerEvents = "";
		}}>
			{isOpen && (
				<>
					{/* Backdrop — pointer-events disabled during exit to prevent click blocking */}
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
							/* ── Mobile: two-screen stack ── */
							<div className="w-full h-full bg-[oklch(0.11_0.02_250)] flex flex-col">
								<AnimatePresence mode="wait" initial={false}>
									{!mobileShowContent ? (
										/* Screen 1 — nav list */
										<motion.div
											key="mobile-nav"
											className="flex flex-col h-full"
											initial={{ opacity: 0, x: -24 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: -24 }}
											transition={{ duration: 0.18 }}
										>
											{/* Header */}
											<div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
												<h2 className="text-base font-bold text-white">Settings</h2>
												<button
													type="button"
													onClick={closeSettings}
													className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
													aria-label="Close settings"
												>
													<X className="w-5 h-5" />
												</button>
											</div>
											{renderNavList()}
										</motion.div>
									) : (
										/* Screen 2 — tab content */
										<motion.div
											key="mobile-content"
											className="flex flex-col h-full"
											initial={{ opacity: 0, x: 24 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0, x: 24 }}
											transition={{ duration: 0.18 }}
										>
											{/* Header with back button */}
											<div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0">
												<button
													type="button"
													onClick={() => setMobileShowContent(false)}
													className="p-1.5 -ml-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
													aria-label="Back to settings menu"
												>
													<ChevronLeft className="w-5 h-5" />
												</button>
												<h2 className="flex-1 text-base font-bold text-white truncate">
													{activeNavItem?.label ?? "Settings"}
												</h2>
												<button
													type="button"
													onClick={closeSettings}
													className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
													aria-label="Close settings"
												>
													<X className="w-5 h-5" />
												</button>
											</div>
											{/* Scrollable content */}
											<div className="flex-1 min-h-0 overflow-y-auto settings-scrollbar">
												<div className="px-4 py-6">
													<AnimatePresence mode="wait">
														<motion.div
															key={activeTab}
															initial={{ opacity: 0, y: 8 }}
															animate={{ opacity: 1, y: 0 }}
															exit={{ opacity: 0, y: -8 }}
															transition={{ duration: 0.15 }}
														>
															{renderTabContent()}
														</motion.div>
													</AnimatePresence>
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						) : (
							/* ── Desktop: two-column layout ── */
							<div className="flex w-full h-full">
								{/* Sidebar */}
								<div className="w-[240px] shrink-0 bg-[oklch(0.11_0.02_250)] flex flex-col">
									{renderNavList()}
								</div>

								{/* Content area */}
								<div className="flex-1 bg-[oklch(0.14_0.02_250)] relative">
									{/* Close button — always visible, positioned over scroll content */}
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
													{renderTabContent()}
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
