"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/store/auth.store";
import type { UserStatus } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";
import { Button } from "@/components/ui/button/button";
import { Input, Textarea } from "@/components/ui/input/input";

interface ProfileModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const statusToAvatar: Record<UserStatus, AvatarStatus> = {
	online: "online",
	idle: "away",
	dnd: "busy",
	offline: "offline",
	invisible: "offline",
};

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
	{ value: "online", label: "Online", color: "bg-green-500" },
	{ value: "idle", label: "Idle", color: "bg-yellow-500" },
	{ value: "dnd", label: "Do Not Disturb", color: "bg-red-500" },
	{ value: "offline", label: "Invisible", color: "bg-gray-500" },
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
	const user = useAuthStore((state) => state.user);
	const updateUser = useAuthStore((state) => state.updateUser);
	const [mounted, setMounted] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [saving, setSaving] = useState(false);

	const [formData, setFormData] = useState({
		displayName: "",
		bio: "",
		status: "online" as UserStatus,
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (isOpen && user) {
			setFormData({
				displayName: user.displayName,
				bio: "",
				status: user.status,
			});
			setIsEditing(false);
		}
	}, [isOpen, user]);

	// Prevent body scroll when open
	useEffect(() => {
		if (!isOpen) return;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (e: globalThis.KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};
		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	if (!user || !mounted) return null;

	const avatarStatus = statusToAvatar[user.status] || "online";

	const handleSave = async () => {
		setSaving(true);

		const updates: Record<string, unknown> = {};
		if (formData.displayName.trim() && formData.displayName !== user.displayName) {
			updates.displayName = formData.displayName.trim();
		}
		if (formData.status !== user.status) {
			updates.status = formData.status;
		}

		if (Object.keys(updates).length > 0) {
			updateUser(updates as Parameters<typeof updateUser>[0]);
		}

		setSaving(false);
		setIsEditing(false);
	};

	const handleCancel = () => {
		setFormData({
			displayName: user.displayName,
			bio: "",
			status: user.status,
		});
		setIsEditing(false);
	};

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					role="dialog"
					aria-modal="true"
					aria-label="User Profile"
				>
					{/* Backdrop */}
					<motion.div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						className="relative z-10 w-full max-w-2xl bg-[oklch(0.14_0.02_250)] rounded-xl overflow-hidden shadow-2xl border border-white/10"
						initial={{ scale: 0.9, y: 20, opacity: 0 }}
						animate={{ scale: 1, y: 0, opacity: 1 }}
						exit={{ scale: 0.9, y: 20, opacity: 0 }}
						transition={{ type: "spring", stiffness: 260, damping: 20 }}
						onClick={(e) => e.stopPropagation()}
					>
						{/* Banner */}
						<div className="h-28 bg-linear-to-r from-[oklch(0.45_0.25_265)] via-[oklch(0.45_0.2_285)] to-[oklch(0.5_0.2_320)] relative">
							<button
								type="button"
								onClick={onClose}
								className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-lg transition-colors"
								aria-label="Close profile"
							>
								<svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						{/* Profile Content */}
						<div className="px-6 pb-6">
							{/* Avatar */}
							<div className="relative -mt-14 mb-4 flex items-end justify-between">
								<div className="ring-[6px] ring-[oklch(0.14_0.02_250)] rounded-full">
									<Avatar
										src={user.avatar}
										fallback={user.displayName.slice(0, 2).toUpperCase()}
										status={avatarStatus}
										size="xl"
									/>
								</div>

								{!isEditing && (
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditing(true)}
										className="mb-1"
									>
										<svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
										</svg>
										Edit Profile
									</Button>
								)}
							</div>

							{isEditing ? (
								/* Edit Mode */
								<div className="space-y-4">
									<Input
										label="Display Name"
										labelClassName="text-white/60"
										type="text"
										value={formData.displayName}
										onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
										className="bg-[oklch(0.12_0.02_250)]! border-white/10!"
									/>

									<Textarea
										label="About Me"
										id="profile-bio"
										value={formData.bio}
										onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 190) })}
										rows={3}
										placeholder="Tell us about yourself..."
										className="bg-[oklch(0.12_0.02_250)]! border-white/10! text-white! !placeholder:text-white/30"
										helperText={`${formData.bio.length}/190`}
									/>

									<div>
										<label className="block text-sm font-medium text-white/60 mb-2">Status</label>
										<div className="grid grid-cols-2 gap-2">
											{statusOptions.map((option) => (
												<button
													key={option.value}
													type="button"
													onClick={() => setFormData({ ...formData, status: option.value })}
													className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
														formData.status === option.value
															? "bg-white/10 text-white border border-white/20"
															: "text-white/60 hover:bg-white/5 border border-transparent"
													}`}
												>
													<div className={`w-3 h-3 rounded-full ${option.color}`} />
													{option.label}
												</button>
											))}
										</div>
									</div>

									<div className="flex gap-3 pt-2">
										<Button
											variant="primary"
											onClick={handleSave}
											loading={saving}
											className="flex-1"
										>
											Save Changes
										</Button>
										<Button variant="ghost" onClick={handleCancel}>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								/* View Mode */
								<div className="space-y-5">
									{/* User Info */}
									<div>
										<h2 className="text-xl font-bold text-white">
											{user.displayName}
										</h2>
										<p className="text-sm text-white/50">@{user.username}</p>
									</div>

									{/* Account Details */}
									<div className="bg-[oklch(0.12_0.02_250)] rounded-lg p-4 space-y-3">
										<h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
											Account Details
										</h3>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-xs text-white/40">Email</p>
												<p className="text-sm text-white/80 font-mono break-all">
													{maskEmail(user.email)}
												</p>
											</div>
											<div>
												<p className="text-xs text-white/40">Member Since</p>
												<p className="text-sm text-white/80">
													{user.createdAt
														? new Date(user.createdAt).toLocaleDateString("en-US", {
																year: "numeric",
																month: "long",
																day: "numeric",
															})
														: "N/A"}
												</p>
											</div>
										</div>

										<div>
											<p className="text-xs text-white/40">Account Type</p>
											<p className="text-sm text-white/80 capitalize">{user.accountType}</p>
										</div>

										<div>
											<p className="text-xs text-white/40">Account ID</p>
											<p className="text-[11px] text-white/50 font-mono break-all">{user.id}</p>
										</div>
									</div>

									{/* Privacy Notice */}
									<div className="bg-[oklch(0.45_0.25_265/0.1)] border border-[oklch(0.45_0.25_265/0.2)] rounded-lg p-4">
										<div className="flex gap-3">
											<svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
											</svg>
											<div>
												<p className="text-sm font-medium text-primary">Privacy Protected</p>
												<p className="text-xs text-white/40 mt-1">
													Your data is encrypted and never shared with third parties. Only you can see your full profile information.
												</p>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	);
}

function maskEmail(email: string): string {
	const [local, domain] = email.split("@");
	if (!domain) return email;
	const masked = local.length > 2 ? `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}` : local;
	return `${masked}@${domain}`;
}
