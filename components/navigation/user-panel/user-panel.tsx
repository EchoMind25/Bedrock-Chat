"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { UserStatus } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";
import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { ProfileModal } from "@/components/profile/profile-modal";
import { AppearanceModal } from "@/components/settings/appearance-modal";
import { motion, AnimatePresence } from "motion/react";

export function UserPanel() {
	const router = useRouter();
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const updateUser = useAuthStore((s) => s.updateUser);
	const [showSettings, setShowSettings] = useState(false);
	const [showProfile, setShowProfile] = useState(false);
	const [showAppearance, setShowAppearance] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [isDeafened, setIsDeafened] = useState(false);
	const settingsRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);
	const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

	useEffect(() => {
		setMounted(true);
	}, []);

	// Click outside to close settings popup
	useEffect(() => {
		if (!showSettings) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (showSettings && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
				setShowSettings(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showSettings]);

	if (!user) {
		return null;
	}

	const handleMuteToggle = () => {
		setIsMuted(!isMuted);
		if (isDeafened && !isMuted) {
			// Can't unmute while deafened
			return;
		}
	};

	const handleDeafenToggle = () => {
		if (isDeafened) {
			setIsDeafened(false);
			setIsMuted(false);
		} else {
			setIsDeafened(true);
			setIsMuted(true);
		}
	};

	const statusToAvatar: Record<UserStatus, AvatarStatus> = {
		online: "online",
		idle: "away",
		dnd: "busy",
		offline: "offline",
	};

	const avatarStatus = statusToAvatar[user.status] || "online";

	const handleSetStatus = (status: UserStatus) => {
		updateUser({ status });
		setShowSettings(false);
	};

	const computePopoverPosition = () => {
		if (!panelRef.current) return;
		const rect = panelRef.current.getBoundingClientRect();
		setPopoverStyle({
			position: "fixed" as const,
			bottom: window.innerHeight - rect.top + 4,
			left: rect.left + 8,
			width: rect.width - 16,
		});
	};

	return (
		<div ref={panelRef} className="relative min-h-[52px] md:h-[52px] h-auto px-2 py-1 bg-[oklch(0.12_0.02_250)] border-t border-white/10 flex items-center gap-2">
			{/* User Info - opens settings menu */}
			<button
				type="button"
				className="flex items-center gap-2 flex-1 px-2 py-1 min-h-[44px] rounded-sm hover:bg-white/5 transition-colors group touch-manipulation"
				onClick={() => {
					computePopoverPosition();
					setShowSettings(!showSettings);
				}}
			>
				<Avatar
					src={user.avatar}
					fallback={user.displayName.slice(0, 2).toUpperCase()}
					status={avatarStatus}
					size="sm"
				/>
				<div className="flex-1 min-w-0 text-left">
					<p className="text-sm font-semibold text-white truncate">
						{user.displayName}
					</p>
					<p className="text-xs text-white/60 truncate">
						@{user.username}
					</p>
				</div>
			</button>

			{/* User Controls */}
			<div className="flex items-center gap-1">
				{/* Mute */}
				<Tooltip content={isMuted ? "Unmute" : "Mute"} position="top">
					<motion.button
						type="button"
						className={`min-w-[44px] min-h-[44px] w-11 h-11 md:w-8 md:h-8 rounded hover:bg-white/10 flex items-center justify-center transition-colors touch-manipulation ${
							isMuted ? "text-red-400" : "text-white/60 hover:text-white"
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleMuteToggle}
					>
						{isMuted ? (
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Unmute</title>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
								<line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
							</svg>
						) : (
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Mute</title>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
							</svg>
						)}
					</motion.button>
				</Tooltip>

				{/* Deafen */}
				<Tooltip content={isDeafened ? "Undeafen" : "Deafen"} position="top">
					<motion.button
						type="button"
						className={`min-w-[44px] min-h-[44px] w-11 h-11 md:w-8 md:h-8 rounded hover:bg-white/10 flex items-center justify-center transition-colors touch-manipulation ${
							isDeafened ? "text-red-400" : "text-white/60 hover:text-white"
						}`}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleDeafenToggle}
					>
						{isDeafened ? (
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Undeafen</title>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
								<line x1="17" y1="9" x2="21" y2="15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
								<line x1="21" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
							</svg>
						) : (
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<title>Deafen</title>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
							</svg>
						)}
					</motion.button>
				</Tooltip>

				{/* Settings */}
				<Tooltip content="User Settings" position="top">
					<motion.button
						type="button"
						className="min-w-[44px] min-h-[44px] w-11 h-11 md:w-8 md:h-8 rounded-sm hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors touch-manipulation"
						whileHover={{ scale: 1.05, rotate: 90 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => {
							computePopoverPosition();
							setShowSettings(!showSettings);
						}}
					>
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<title>Settings</title>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</motion.button>
				</Tooltip>
			</div>

			{/* Profile Modal */}
			<ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

			{/* Appearance Modal */}
			<AppearanceModal isOpen={showAppearance} onClose={() => setShowAppearance(false)} />

			{/* Settings Panel - rendered via portal to escape overflow clipping */}
			{mounted && createPortal(
				<AnimatePresence>
					{showSettings && (
						<motion.div
							ref={settingsRef}
							style={popoverStyle}
							className="bg-[oklch(0.18_0.02_250)] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							transition={{ type: "spring", stiffness: 260, damping: 20 }}
						>
							<div className="p-2 space-y-1">
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-2"
									onClick={() => {
										setShowSettings(false);
										setShowProfile(true);
									}}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<title>Profile</title>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									My Profile
								</button>
								<div className="h-px bg-white/10 my-1" />
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-2"
									onClick={() => handleSetStatus("online")}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<title>Online</title>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									Set Online
								</button>
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-2"
									onClick={() => handleSetStatus("dnd")}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<title>DND</title>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
									</svg>
									Do Not Disturb
								</button>
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-2"
									onClick={() => {
										setShowSettings(false);
										setShowAppearance(true);
									}}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<title>Appearance</title>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
									</svg>
									Appearance
								</button>
								<div className="h-px bg-white/10 my-1" />
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left text-error hover:bg-error/10 rounded-sm transition-colors flex items-center gap-2"
									onClick={async () => {
										setShowSettings(false);
										await logout();
										router.push("/login");
									}}
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<title>Logout</title>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
									</svg>
									Log Out
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>,
				document.body
			)}
		</div>
	);
}
