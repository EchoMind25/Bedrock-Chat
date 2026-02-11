"use client";

import { use } from "react";
import { Glass } from "@/components/ui/glass/glass";
import { motion } from "motion/react";

interface PageProps {
	params: Promise<{
		userId: string;
	}>;
}

export default function DMPage({ params }: PageProps) {
	const { userId } = use(params);

	return (
		<div className="flex-1 flex flex-col bg-[oklch(0.14_0.02_250)]">
			{/* DM Header */}
			<div className="h-12 px-4 flex items-center gap-2 border-b border-white/10 bg-[oklch(0.15_0.02_250)]">
				<svg
					className="w-5 h-5 text-white/60"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<title>Direct Message</title>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
				<h1 className="font-semibold text-white">User {userId}</h1>
			</div>

			{/* DM Content */}
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
								<span className="text-4xl">💬</span>
							</motion.div>

							<h2 className="text-2xl font-bold text-white mb-2">
								Direct Messages
							</h2>
							<p className="text-white/60 mb-6">
								Private conversation with User {userId}.
							</p>

							<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
								<h3 className="font-semibold text-white mb-2">
									🚧 DMs Coming Soon
								</h3>
								<p className="text-white/80 text-sm">
									Direct messaging features are currently under development in
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
