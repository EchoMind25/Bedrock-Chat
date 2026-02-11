"use client";

import { Glass } from "@/components/ui/glass/glass";
import { motion } from "motion/react";

export default function FriendsPage() {
	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			{/* Friends Header */}
			<div className="h-12 px-4 flex items-center gap-2 border-b border-white/10 bg-[oklch(0.15_0.02_250)]">
				<svg
					className="w-5 h-5 text-white/60"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Friends</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
				<h1 className="font-semibold text-white">Friends</h1>
			</div>

			{/* Friends Content */}
			<div className="flex-1 flex items-center justify-center p-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 20,
					}}
				>
					<Glass variant="strong" border="medium" className="max-w-2xl p-8">
						<div className="text-center">
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 200,
									damping: 15,
									delay: 0.1,
								}}
								className="w-20 h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center"
							>
								<span className="text-4xl">👥</span>
							</motion.div>

							<h2 className="text-2xl font-bold text-white mb-2">Friends</h2>
							<p className="text-white/60 mb-6">
								Manage your friends and see who's online.
							</p>

							<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
								<h3 className="font-semibold text-white mb-2">
									🚧 Friends List Coming Soon
								</h3>
								<p className="text-white/80 text-sm">
									Friend management features are currently under development in
									Phase 4.
								</p>
							</div>
						</div>
					</Glass>
				</motion.div>
			</div>
		</div>
	);
}
