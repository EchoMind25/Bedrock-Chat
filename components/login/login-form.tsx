"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import type { IntroPreference } from "@/store/onboarding.store";
import { Glass } from "@/components/ui/glass/glass";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Toggle } from "@/components/ui/toggle/toggle";
import { authFormVariants, worldSprings } from "@/lib/utils/intro-animations";
import Link from "next/link";

interface LoginFormProps {
	onSuccess: () => void;
}

/**
 * Extracted auth form with OAuth placeholders and intro preference selector.
 * Slides in after world formation completes.
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
	const login = useAuthStore((s) => s.login);
	const isLoading = useAuthStore((s) => s.isLoading);
	const error = useAuthStore((s) => s.error);
	const clearError = useAuthStore((s) => s.clearError);
	const hasSeenIntro = useOnboardingStore((s) => s.hasSeenIntro);
	const introPreference = useOnboardingStore((s) => s.introPreference);
	const setIntroPreference = useOnboardingStore((s) => s.setIntroPreference);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const emailRef = useRef<HTMLInputElement>(null);

	// Auto-focus email input on mount
	useEffect(() => {
		const timer = setTimeout(() => {
			emailRef.current?.focus();
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		const success = await login(email, password, rememberMe);
		if (success) {
			onSuccess();
		}
	};

	return (
		<motion.div
			className="relative z-10 min-h-screen flex items-center justify-center p-4"
			variants={authFormVariants}
			initial="initial"
			animate="animate"
			exit="exit"
			transition={worldSprings.formSlide}
		>
			<div className="w-full max-w-[420px]">
				<Glass
					variant="liquid-elevated"
					border="liquid"
					className="p-8"
				>
					{/* Logo */}
					<div className="text-center mb-8">
						<motion.h1
							className="text-2xl font-bold text-blue-400"
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
						>
							Welcome to Bedrock
						</motion.h1>
						<motion.p
							className="text-blue-300/60 mt-2"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							Sign in to enter your world
						</motion.p>
					</div>

					{/* OAuth Providers */}
					<motion.div
						className="space-y-3 mb-6"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.25 }}
					>
						<button
							type="button"
							aria-disabled="true"
							aria-label="Continue with Google (coming soon)"
							onClick={(e) => e.preventDefault()}
							className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg transition-all text-blue-200/70 text-sm cursor-not-allowed opacity-50"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span>Continue with Google</span>
							<span className="text-xs text-white/40">(coming soon)</span>
						</button>
						<button
							type="button"
							aria-disabled="true"
							aria-label="Continue with GitHub (coming soon)"
							onClick={(e) => e.preventDefault()}
							className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg transition-all text-blue-200/70 text-sm cursor-not-allowed opacity-50"
						>
							<svg
								className="w-5 h-5"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							<span>Continue with GitHub</span>
							<span className="text-xs text-white/40">(coming soon)</span>
						</button>
					</motion.div>

					{/* Divider */}
					<motion.div
						className="relative my-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3 }}
					>
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-white/10" />
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 text-blue-300/40 bg-transparent">
								or sign in with email
							</span>
						</div>
					</motion.div>

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

					{/* Form */}
					<motion.form
						onSubmit={handleSubmit}
						className="space-y-6"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.35 }}
					>
						<Input
							ref={emailRef}
							type="email"
							label="Email"
							labelClassName="text-blue-400"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="you@example.com"
							required
							autoComplete="email"
							id="email"
						/>

						<div>
							<Input
								type={showPassword ? "text" : "password"}
								label="Password"
								labelClassName="text-blue-400"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
								autoComplete="current-password"
								id="password"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="text-sm text-blue-400 hover:text-blue-300 mt-1"
							>
								{showPassword ? "Hide" : "Show"} password
							</button>
						</div>

						<div className="flex items-center justify-between">
							<Toggle
								checked={rememberMe}
								onChange={(e) =>
									setRememberMe(e.target.checked)
								}
								label="Remember me"
								className="text-blue-300/80"
							/>
							<button
								type="button"
								className="text-sm text-blue-400 hover:text-blue-300"
							>
								Forgot password?
							</button>
						</div>

						<Button
							type="submit"
							variant="primary"
							size="lg"
							className="w-full"
							loading={isLoading}
						>
							Enter Bedrock
						</Button>
					</motion.form>

					{/* Signup Link */}
					<p className="text-center mt-6 text-blue-300/60">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="text-blue-400 hover:text-blue-300"
						>
							Create one free
						</Link>
					</p>

					{/* Landing Page Link */}
					<p className="text-center mt-3 text-blue-300/40 text-sm">
						<Link
							href="/"
							className="text-blue-300/50 hover:text-blue-300/80 transition-colors"
						>
							Back to home
						</Link>
					</p>

					{/* Intro Preference (returning users only) */}
					{hasSeenIntro && (
						<motion.div
							className="mt-4 pt-4 border-t border-white/5 text-center"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.5 }}
						>
							<p className="text-xs text-blue-300/30 mb-2">
								Login intro
							</p>
							<div className="flex justify-center gap-1">
								{(
									[
										{ value: "full", label: "Full" },
										{ value: "condensed", label: "Quick" },
										{ value: "skip", label: "Skip" },
									] as const
								).map((opt) => (
									<button
										key={opt.value}
										type="button"
										onClick={() =>
											setIntroPreference(
												opt.value as IntroPreference,
											)
										}
										className={`px-3 py-1 text-xs rounded-md transition-all ${
											introPreference === opt.value
												? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
												: "text-blue-300/40 hover:text-blue-300/60 border border-transparent"
										}`}
									>
										{opt.label}
									</button>
								))}
							</div>
						</motion.div>
					)}
				</Glass>
			</div>
		</motion.div>
	);
}
