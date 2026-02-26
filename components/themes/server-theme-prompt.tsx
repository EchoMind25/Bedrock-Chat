"use client";

import { motion, AnimatePresence } from "motion/react";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/store/theme.store";

interface ServerThemePromptProps {
	serverId: string;
	serverName: string;
	isOpen: boolean;
	onClose: () => void;
}

export function ServerThemePrompt({
	serverId,
	serverName,
	isOpen,
	onClose,
}: ServerThemePromptProps) {
	const setServerThemeDecision = useThemeStore((s) => s.setServerThemeDecision);

	const handleAccept = () => {
		setServerThemeDecision(serverId, "accepted");
		onClose();
	};

	const handleReject = () => {
		setServerThemeDecision(serverId, "rejected");
		onClose();
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: "spring", stiffness: 260, damping: 25 }}
					className="absolute bottom-20 left-4 right-4 z-30 pointer-events-none"
					role="dialog"
					aria-label="Server theme preference"
				>
					<Glass
						variant="liquid-elevated"
						border="liquid"
						className="p-4 rounded-2xl max-w-md mx-auto pointer-events-auto"
					>
						<div className="flex flex-col gap-3">
							<div className="flex items-start gap-3">
								<div
									className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
									style={{ backgroundColor: "var(--color-primary)" }}
								>
									<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
											d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
									</svg>
								</div>
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-semibold text-white">
										{serverName} has a custom theme
									</h3>
									<p className="text-xs text-white/60 mt-0.5">
										Would you like to keep using this server&apos;s theme, or switch to your personal theme?
									</p>
								</div>
							</div>

							<div className="flex gap-2 justify-end">
								<Button variant="ghost" size="sm" onClick={handleReject}>
									My Theme
								</Button>
								<Button variant="primary" size="sm" onClick={handleAccept}>
									Use Server Theme
								</Button>
							</div>
						</div>
					</Glass>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
