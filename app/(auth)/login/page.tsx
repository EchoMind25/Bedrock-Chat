"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding.store";
import { LoginForm } from "@/components/login/login-form";
import { AppEntranceTransition } from "@/components/transitions/app-entrance-transition";

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isOnboardingComplete = useOnboardingStore(
		(s) => s.isOnboardingComplete,
	);
	const showEntranceTransition = useOnboardingStore((s) => s.showEntranceTransition);
	const triggerEntranceTransition = useOnboardingStore((s) => s.triggerEntranceTransition);
	const completeEntranceTransition = useOnboardingStore((s) => s.completeEntranceTransition);

	// Clear any stale entrance transition state on mount
	useEffect(() => {
		completeEntranceTransition();
	}, [completeEntranceTransition]);

	const handleLoginSuccess = useCallback(() => {
		// Trigger entrance transition instead of immediate redirect
		triggerEntranceTransition();
	}, [triggerEntranceTransition]);

	const handleEntranceComplete = useCallback(() => {
		completeEntranceTransition();
		// Navigate to appropriate destination after transition
		if (isOnboardingComplete) {
			router.push("/channels");
		} else {
			router.push("/onboarding");
		}
	}, [isOnboardingComplete, router, completeEntranceTransition]);

	return (
		<div className="min-h-screen relative overflow-hidden bg-black">
			{searchParams.get("error") === "confirmation_failed" && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
					<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p className="text-sm text-red-400">
							Email confirmation failed. Your link may have expired.
							Please try signing up again.
						</p>
					</div>
				</div>
			)}
			{/* Login Form - shown immediately */}
			<LoginForm onSuccess={handleLoginSuccess} />

			{/* App Entrance Transition (after successful login) */}
			<AppEntranceTransition
				isActive={showEntranceTransition}
				onComplete={handleEntranceComplete}
				preloadData={true}
			/>
		</div>
	);
}
