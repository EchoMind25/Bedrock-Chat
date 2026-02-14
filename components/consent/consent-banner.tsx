"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useConsentStore } from "@/store/consent.store";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { ConsentSettings } from "./consent-settings";

export function ConsentBanner() {
	const showBanner = useConsentStore((s) => s.showBanner);
	const hasConsented = useConsentStore((s) => s.hasConsented);
	const acceptAll = useConsentStore((s) => s.acceptAll);
	const rejectAll = useConsentStore((s) => s.rejectAll);
	const checkPolicyUpdate = useConsentStore((s) => s.checkPolicyUpdate);

	const [showSettings, setShowSettings] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Only render after hydration to avoid SSR mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	// Check for policy version updates on mount
	useEffect(() => {
		if (mounted && hasConsented) {
			checkPolicyUpdate();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mounted, hasConsented]);

	if (!mounted || !showBanner) return null;

	return (
		<>
			<AnimatePresence>
				{showBanner && (
					<motion.div
						initial={{ y: 100, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 100, opacity: 0 }}
						transition={{ type: "spring", stiffness: 260, damping: 25 }}
						className="fixed bottom-0 left-0 right-0 z-60 p-4"
						role="dialog"
						aria-label="Cookie consent"
					>
						<Glass
							variant="liquid-elevated"
							border="liquid"
							className="max-w-4xl mx-auto p-6"
						>
							<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
								{/* Shield icon */}
								<div className="shrink-0">
									<svg
										className="w-8 h-8 text-primary"
										viewBox="0 0 24 24"
										fill="currentColor"
										role="img"
										aria-hidden="true"
									>
										<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
									</svg>
								</div>

								{/* Content */}
								<div className="flex-1 text-slate-200">
									<h3 className="text-lg font-semibold mb-1">
										Your Privacy Matters
									</h3>
									<p className="text-sm text-slate-300">
										We use cookies to enhance your experience. You choose what
										data we can collect.{" "}
										<button
											type="button"
											onClick={() => setShowSettings(true)}
											className="text-primary hover:underline focus:outline-hidden focus:ring-2 focus:ring-primary rounded-sm"
										>
											Customize settings
										</button>
									</p>
								</div>

								{/* Actions */}
								<div className="flex gap-3 shrink-0">
									<Button variant="ghost" size="sm" onClick={rejectAll}>
										Reject All
									</Button>
									<Button variant="primary" size="sm" onClick={acceptAll}>
										Accept All
									</Button>
								</div>
							</div>
						</Glass>
					</motion.div>
				)}
			</AnimatePresence>

			<ConsentSettings
				isOpen={showSettings}
				onClose={() => setShowSettings(false)}
			/>
		</>
	);
}
