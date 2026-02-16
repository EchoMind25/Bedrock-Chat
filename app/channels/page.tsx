"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChannelsPage() {
	const router = useRouter();

	useEffect(() => {
		// Always redirect to /friends; let (main) layout verify auth
		router.replace("/friends");
	}, [router]);

	return (
		<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="mt-4 text-white/60">Redirecting...</p>
			</div>
		</div>
	);
}
