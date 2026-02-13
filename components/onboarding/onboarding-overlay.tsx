"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { Glass } from "@/components/ui/glass/glass";
import { OnboardingWelcome } from "./onboarding-welcome";
import { OnboardingProfile } from "./onboarding-profile";
import { OnboardingServerPrompt } from "./onboarding-server-prompt";

/**
 * Full-screen onboarding wizard for first-time users.
 * 3 steps: Welcome -> Profile -> Server.
 */
export function OnboardingOverlay() {
	const router = useRouter();
	const step = useOnboardingStore((s) => s.onboardingStep);
	const setStep = useOnboardingStore((s) => s.setOnboardingStep);
	const completeOnboarding = useOnboardingStore(
		(s) => s.completeOnboarding,
	);

	const handleComplete = useCallback(() => {
		completeOnboarding();
		router.push("/friends");
	}, [completeOnboarding, router]);

	const handleSkip = useCallback(() => {
		completeOnboarding();
		router.push("/friends");
	}, [completeOnboarding, router]);

	return (
		<div className="min-h-screen animated-gradient flex flex-col items-center justify-center p-4">
			{/* Progress dots */}
			<div className="mb-6 flex justify-center gap-2">
				{[0, 1, 2].map((s) => (
					<div
						key={s}
						className={`h-1 w-16 rounded-full transition-all duration-300 ${
							s <= step ? "bg-blue-400" : "bg-white/20"
						}`}
					/>
				))}
			</div>

			<Glass
				variant="liquid-elevated"
				border="liquid"
				className="w-full max-w-[520px] p-8"
			>
				<AnimatePresence mode="wait">
					{step === 0 && (
						<OnboardingWelcome
							key="welcome"
							onNext={() => setStep(1)}
							onSkip={handleSkip}
						/>
					)}
					{step === 1 && (
						<OnboardingProfile
							key="profile"
							onNext={() => setStep(2)}
							onBack={() => setStep(0)}
						/>
					)}
					{step === 2 && (
						<OnboardingServerPrompt
							key="server"
							onComplete={handleComplete}
							onBack={() => setStep(1)}
						/>
					)}
				</AnimatePresence>
			</Glass>
		</div>
	);
}
