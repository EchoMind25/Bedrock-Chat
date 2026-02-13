"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useOnboardingStore } from "@/store/onboarding.store";
import { OnboardingOverlay } from "@/components/onboarding/onboarding-overlay";

export default function OnboardingPage() {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const isInitializing = useAuthStore((s) => s.isInitializing);
	const isOnboardingComplete = useOnboardingStore(
		(s) => s.isOnboardingComplete,
	);

	useEffect(() => {
		if (isInitializing) return;

		if (!isAuthenticated) {
			router.push("/login");
		} else if (isOnboardingComplete) {
			router.push("/friends");
		}
	}, [isAuthenticated, isInitializing, isOnboardingComplete, router]);

	if (isInitializing || !isAuthenticated || isOnboardingComplete) {
		return (
			<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
				<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return <OnboardingOverlay />;
}
