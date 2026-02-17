"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding.store";
import { LoginForm } from "@/components/login/login-form";
import { AnimatePresence } from "motion/react";

type LoginPhase = "form" | "transitioning";

export default function LoginPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const isOnboardingComplete = useOnboardingStore(
		(s) => s.isOnboardingComplete,
	);
	const triggerEntranceTransition = useOnboardingStore(
		(s) => s.triggerEntranceTransition,
	);

	const [phase, setPhase] = useState<LoginPhase>("form");

	const handleLoginSuccess = useCallback(() => {
		// Hide the form immediately.
		setPhase("transitioning");
		// Activate the root-layout portal (GlobalEntranceTransition).
		// The portal covers the screen for the full duration of the
		// route change — no re-flash of the login form.
		triggerEntranceTransition();
		// Navigate immediately. The portal survives the route change
		// because it lives in the root layout, not in this component.
		const destination = isOnboardingComplete ? "/channels" : "/onboarding";
		router.push(destination);
	}, [triggerEntranceTransition, isOnboardingComplete, router]);

	const showForm = phase === "form";

	return (
		<div className="min-h-screen relative overflow-hidden bg-black">
			{searchParams.get("error") === "confirmation_failed" && showForm && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
					<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
						<p className="text-sm text-red-400">
							Email confirmation failed. Your link may have expired. Please try
							signing up again.
						</p>
					</div>
				</div>
			)}

			{/* Login Form - hidden once login succeeds */}
			<AnimatePresence>
				{showForm && <LoginForm onSuccess={handleLoginSuccess} />}
			</AnimatePresence>
		</div>
	);
}
