"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button/button";

export default function FamilyError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("[FamilyRoutes] Error:", error);
	}, [error]);

	return (
		<div className="flex-1 flex items-center justify-center p-8">
			<div className="text-center max-w-md space-y-6">
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-white">
						Something went wrong
					</h2>
					<p className="text-white/60 text-sm">
						{error.message ||
							"An unexpected error occurred in the family dashboard"}
					</p>
					{error.digest && (
						<p className="text-white/40 text-xs font-mono">
							Error ID: {error.digest}
						</p>
					)}
				</div>

				<div className="flex gap-3 justify-center">
					<Button variant="primary" onClick={reset}>
						Try Again
					</Button>
					<Link href="/family/dashboard">
						<Button variant="ghost">Back to Dashboard</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
