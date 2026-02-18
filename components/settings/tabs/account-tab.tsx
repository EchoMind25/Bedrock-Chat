"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge/badge";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Modal } from "@/components/ui/modal/modal";
import { SettingsSection } from "../settings-section";
import { SettingsRow } from "../settings-row";
import { toast } from "@/lib/stores/toast-store";

function maskEmail(email: string): string {
	const [local, domain] = email.split("@");
	if (!domain) return email;
	const visible = local.slice(0, 2);
	return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
}

export function AccountTab() {
	const user = useAuthStore((s) => s.user);
	const deleteAccount = useAuthStore((s) => s.deleteAccount);
	const isLoading = useAuthStore((s) => s.isLoading);
	const storeError = useAuthStore((s) => s.error);
	const clearError = useAuthStore((s) => s.clearError);

	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [password, setPassword] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	// Password change state
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	if (!user) return null;

	const accountTypeLabel =
		user.accountType === "parent" ? "Parent" :
		user.accountType === "teen" ? "Teen" :
		"Standard";

	const accountTypeVariant =
		user.accountType === "parent" ? "primary" :
		user.accountType === "teen" ? "warning" :
		"default";

	const handleOpenDeleteModal = () => {
		setPassword("");
		setLocalError(null);
		clearError();
		setShowDeleteModal(true);
	};

	const handleCloseDeleteModal = () => {
		if (isLoading) return;
		setShowDeleteModal(false);
		setPassword("");
		setLocalError(null);
		clearError();
	};

	const handleDeleteAccount = async () => {
		if (!password) {
			setLocalError("Please enter your password");
			return;
		}

		setLocalError(null);
		clearError();

		const success = await deleteAccount(password);
		if (success) {
			router.push("/");
		}
	};

	const handleOpenPasswordModal = () => {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setPasswordError(null);
		setShowPasswordModal(true);
	};

	const handleClosePasswordModal = () => {
		if (isChangingPassword) return;
		setShowPasswordModal(false);
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setPasswordError(null);
	};

	const handleChangePassword = async () => {
		setPasswordError(null);

		if (!currentPassword) {
			setPasswordError("Please enter your current password");
			return;
		}
		if (newPassword.length < 8) {
			setPasswordError("New password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordError("New passwords do not match");
			return;
		}
		if (currentPassword === newPassword) {
			setPasswordError("New password must be different from current password");
			return;
		}

		setIsChangingPassword(true);

		try {
			const supabase = createClient();

			// Verify current password by re-authenticating
			const { error: signInError } = await supabase.auth.signInWithPassword({
				email: user.email,
				password: currentPassword,
			});

			if (signInError) {
				setPasswordError("Current password is incorrect");
				setIsChangingPassword(false);
				return;
			}

			// Update to new password
			const { error: updateError } = await supabase.auth.updateUser({
				password: newPassword,
			});

			if (updateError) {
				setPasswordError(updateError.message);
				setIsChangingPassword(false);
				return;
			}

			toast.success("Password Updated", "Your password has been changed successfully");
			handleClosePasswordModal();
		} catch {
			setPasswordError("Failed to change password. Please try again.");
		} finally {
			setIsChangingPassword(false);
		}
	};

	const displayError = localError || storeError;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-white">Account</h1>
				<p className="text-slate-400 text-sm mt-1">Manage your account settings</p>
			</div>

			<SettingsSection title="Account Information">
				<SettingsRow label="Email" description={maskEmail(user.email)}>
					<span className="text-xs text-slate-500">Verified</span>
				</SettingsRow>
				<SettingsRow label="Account Type">
					<Badge variant={accountTypeVariant}>{accountTypeLabel}</Badge>
				</SettingsRow>
				<SettingsRow label="Member Since">
					<span className="text-sm text-slate-300">
						{new Date(user.createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</span>
				</SettingsRow>
				<SettingsRow label="Account ID">
					<span className="text-xs text-slate-500 font-mono">{user.id.slice(0, 12)}...</span>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Password">
				<SettingsRow label="Change Password" description="Update your account password">
					<Button variant="secondary" size="sm" onClick={handleOpenPasswordModal}>
						Change
					</Button>
				</SettingsRow>
			</SettingsSection>

			<SettingsSection title="Danger Zone">
				<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
					<SettingsRow
						label="Delete Account"
						description="Permanently delete your account and all data. This action cannot be undone."
					>
						<Button variant="danger" size="sm" onClick={handleOpenDeleteModal}>
							Delete
						</Button>
					</SettingsRow>
				</div>
			</SettingsSection>

			{/* Password Change Modal */}
			<Modal
				isOpen={showPasswordModal}
				onClose={handleClosePasswordModal}
				title="Change Password"
				size="sm"
				closeOnOverlay={!isChangingPassword}
				closeOnEscape={!isChangingPassword}
				footer={
					<>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleClosePasswordModal}
							disabled={isChangingPassword}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							size="sm"
							onClick={handleChangePassword}
							disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
						>
							{isChangingPassword ? "Updating..." : "Update Password"}
						</Button>
					</>
				}
			>
				<div className="space-y-4">
					<Input
						id="current-password"
						type="password"
						label="Current Password"
						labelClassName="text-slate-300"
						placeholder="Enter current password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						disabled={isChangingPassword}
						autoComplete="current-password"
					/>
					<Input
						id="new-password"
						type="password"
						label="New Password"
						labelClassName="text-slate-300"
						placeholder="Enter new password (min 8 characters)"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						disabled={isChangingPassword}
						autoComplete="new-password"
					/>
					<Input
						id="confirm-password"
						type="password"
						label="Confirm New Password"
						labelClassName="text-slate-300"
						placeholder="Re-enter new password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && currentPassword && newPassword && confirmPassword && !isChangingPassword) {
								handleChangePassword();
							}
						}}
						error={passwordError || undefined}
						disabled={isChangingPassword}
						autoComplete="new-password"
					/>
				</div>
			</Modal>

			{/* Delete Account Modal */}
			<Modal
				isOpen={showDeleteModal}
				onClose={handleCloseDeleteModal}
				title="Delete Account"
				size="sm"
				closeOnOverlay={!isLoading}
				closeOnEscape={!isLoading}
				footer={
					<>
						<Button
							variant="secondary"
							size="sm"
							onClick={handleCloseDeleteModal}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={handleDeleteAccount}
							disabled={isLoading || !password}
						>
							{isLoading ? "Deleting..." : "Delete My Account"}
						</Button>
					</>
				}
			>
				<div className="space-y-4">
					<p className="text-sm text-red-400 font-medium">
						This permanently deletes your account and all data. This cannot be undone.
					</p>
					<p className="text-sm text-slate-400">
						All your messages, server memberships, friend connections, and personal data will be permanently removed.
					</p>
					<Input
						id="delete-account-password"
						type="password"
						label="Confirm your password"
						labelClassName="text-slate-300"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && password && !isLoading) {
								handleDeleteAccount();
							}
						}}
						error={displayError || undefined}
						disabled={isLoading}
						autoComplete="current-password"
					/>
				</div>
			</Modal>
		</div>
	);
}
