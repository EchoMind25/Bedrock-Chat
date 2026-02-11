"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";
import { Tooltip } from "@/components/ui/tooltip/tooltip";
import { motion, AnimatePresence } from "motion/react";

export function UserPanel() {
	const { user } = useAuthStore();
	const [showSettings, setShowSettings] = useState(false);

	if (!user) {
		return null;
	}

	return (
		<div className="h-[52px] px-2 bg-[oklch(0.12_0.02_250)] border-t border-white/10 flex items-center gap-2">
			{/* User Info */}
			<button
				type="button"
				className="flex items-center gap-2 flex-1 px-2 py-1 rounded hover:bg-white/5 transition-colors group"
				onClick={() => setShowSettings(!showSettings)}
			>
				<Avatar
					src={user.avatar}
					fallback={user.displayName.slice(0, 2).toUpperCase()}
					status="online"
					size="sm"
				/>
				<div className="flex-1 min-w-0 text-left">
					<p className="text-sm font-semibold text-white truncate">
						{user.displayName}
					</p>
					<p className="text-xs text-white/60 truncate">
						#{user.username.slice(0, 4)}
					</p>
				</div>
			</button>

			{/* User Controls */}
			<div className="flex items-center gap-1">
				{/* Mute */}
				<Tooltip content="Mute" position="top">
					<motion.button
						type="button"
						className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Mute</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
							/>
						</svg>
					</motion.button>
				</Tooltip>

				{/* Deafen */}
				<Tooltip content="Deafen" position="top">
					<motion.button
						type="button"
						className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Deafen</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
							/>
						</svg>
					</motion.button>
				</Tooltip>

				{/* Settings */}
				<Tooltip content="User Settings" position="top">
					<motion.button
						type="button"
						className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
						whileHover={{ scale: 1.05, rotate: 90 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setShowSettings(!showSettings)}
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Settings</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</motion.button>
				</Tooltip>
			</div>

			{/* Settings Panel (expandable) */}
			<AnimatePresence>
				{showSettings && (
					<motion.div
						className="absolute bottom-14 left-2 right-2 bg-[oklch(0.18_0.02_250)] border border-white/10 rounded-lg shadow-xl overflow-hidden"
						initial={{ opacity: 0, y: 10, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 10, scale: 0.95 }}
						transition={{
							type: "spring",
							stiffness: 260,
							damping: 20,
						}}
					>
						<div className="p-2 space-y-1">
							<button
								type="button"
								className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded transition-colors flex items-center gap-2"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Profile</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
								Set Status
							</button>
							<button
								type="button"
								className="w-full px-3 py-2 text-sm text-left text-white/80 hover:bg-white/5 rounded transition-colors flex items-center gap-2"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Privacy</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
								Privacy Settings
							</button>
							<div className="h-px bg-white/10 my-1" />
							<button
								type="button"
								className="w-full px-3 py-2 text-sm text-left text-error hover:bg-error/10 rounded transition-colors flex items-center gap-2"
								onClick={() => {
									// TODO: Implement logout
									console.log("Logout");
								}}
							>
								<svg
									className="w-4 h-4"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Logout</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								Log Out
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
