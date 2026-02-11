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
import { isDevelopment } from "@/lib/utils/dev-mode";

type Step = 1 | 2 | 3 | 4;

export default function SignupPage() {
	const router = useRouter();
	const { signup, isLoading, error, clearError, devLogin } = useAuthStore();

	const [step, setStep] = useState<Step>(1);
	const [formData, setFormData] = useState<Partial<SignupData>>({
		accountType: "standard",
	});
	const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
	const [confirmPassword, setConfirmPassword] = useState("");

	// Dev mode detection
	const isDev = isDevelopment();

	const handleDevLogin = () => {
		devLogin();
		router.push("/servers/server-1/channel-1");
	};

	const handleAccountTypeSelect = (type: "standard" | "parent") => {
		setFormData({ ...formData, accountType: type });
		setStep(2);
	};

	const handleDetailsSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		// Simple validation
		if (!formData.email || !formData.username || !formData.password) {
			return;
		}

		if (formData.password !== confirmPassword) {
			return;
		}

		// In mock version, skip to step 4 (welcome) or simulate verification
		setStep(3);
	};

	const handleVerification = async () => {
		const code = verificationCode.join("");
		if (code.length !== 6) return;

		// Mock: Accept any 6 digits after minimal delay
		await new Promise((r) => setTimeout(r, 100));

		// Create account
		const success = await signup(formData as SignupData);
		if (success) {
			setStep(4);
		}
	};

	const handleComplete = () => {
		router.push("/servers/server-1/channel-1");
	};

	return (
		<div className="min-h-screen animated-gradient flex items-center justify-center p-4">
			{/* Dev Mode Banner */}
			{isDev && (
				<motion.div
					initial={{ y: -100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
				>
					<Glass variant="strong" className="px-6 py-3 backdrop-blur-xl">
						<div className="flex items-center gap-4">
							<span className="text-sm text-white/80">Development Mode</span>
							<Button
								size="sm"
								onClick={handleDevLogin}
								className="!py-1 !px-3 text-xs"
							>
								Skip Signup
							</Button>
						</div>
					</Glass>
				</motion.div>
			)}

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				className="w-full max-w-[520px]"
			>
				{/* Progress Indicator */}
				{step < 4 && (
					<div className="mb-6 flex justify-center gap-2">
						{[1, 2, 3].map((s) => (
							<div
								key={s}
								className={`h-1 w-16 rounded-full transition-all ${
									s <= step ? "bg-primary" : "bg-white/20"
								}`}
							/>
						))}
					</div>
				)}

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
								<h1 className="text-2xl font-bold text-white text-center mb-2">
									Choose Account Type
								</h1>
								<p className="text-white/60 text-center mb-8">
									Select the account type that fits your needs
								</p>

								<div className="space-y-4">
									<button
										type="button"
										onClick={() => handleAccountTypeSelect("standard")}
										className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-lg transition-all text-left group"
									>
										<h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
											Standard Account
										</h3>
										<p className="text-white/60 text-sm">
											Full privacy, E2E encryption, complete control over your
											data and communications.
										</p>
									</button>

									<button
										type="button"
										onClick={() => handleAccountTypeSelect("parent")}
										className="w-full p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-lg transition-all text-left group"
									>
										<h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
											Family Account
										</h3>
										<p className="text-white/60 text-sm">
											Parent-managed for teens with transparent oversight and
											monitoring controls.
										</p>
									</button>
								</div>

								<p className="text-center mt-6 text-white/60">
									Already have an account?{" "}
									<Link
										href="/login"
										className="text-primary hover:text-primary-hover"
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
									className="text-white/60 hover:text-white mb-4 flex items-center gap-2"
								>
									← Back
								</button>

								<h1 className="text-2xl font-bold text-white mb-2">
									Create Your Account
								</h1>
								<p className="text-white/60 mb-8">
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
											value={formData.parentEmail || ""}
											onChange={(e) =>
												setFormData({ ...formData, parentEmail: e.target.value })
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

						{/* Step 3: Verification */}
						{step === 3 && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								className="text-center"
							>
								<button
									type="button"
									onClick={() => setStep(2)}
									className="text-white/60 hover:text-white mb-4 flex items-center gap-2"
								>
									← Back
								</button>

								<h1 className="text-2xl font-bold text-white mb-2">
									Verify Your Email
								</h1>
								<p className="text-white/60 mb-8">
									We've sent a 6-digit code to{" "}
									<span className="text-white">{formData.email}</span>
								</p>

								{/* 6-digit code input */}
								<div className="flex gap-2 justify-center mb-6">
									{verificationCode.map((digit, index) => (
										<input
											key={index}
											type="text"
											maxLength={1}
											value={digit}
											onChange={(e) => {
												const newCode = [...verificationCode];
												newCode[index] = e.target.value;
												setVerificationCode(newCode);

												// Auto-advance to next input
												if (e.target.value && index < 5) {
													const nextInput = document.querySelector(
														`input[name="code-${index + 1}"]`,
													) as HTMLInputElement;
													nextInput?.focus();
												}
											}}
											name={`code-${index}`}
											className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none text-white"
										/>
									))}
								</div>

								<Button
									variant="primary"
									size="lg"
									className="w-full"
									onClick={handleVerification}
									loading={isLoading}
									disabled={verificationCode.join("").length !== 6}
								>
									Verify & Create Account
								</Button>

								<button
									type="button"
									className="text-sm text-primary hover:text-primary-hover mt-4"
								>
									Resend code
								</button>

								{isDev && (
									<p className="text-xs text-blue-400 mt-4">
										Dev: Any 6 digits will work
									</p>
								)}
							</motion.div>
						)}

						{/* Step 4: Welcome */}
						{step === 4 && (
							<motion.div
								key="step4"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								className="text-center"
							>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={{
										type: "spring",
										stiffness: 200,
										damping: 15,
										delay: 0.2,
									}}
									className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center"
								>
									<span className="text-4xl">🎉</span>
								</motion.div>

								<h1 className="text-3xl font-bold text-white mb-2">
									Welcome to Bedrock Chat!
								</h1>
								<p className="text-white/60 mb-8">
									Your account has been created successfully.
								</p>

								<div className="bg-white/5 rounded-lg p-6 mb-8 text-left">
									<h3 className="font-semibold text-white mb-4">
										Quick Tips to Get Started:
									</h3>
									<ul className="space-y-3 text-white/80 text-sm">
										<li className="flex items-start gap-3">
											<span className="text-primary">✓</span>
											<span>
												Your data is encrypted and private by default
											</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-primary">✓</span>
											<span>Create or join servers to connect with others</span>
										</li>
										<li className="flex items-start gap-3">
											<span className="text-primary">✓</span>
											<span>Customize your profile in settings</span>
										</li>
									</ul>
								</div>

								<Button
									variant="primary"
									size="lg"
									className="w-full"
									onClick={handleComplete}
								>
									Get Started
								</Button>
							</motion.div>
						)}
					</AnimatePresence>
				</Glass>
			</motion.div>
		</div>
	);
}
