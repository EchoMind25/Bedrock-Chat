"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Glass } from "@/components/ui/glass/glass";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { PasswordStrength } from "@/components/ui/password-strength/password-strength";
import { validatePassword } from "@/lib/utils/password-validation";

export default function ResetPasswordPage() {
	const router = useRouter();
	const updatePassword = useAuthStore((s) => s.updatePassword);
	const isLoading = useAuthStore((s) => s.isLoading);
	const error = useAuthStore((s) => s.error);
	const clearError = useAuthStore((s) => s.clearError);

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validationError, setValidationError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const passwordValidation = useMemo(
		() => validatePassword(password),
		[password],
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();
		setValidationError(null);

		if (!passwordValidation.isValid) {
			setValidationError(passwordValidation.errors[0]);
			return;
		}

		if (password !== confirmPassword) {
			setValidationError("Passwords do not match");
			return;
		}

		const ok = await updatePassword(password);
		if (ok) {
			setSuccess(true);
			setTimeout(() => router.push("/login"), 2000);
		}
	};

	const displayError = validationError || error;

	return (
		<div className="min-h-screen animated-gradient flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				className="w-full max-w-[420px]"
			>
				<Glass variant="strong" border="medium" className="p-8">
					<AnimatePresence mode="wait">
						{!success ? (
							<motion.div
								key="form"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
							>
								<h1 className="text-2xl font-bold text-blue-400 text-center mb-2">
									Set New Password
								</h1>
								<p className="text-blue-300/60 text-center mb-8">
									Choose a strong password for your account
								</p>

								<AnimatePresence>
									{displayError && (
										<motion.div
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0 }}
											className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6"
										>
											<p className="text-red-400 text-sm">{displayError}</p>
										</motion.div>
									)}
								</AnimatePresence>

								<form onSubmit={handleSubmit} className="space-y-6">
									<Input
										type="password"
										label="New Password"
										labelClassName="text-blue-400"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										required
										autoComplete="new-password"
										id="new-password"
										helperText="At least 8 characters with uppercase, lowercase, and a number"
									/>
									{password && (
										<PasswordStrength validation={passwordValidation} />
									)}

									<Input
										type="password"
										label="Confirm Password"
										labelClassName="text-blue-400"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										required
										autoComplete="new-password"
										id="confirm-password"
									/>

									<Button
										type="submit"
										variant="primary"
										size="lg"
										className="w-full"
										loading={isLoading}
									>
										Update Password
									</Button>
								</form>
							</motion.div>
						) : (
							<motion.div
								key="success"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center"
							>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{ type: "spring", stiffness: 200, damping: 15 }}
									className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
								>
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-green-400"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</motion.div>

								<h2 className="text-2xl font-bold text-blue-400 mb-2">
									Password Updated
								</h2>
								<p className="text-blue-300/60">
									Redirecting you to login...
								</p>
							</motion.div>
						)}
					</AnimatePresence>
				</Glass>
			</motion.div>
		</div>
	);
}
