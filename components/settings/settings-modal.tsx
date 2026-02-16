"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { User, Shield, Palette, Lock, Bell, Mic, Code, Crown, X, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { performFullLogout } from "@/lib/utils/logout";

import { ProfileTab } from "./tabs/profile-tab";
import { AccountTab } from "./tabs/account-tab";
import { AppearanceTab } from "./tabs/appearance-tab";
import { PrivacyTab } from "./tabs/privacy-tab";
import { NotificationsTab } from "./tabs/notifications-tab";
import { VoiceTab } from "./tabs/voice-tab";
import { DeveloperTab } from "./tabs/developer-tab";
import { AdminTab } from "./tabs/admin-tab";

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
	{ id: "privacy", label: "Privacy & Safety", icon: Lock, category: "APP SETTINGS" },
	{ id: "notifications", label: "Notifications", icon: Bell, category: "APP SETTINGS" },
	{ id: "voice", label: "Voice & Audio", icon: Mic, category: "APP SETTINGS" },
	{ id: "developer", label: "Developer", icon: Code, category: "ADVANCED" },
	{ id: "admin", label: "Admin", icon: Crown, category: "ADVANCED" },
];

export function SettingsModal() {
	const router = useRouter();
	const [mounted, setMounted] = useState(false);

	const isOpen = useUIStore((s) => s.isSettingsOpen);
	const activeTab = useUIStore((s) => s.settingsTab);
	const closeSettings = useUIStore((s) => s.closeSettings);
	const setTab = useUIStore((s) => s.setSettingsTab);
	const user = useAuthStore((s) => s.user);

	useEffect(() => {
		setMounted(true);
	}, []);

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

	// Body scroll lock
	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	if (!mounted) return null;

	// Filter admin tab for non-parent accounts
	const visibleItems = NAV_ITEMS.filter((item) => {
		if (item.id === "admin" && user?.accountType !== "parent") return false;
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

	function renderTabContent() {
		switch (activeTab) {
			case "profile": return <ProfileTab />;
			case "account": return <AccountTab />;
			case "appearance": return <AppearanceTab />;
			case "privacy": return <PrivacyTab />;
			case "notifications": return <NotificationsTab />;
			case "voice": return <VoiceTab />;
			case "developer": return <DeveloperTab />;
			case "admin": return <AdminTab />;
			default: return <ProfileTab />;
		}
	}

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						key="settings-backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
						onClick={closeSettings}
					/>

					{/* Settings container */}
					<motion.div
						key="settings-content"
						initial={{ opacity: 0, scale: 0.98 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={{ type: "spring", stiffness: 260, damping: 20 }}
						className="fixed inset-0 z-50 flex pointer-events-none"
					>
						<div className="flex w-full h-full pointer-events-auto">
							{/* Sidebar */}
							<div className="w-[240px] shrink-0 bg-[oklch(0.11_0.02_250)] overflow-y-auto scrollbar-thin flex flex-col">
								<div className="flex-1 py-6 px-3">
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
														onClick={() => setTab(item.id)}
														className={`flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
															isActive
																? "bg-white/10 text-white"
																: "text-slate-400 hover:text-slate-200 hover:bg-white/5"
														}`}
													>
														<Icon className="w-4 h-4 shrink-0" />
														{item.label}
													</button>
												);
											})}
										</div>
									))}
								</div>

								{/* Separator + Logout */}
								<div className="border-t border-white/5 px-3 py-3">
									<button
										type="button"
										onClick={handleLogout}
										className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
									>
										<LogOut className="w-4 h-4 shrink-0" />
										Log Out
									</button>
								</div>
							</div>

							{/* Content area */}
							<div className="flex-1 bg-[oklch(0.14_0.02_250)] overflow-y-auto settings-scrollbar relative">
								{/* Close button */}
								<button
									type="button"
									onClick={closeSettings}
									className="absolute top-4 right-4 z-10 p-2 rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
									aria-label="Close settings"
								>
									<X className="w-5 h-5" />
								</button>

								{/* Tab content with transitions */}
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
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);
}
