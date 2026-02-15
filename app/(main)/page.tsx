"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";

export default function MainPage() {
	const router = useRouter();
	const currentServerId = useServerStore((s) => s.currentServerId);
	const currentChannelId = useServerStore((s) => s.currentChannelId);
	const isInitialized = useServerStore((s) => s.isInitialized);

	useEffect(() => {
		// Wait for store to initialize before redirecting
		if (!isInitialized) return;

		// Redirect to current server/channel or default
		// Use replace to avoid polluting browser history with redirect entries
		if (currentServerId && currentChannelId && currentServerId !== "home") {
			router.replace(`/servers/${currentServerId}/${currentChannelId}`);
		} else {
			router.replace("/friends");
		}
	}, [currentServerId, currentChannelId, isInitialized, router]);

	return (
		<div className="flex-1 flex items-center justify-center bg-[oklch(0.14_0.02_250)]">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="mt-4 text-white/60">Redirecting...</p>
			</div>
		</div>
	);
}
