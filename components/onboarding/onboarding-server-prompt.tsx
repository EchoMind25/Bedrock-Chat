"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button/button";
import { Input } from "@/components/ui/input/input";

interface OnboardingServerPromptProps {
	onComplete: () => void;
	onBack: () => void;
}

/**
 * Step 3: Create or join a server.
 */
export function OnboardingServerPrompt({
	onComplete,
	onBack,
}: OnboardingServerPromptProps) {
	const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
	const [serverName, setServerName] = useState("");
	const [inviteCode, setInviteCode] = useState("");

	const handleCreate = () => {
		// Server creation will be handled by the main app
		// Just complete onboarding for now
		onComplete();
	};

	const handleJoin = () => {
		// Invite code joining will be handled by the main app
		onComplete();
	};

	return (
		<motion.div
			key="server"
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: -20 }}
		>
			<button
				type="button"
				onClick={mode === "choose" ? onBack : () => setMode("choose")}
				className="text-blue-300/60 hover:text-blue-300 mb-4 flex items-center gap-2 text-sm"
			>
				&#8592; Back
			</button>

			<h1 className="text-2xl font-bold text-blue-400 mb-2">
				{mode === "choose"
					? "Your First Server"
					: mode === "create"
						? "Create a Server"
						: "Join a Server"}
			</h1>
			<p className="text-blue-300/60 mb-8">
				{mode === "choose"
					? "Servers are where you and your friends hang out."
					: mode === "create"
						? "Give your server a name to get started."
						: "Enter an invite code to join."}
			</p>

			{mode === "choose" && (
				<motion.div
					className="space-y-4"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
				>
					<button
						type="button"
						onClick={() => setMode("create")}
						className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-lg transition-all text-left group"
					>
						<div className="flex items-center gap-4">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
								style={{
									background:
										"linear-gradient(135deg, oklch(0.55 0.25 265 / 0.3), oklch(0.6 0.15 285 / 0.2))",
								}}
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-blue-400"
								>
									<line x1="12" y1="5" x2="12" y2="19" />
									<line x1="5" y1="12" x2="19" y2="12" />
								</svg>
							</div>
							<div>
								<h3 className="text-base font-semibold text-blue-300 group-hover:text-blue-400 transition-colors">
									Create a Server
								</h3>
								<p className="text-blue-200/40 text-sm mt-0.5">
									Start your own community
								</p>
							</div>
						</div>
					</button>

					<button
						type="button"
						onClick={() => setMode("join")}
						className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/50 rounded-lg transition-all text-left group"
					>
						<div className="flex items-center gap-4">
							<div
								className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
								style={{
									background:
										"linear-gradient(135deg, oklch(0.6 0.2 145 / 0.3), oklch(0.55 0.15 160 / 0.2))",
								}}
							>
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-green-400"
								>
									<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
									<polyline points="10 17 15 12 10 7" />
									<line x1="15" y1="12" x2="3" y2="12" />
								</svg>
							</div>
							<div>
								<h3 className="text-base font-semibold text-blue-300 group-hover:text-blue-400 transition-colors">
									Join a Server
								</h3>
								<p className="text-blue-200/40 text-sm mt-0.5">
									Enter an invite code
								</p>
							</div>
						</div>
					</button>
				</motion.div>
			)}

			{mode === "create" && (
				<motion.div
					className="space-y-6"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<Input
						type="text"
						label="Server Name"
						labelClassName="text-blue-400"
						value={serverName}
						onChange={(e) => setServerName(e.target.value)}
						placeholder="My Awesome Server"
						id="server-name"
						autoFocus
					/>
					<Button
						variant="primary"
						size="lg"
						className="w-full"
						onClick={handleCreate}
						disabled={!serverName.trim()}
					>
						Create Server
					</Button>
				</motion.div>
			)}

			{mode === "join" && (
				<motion.div
					className="space-y-6"
					initial={{ opacity: 0, x: 20 }}
					animate={{ opacity: 1, x: 0 }}
				>
					<Input
						type="text"
						label="Invite Code"
						labelClassName="text-blue-400"
						value={inviteCode}
						onChange={(e) => setInviteCode(e.target.value)}
						placeholder="Enter invite code or link"
						id="invite-code"
						autoFocus
					/>
					<Button
						variant="primary"
						size="lg"
						className="w-full"
						onClick={handleJoin}
						disabled={!inviteCode.trim()}
					>
						Join Server
					</Button>
				</motion.div>
			)}

			{/* Skip option */}
			<div className="mt-6 text-center">
				<button
					type="button"
					onClick={onComplete}
					className="text-sm text-blue-300/40 hover:text-blue-300/60 transition-colors"
				>
					I&apos;ll do this later
				</button>
			</div>
		</motion.div>
	);
}
