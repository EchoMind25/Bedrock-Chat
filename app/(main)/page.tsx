"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useServerStore } from "@/store/server.store";

export default function MainPage() {
	const router = useRouter();
	const { currentServerId, currentChannelId } = useServerStore();

	useEffect(() => {
		// Redirect to current server/channel or default
		if (currentServerId && currentChannelId && currentServerId !== "home") {
			router.push(`/servers/${currentServerId}/${currentChannelId}`);
		} else {
			router.push("/friends");
		}
	}, [currentServerId, currentChannelId, router]);

	return (
		<div className="flex-1 flex items-center justify-center bg-[oklch(0.14_0.02_250)]">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="mt-4 text-white/60">Redirecting...</p>
			</div>
		</div>
	);
}
