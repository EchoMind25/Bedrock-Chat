"use client";

import { motion } from "motion/react";
import { useAuthStore } from "@/store/auth.store";
import { Glass } from "@/components/ui/glass/glass";
import { Button } from "@/components/ui/button/button";

export default function WaitlistPendingPage() {
	const logout = useAuthStore((s) => s.logout);
	const user = useAuthStore((s) => s.user);

	return (
		<div className="min-h-screen animated-gradient flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 260, damping: 20 }}
				className="w-full max-w-[520px]"
			>
				<Glass variant="strong" border="medium" className="p-8 text-center">
					{/* Hourglass icon */}
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
							<path d="M5 22h14" />
							<path d="M5 2h14" />
							<path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
							<path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
						</svg>
					</motion.div>

					<h1 className="text-2xl font-bold text-blue-400 mb-2">
						You&apos;re on the Waitlist
					</h1>
					<p className="text-blue-300/60 mb-6">
						Hey{user?.username ? ` ${user.username}` : ""}, your
						account is created and secured. We&apos;ll let you in as
						soon as a spot opens up during our beta launch.
					</p>

					<div className="bg-white/5 rounded-lg p-5 mb-6 text-left">
						<p className="text-blue-200/70 text-sm leading-relaxed">
							Your username is reserved and your data is safe.
							When you&apos;re approved, just sign in and
							you&apos;re ready to go. No extra steps.
						</p>
					</div>

					<Button
						variant="ghost"
						onClick={() => logout()}
						className="w-full"
					>
						Sign Out
					</Button>
				</Glass>
			</motion.div>
		</div>
	);
}
