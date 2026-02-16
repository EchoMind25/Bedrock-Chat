"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import type { SignupData } from "@/store/auth.store";
import { Glass } from "@/components/ui/glass/glass";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import Link from "next/link";

type Step = 1 | 2 | 3;

export default function SignupPage() {
	const router = useRouter();
	const {
		signUpWithEmail,
		resendConfirmationEmail,
		isLoading,
		error,
		clearError,
	} = useAuthStore();

	const [step, setStep] = useState<Step>(1);
	const [formData, setFormData] = useState<Partial<SignupData>>({
		accountType: "standard",
	});
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resendCooldown, setResendCooldown] = useState(0);
	const [emailSent, setEmailSent] = useState(false);

	const handleAccountTypeSelect = (type: "standard" | "parent") => {
		setFormData({ ...formData, accountType: type });
		setStep(2);
	};

	const handleDetailsSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		if (!formData.email || !formData.username || !formData.password) {
			return;
		}

		if (formData.password !== confirmPassword) {
			return;
		}

		if (formData.password.length < 6) {
			return;
		}

		const success = await signUpWithEmail(formData as SignupData);
		if (success) {
			setEmailSent(true);
			setStep(3);
		}
	};

	const handleResendEmail = async () => {
		if (resendCooldown > 0 || !formData.email) return;
		clearError();

		setResendCooldown(60);
		const interval = setInterval(() => {
			setResendCooldown((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		const success = await resendConfirmationEmail(formData.email);
		if (success) {
			setEmailSent(true);
		}
	};

	return (
		<div className="min-h-screen animated-gradient flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				className="w-full max-w-[520px]"
			>
				{/* Progress Indicator */}
				<div className="mb-6 flex justify-center gap-2">
					{[1, 2, 3].map((s) => (
						<div
							key={s}
							className={`h-1 w-16 rounded-full transition-all ${
								s <= step ? "bg-blue-400" : "bg-white/20"
							}`}
						/>
					))}
				</div>

				<Glass variant="strong" border="medium" className="p-8">
					<AnimatePresence mode="wait">
						{/* Step 1: Account Type */}
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
							>
								<h1 className="text-2xl font-bold text-blue-400 text-center mb-2">
									Choose Account Type
								</h1>
								<p className="text-blue-300/60 text-center mb-8">
									Select the account type that fits your needs
								</p>

								<div className="space-y-4">
									<button
										type="button"
										onClick={() => handleAccountTypeSelect("standard")}
										className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-lg transition-all text-left group"
									>
										<h3 className="text-lg font-semibold text-blue-300 mb-2 group-hover:text-blue-400 transition-colors">
											Standard Account
										</h3>
										<p className="text-blue-200/50 text-sm">
											Full privacy, E2E encryption, complete control over your
											data and communications.
										</p>
									</button>

									<button
										type="button"
										onClick={() => handleAccountTypeSelect("parent")}
										className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-lg transition-all text-left group"
									>
										<h3 className="text-lg font-semibold text-blue-300 mb-2 group-hover:text-blue-400 transition-colors">
											Family Account
										</h3>
										<p className="text-blue-200/50 text-sm">
											Parent-managed for teens with transparent oversight and
											monitoring controls.
										</p>
									</button>
								</div>

								<p className="text-center mt-6 text-blue-300/60">
									Already have an account?{" "}
									<Link
										href="/login"
										className="text-blue-400 hover:text-blue-300"
									>
										Sign in
									</Link>
								</p>
							</motion.div>
						)}

						{/* Step 2: Account Details */}
						{step === 2 && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
							>
								<button
									type="button"
									onClick={() => setStep(1)}
									className="text-blue-300/60 hover:text-blue-300 mb-4 flex items-center gap-2"
								>
									← Back
								</button>

								<h1 className="text-2xl font-bold text-blue-400 mb-2">
									Create Your Account
								</h1>
								<p className="text-blue-300/60 mb-8">
									{formData.accountType === "parent"
										? "Parent Account"
										: "Standard Account"}
								</p>

								{/* Error Display */}
								<AnimatePresence>
									{error && (
										<motion.div
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0 }}
											className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6"
										>
											<p className="text-red-400 text-sm">{error}</p>
										</motion.div>
									)}
								</AnimatePresence>

								<form onSubmit={handleDetailsSubmit} className="space-y-6">
									<Input
										type="text"
										label="Username"
										labelClassName="text-blue-400"
										value={formData.username || ""}
										onChange={(e) =>
											setFormData({ ...formData, username: e.target.value })
										}
										placeholder="cooluser123"
										required
										id="username"
										helperText="Your unique username (3+ characters)"
									/>

									<Input
										type="email"
										label="Email"
										labelClassName="text-blue-400"
										value={formData.email || ""}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										placeholder="you@example.com"
										required
										autoComplete="email"
										id="email"
									/>

									<Input
										type="password"
										label="Password"
										labelClassName="text-blue-400"
										value={formData.password || ""}
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
										placeholder="••••••••"
										required
										autoComplete="new-password"
										id="password"
										helperText="At least 6 characters"
									/>

									<Input
										type="password"
										label="Confirm Password"
										labelClassName="text-blue-400"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										placeholder="••••••••"
										required
										id="confirm-password"
									/>

									{formData.accountType === "parent" && (
										<Input
											type="email"
											label="Teen's Email (Optional)"
											labelClassName="text-blue-400"
											value={formData.parentEmail || ""}
											onChange={(e) =>
												setFormData({
													...formData,
													parentEmail: e.target.value,
												})
											}
											placeholder="teen@example.com"
											id="parent-email"
											helperText="You can add this later"
										/>
									)}

									<Button
										type="submit"
										variant="primary"
										size="lg"
										className="w-full"
										loading={isLoading}
									>
										Continue
									</Button>
								</form>
							</motion.div>
						)}

						{/* Step 3: Check Your Email */}
						{step === 3 && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="text-center"
							>
								{/* Email icon */}
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{
										type: "spring",
										stiffness: 200,
										damping: 15,
									}}
									className="w-20 h-20 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center"
								>
									<svg
										width="40"
										height="40"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
										className="text-blue-400"
									>
										<rect width="20" height="16" x="2" y="4" rx="2" />
										<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
									</svg>
								</motion.div>

								<h1 className="text-2xl font-bold text-blue-400 mb-2">
									Check Your Email
								</h1>
								<p className="text-blue-300/60 mb-2">
									We sent a confirmation link to
								</p>
								<p className="text-blue-300 font-medium mb-6">
									{formData.email}
								</p>

								<div className="bg-white/5 rounded-lg p-5 mb-6 text-left">
									<p className="text-blue-200/70 text-sm leading-relaxed">
										Click the link in the email to verify your account and
										get started. The link will redirect you back here
										automatically.
									</p>
								</div>

								{/* Error Display */}
								<AnimatePresence>
									{error && (
										<motion.div
											initial={{ opacity: 0, x: -10 }}
											animate={{ opacity: 1, x: 0 }}
											exit={{ opacity: 0 }}
											className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4"
										>
											<p className="text-red-400 text-sm">{error}</p>
										</motion.div>
									)}
								</AnimatePresence>

								{emailSent && (
									<motion.p
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="text-green-400 text-sm mb-4"
									>
										Confirmation email sent!
									</motion.p>
								)}

								<div className="space-y-3">
									<p className="text-blue-300/40 text-sm">
										Didn't receive the email? Check your spam folder or
									</p>
									<button
										type="button"
										className={`text-sm ${
											resendCooldown > 0
												? "text-blue-300/40 cursor-not-allowed"
												: "text-blue-400 hover:text-blue-300"
										}`}
										onClick={handleResendEmail}
										disabled={resendCooldown > 0 || isLoading}
									>
										{resendCooldown > 0
											? `Resend email in ${resendCooldown}s`
											: "Resend confirmation email"}
									</button>
								</div>

								<div className="mt-8 pt-6 border-t border-white/10">
									<button
										type="button"
										onClick={() => {
											clearError();
											setStep(2);
										}}
										className="text-blue-300/60 hover:text-blue-300 text-sm"
									>
										← Use a different email
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</Glass>
			</motion.div>
		</div>
	);
}
