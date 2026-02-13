"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";

interface OnboardingProfileProps {
	onNext: () => void;
	onBack: () => void;
}

/**
 * Step 2: Avatar and display name setup.
 */
export function OnboardingProfile({ onNext, onBack }: OnboardingProfileProps) {
	const user = useAuthStore((s) => s.user);
	const updateUser = useAuthStore((s) => s.updateUser);

	const [displayName, setDisplayName] = useState(user?.displayName || "");
	const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Read as data URL for preview
		const reader = new FileReader();
		reader.onload = (ev) => {
			const result = ev.target?.result as string;
			setAvatarPreview(result);
		};
		reader.readAsDataURL(file);
	};

	const handleContinue = () => {
		const updates: { displayName?: string; avatar?: string } = {};
		if (displayName && displayName !== user?.displayName) {
			updates.displayName = displayName;
		}
		if (avatarPreview && avatarPreview !== user?.avatar) {
			updates.avatar = avatarPreview;
		}
		if (Object.keys(updates).length > 0) {
			updateUser(updates);
		}
		onNext();
	};

	const initials = (displayName || user?.username || "?")
		.slice(0, 2)
		.toUpperCase();

	return (
		<motion.div
			key="profile"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
		>
			<button
				type="button"
				onClick={onBack}
				className="text-blue-300/60 hover:text-blue-300 mb-4 flex items-center gap-2 text-sm"
			>
				&#8592; Back
			</button>

			<h1 className="text-2xl font-bold text-blue-400 mb-2">
				Set Up Your Profile
			</h1>
			<p className="text-blue-300/60 mb-8">
				How do you want others to see you?
			</p>

			{/* Avatar Section */}
			<div className="flex flex-col items-center mb-8">
				<div className="relative group">
					<div
						className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden"
						style={{
							background: avatarPreview
								? "transparent"
								: "linear-gradient(135deg, oklch(0.55 0.25 265), oklch(0.6 0.15 285))",
							color: "white",
						}}
					>
						{avatarPreview ? (
							<img
								src={avatarPreview}
								alt="Avatar preview"
								className="w-full h-full object-cover"
							/>
						) : (
							initials
						)}
					</div>
					<label
						className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
						htmlFor="avatar-upload"
					>
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="white"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
					</label>
					<input
						id="avatar-upload"
						type="file"
						accept="image/*"
						onChange={handleAvatarChange}
						className="hidden"
					/>
				</div>
				<p className="text-xs text-blue-300/40 mt-2">
					Click to upload avatar
				</p>
			</div>

			{/* Display Name */}
			<div className="mb-8">
				<Input
					type="text"
					label="Display Name"
					labelClassName="text-blue-400"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="How should we call you?"
					id="display-name"
					helperText="This is how you'll appear to others"
				/>
			</div>

			{/* Actions */}
			<div className="space-y-3">
				<Button
					variant="primary"
					size="lg"
					className="w-full"
					onClick={handleContinue}
				>
					Continue
				</Button>
				<button
					type="button"
					onClick={onNext}
					className="w-full text-sm text-blue-300/40 hover:text-blue-300/60 transition-colors"
				>
					Skip for now
				</button>
			</div>
		</motion.div>
	);
}
