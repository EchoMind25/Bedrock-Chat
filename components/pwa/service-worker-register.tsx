"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

export function ServiceWorkerRegister() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
		null
	);
	const [showUpdate, setShowUpdate] = useState(false);

	const onUpdate = useCallback((sw: ServiceWorker) => {
		setWaitingWorker(sw);
		setShowUpdate(true);
	}, []);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!("serviceWorker" in navigator) ||
			process.env.NODE_ENV !== "production"
		) {
			return;
		}

		let refreshing = false;

		// Reload once when a new SW takes control
		navigator.serviceWorker.addEventListener("controllerchange", () => {
			if (refreshing) return;
			refreshing = true;
			window.location.reload();
		});

		navigator.serviceWorker
			.register("/sw.js")
			.then((registration) => {
				// If there's already a waiting worker (e.g. page refreshed while update pending)
				if (registration.waiting) {
					onUpdate(registration.waiting);
					return;
				}

				registration.addEventListener("updatefound", () => {
					const installing = registration.installing;
					if (!installing) return;

					installing.addEventListener("statechange", () => {
						if (
							installing.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New SW installed and waiting — there's an update
							onUpdate(installing);
						}
					});
				});
			})
			.catch((err) => {
				console.error("SW registration failed:", err);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleUpdate = () => {
		if (!waitingWorker) return;
		waitingWorker.postMessage({ type: "SKIP_WAITING" });
	};

	const handleDismiss = () => {
		setShowUpdate(false);
	};

	return (
		<AnimatePresence>
			{showUpdate && (
				<motion.div
					initial={{ opacity: 0, y: 80 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 80 }}
					transition={{ type: "spring", stiffness: 260, damping: 20 }}
					className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 backdrop-blur-md bg-[oklch(0.15_0.02_285/0.85)] shadow-lg"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 20 20"
						fill="none"
						className="shrink-0 text-primary"
					>
						<path
							d="M10 1.667v6.666M10 8.333l3.333-3.333M10 8.333L6.667 5M3.333 13.333v.834a2.5 2.5 0 002.5 2.5h8.334a2.5 2.5 0 002.5-2.5v-.834"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span className="text-sm text-white/90">
						A new version is available
					</span>
					<button
						type="button"
						onClick={handleUpdate}
						className="ml-1 px-3 py-1 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors"
					>
						Refresh
					</button>
					<button
						type="button"
						onClick={handleDismiss}
						className="p-1 text-white/40 hover:text-white/80 transition-colors"
						aria-label="Dismiss update notice"
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
							<path
								d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
