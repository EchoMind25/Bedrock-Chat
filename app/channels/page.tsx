"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function ChannelsPage() {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const isInitializing = useAuthStore((s) => s.isInitializing);

	useEffect(() => {
		// Wait for auth check to complete before deciding where to redirect
		if (isInitializing) return;

		if (!isAuthenticated) {
			router.push("/login");
		} else {
			// Redirect to main app layout
			router.push("/friends");
		}
	}, [isAuthenticated, isInitializing, router]);

	return (
		<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="mt-4 text-white/60">Redirecting...</p>
			</div>
		</div>
	);
}
