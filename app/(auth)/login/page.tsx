"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Glass } from "@/components/ui/glass/glass";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";
import { Toggle } from "@/components/ui/toggle/toggle";
import Link from "next/link";
import { isDevelopment } from "@/lib/utils/dev-mode";

export default function LoginPage() {
	const router = useRouter();
	const { login, isLoading, error, clearError, devLogin } = useAuthStore();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

	// Dev mode detection (always true in development for easy access)
	const isDev = isDevelopment();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		clearError();

		const success = await login(email, password);
		if (success) {
			router.push("/servers/server-1/channel-1");
		}
	};

	const handleDevLogin = () => {
		devLogin();
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
								Quick Login
							</Button>
						</div>
					</Glass>
				</motion.div>
			)}

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
			>
				<Glass variant="strong" border="medium" className="w-full max-w-[420px] p-8">
					{/* Logo */}
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-white">Welcome Back</h1>
						<p className="text-white/60 mt-2">
							Sign in to continue to Bedrock Chat
						</p>
					</div>

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
					<form onSubmit={handleSubmit} className="space-y-6">
						<Input
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
								className="text-sm text-primary hover:text-primary-hover mt-1"
							>
								{showPassword ? "Hide" : "Show"} password
							</button>
						</div>

						<div className="flex items-center justify-between">
							<Toggle
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								label="Remember me"
							/>
							<button
								type="button"
								className="text-sm text-primary hover:text-primary-hover"
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
							Sign In
						</Button>
					</form>

					{/* Signup Link */}
					<p className="text-center mt-6 text-white/60">
						Don't have an account?{" "}
						<Link
							href="/signup"
							className="text-primary hover:text-primary-hover"
						>
							Create one free
						</Link>
					</p>

					{/* Dev Mode Helper */}
					{isDev && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
						>
							<p className="text-xs text-blue-400 text-center">
								<strong>Dev Tip:</strong> Any email + password (6+ chars) works,
								or use Quick Login above
							</p>
						</motion.div>
					)}
				</Glass>
			</motion.div>
		</div>
	);
}
