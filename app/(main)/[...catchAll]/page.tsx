"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CatchAllPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/friends");
	}, [router]);

	return (
		<div className="flex-1 flex items-center justify-center bg-[oklch(0.14_0.02_250)]">
			<div className="text-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
				<p className="mt-4 text-white/60">Redirecting...</p>
			</div>
		</div>
	);
}
