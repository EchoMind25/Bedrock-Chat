"use client";

import { useEffect } from "react";

export default function ParentDashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[ParentDashboard Error]", error);
	}, [error]);

	return (
		<div className="flex-1 flex items-center justify-center p-8" style={{ backgroundColor: "var(--pd-bg, #f5f5f7)" }}>
			<div className="text-center max-w-md">
				<div className="w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
					<svg
						className="w-7 h-7"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						style={{ color: "var(--pd-danger, #ef4444)" }}
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
				<h2 className="text-lg font-semibold mb-2" style={{ color: "var(--pd-text, #1a1a2e)" }}>
					Dashboard Error
				</h2>
				<p className="text-sm mb-2" style={{ color: "var(--pd-text-muted, #6b7280)" }}>
					The parent dashboard encountered an error. Your data is safe.
				</p>
				{error?.message && (
					<p className="text-xs mb-6 break-words" style={{ color: "var(--pd-text-muted, #9ca3af)" }}>
						{error.message}
					</p>
				)}
				<div className="flex gap-3 justify-center">
					<button
						type="button"
						onClick={reset}
						className="px-6 py-2.5 text-white text-sm font-medium rounded-lg transition-colors"
						style={{ backgroundColor: "var(--pd-primary, #5b6eae)" }}
					>
						Try Again
					</button>
					<button
						type="button"
						onClick={() => (window.location.href = "/channels")}
						className="px-6 py-2.5 text-sm font-medium rounded-lg transition-colors"
						style={{
							backgroundColor: "var(--pd-bg-secondary, #e5e7eb)",
							color: "var(--pd-text-secondary, #4b5563)",
						}}
					>
						Back to Chat
					</button>
				</div>
			</div>
		</div>
	);
}
