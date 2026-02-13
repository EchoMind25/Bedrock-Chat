"use client";

import { useEffect } from "react";

export default function MainError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[MainLayout Error]", error);
	}, [error]);

	return (
		<div className="flex-1 flex items-center justify-center p-8 bg-[oklch(0.12_0.02_250)]">
			<div className="text-center max-w-md">
				<div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/10 flex items-center justify-center">
					<svg
						className="w-7 h-7 text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<title>Error</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>
				<h2 className="text-lg font-semibold text-white mb-2">
					Something went wrong
				</h2>
				<p className="text-sm text-white/50 mb-2">
					This page encountered an error. Your data is safe.
				</p>
				{error?.message && (
					<p className="text-xs text-white/30 mb-6 break-words">
						{error.message}
					</p>
				)}
				<div className="flex gap-3 justify-center">
					<button
						type="button"
						onClick={reset}
						className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
					>
						Try Again
					</button>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium rounded-lg transition-colors"
					>
						Reload
					</button>
				</div>
			</div>
		</div>
	);
}
