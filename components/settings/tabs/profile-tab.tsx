"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { usePresenceStore } from "@/store/presence.store";
import type { UserStatus } from "@/store/auth.store";
import { Avatar } from "@/components/ui/avatar/avatar";
import type { AvatarStatus } from "@/components/ui/avatar/avatar";
import { Input, Textarea } from "@/components/ui/input/input";
import { SettingsSection } from "../settings-section";

const statusToAvatar: Record<UserStatus, AvatarStatus> = {
	online: "online",
	idle: "away",
	dnd: "busy",
	offline: "offline",
	invisible: "offline",
};

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
	{ value: "online", label: "Online", color: "oklch(0.72 0.19 145)" },
	{ value: "idle", label: "Idle", color: "oklch(0.80 0.18 85)" },
	{ value: "dnd", label: "Do Not Disturb", color: "oklch(0.63 0.21 25)" },
	{ value: "invisible", label: "Invisible", color: "oklch(0.50 0.01 250)" },
];

export function ProfileTab() {
	const user = useAuthStore((s) => s.user);
	const updateUser = useAuthStore((s) => s.updateUser);
	const setPresenceStatus = usePresenceStore((s) => s.setStatus);

	const [displayName, setDisplayName] = useState(user?.displayName ?? "");
	const [bio, setBio] = useState(user?.bio ?? "");

	if (!user) return null;

	const avatarStatus = statusToAvatar[user.status] || "online";

	const handleDisplayNameBlur = () => {
		const trimmed = displayName.trim();
		if (trimmed && trimmed !== user.displayName) {
			updateUser({ displayName: trimmed });
		}
	};

	const handleBioBlur = () => {
		const trimmed = bio.trim();
		updateUser({ bio: trimmed });
	};

	const handleStatusChange = (status: UserStatus) => {
		updateUser({ status });
		setPresenceStatus(status);
	};

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">My Profile</h1>
				<p className="text-slate-400 text-sm mt-1">Manage your public profile</p>
			</div>

			{/* Profile Banner + Avatar */}
			<div className="rounded-xl overflow-hidden border border-white/10">
				<div className="h-24 bg-gradient-to-r from-primary/40 via-purple-500/30 to-blue-500/40" />
				<div className="p-4 bg-white/5 relative">
					<div className="absolute -top-10 left-4">
						<Avatar
							src={user.avatar}
							fallback={user.displayName}
							status={avatarStatus}
							size="xl"
						/>
					</div>
					<div className="ml-20 pt-2">
						<p className="font-semibold text-white">{user.displayName}</p>
						<p className="text-sm text-slate-400">@{user.username}</p>
					</div>
				</div>
			</div>

			<SettingsSection title="Profile Information">
				<div className="space-y-4">
					<Input
						label="Display Name"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						onBlur={handleDisplayNameBlur}
						helperText="This is how others see you"
					/>
					<Textarea
						label="About Me"
						value={bio}
						onChange={(e) => setBio(e.target.value)}
						onBlur={handleBioBlur}
						helperText="Tell others a bit about yourself (190 characters max)"
						maxLength={190}
					/>
				</div>
			</SettingsSection>

			<SettingsSection title="Status">
				<div className="grid grid-cols-2 gap-2">
					{statusOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => handleStatusChange(option.value)}
							className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
								user.status === option.value
									? "border-blue-500 bg-blue-500/10"
									: "border-white/10 hover:border-white/20 hover:bg-white/5"
							}`}
						>
							<span
								className="w-3 h-3 rounded-full shrink-0"
								style={{ backgroundColor: option.color }}
							/>
							<span className="text-sm text-slate-200">{option.label}</span>
						</button>
					))}
				</div>
			</SettingsSection>
		</div>
	);
}
