"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FamilyPage() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/family/dashboard");
	}, [router]);

	return (
		<div className="flex items-center justify-center h-full">
			<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
		</div>
	);
}
