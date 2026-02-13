"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParentDashboardStore } from "@/store/parent-dashboard.store";
import { useFamilyStore } from "@/store/family.store";

export default function ParentDashboardRedirect() {
	const router = useRouter();
	const onboardingComplete = useParentDashboardStore((s) => s.onboardingComplete);
	const isInitialized = useFamilyStore((s) => s.isInitialized);

	useEffect(() => {
		// Wait for family store to initialize before redirecting
		if (!isInitialized) return;

		if (onboardingComplete) {
			router.replace("/parent-dashboard/overview");
		} else {
			router.replace("/parent-dashboard/onboarding");
		}
	}, [router, onboardingComplete, isInitialized]);

	return (
		<div className="flex items-center justify-center h-full">
			<div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: "var(--pd-primary)", borderTopColor: "transparent" }} />
		</div>
	);
}
