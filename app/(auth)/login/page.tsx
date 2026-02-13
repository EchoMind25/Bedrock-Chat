"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { useOnboardingStore } from "@/store/onboarding.store";
import { WorldFormation } from "@/components/login/world-formation/world-formation";
import { LoginForm } from "@/components/login/login-form";
import { SkipIntroButton } from "@/components/login/skip-intro-button";
import { AppEntranceTransition } from "@/components/transitions/app-entrance-transition";

export default function LoginPage() {
	const router = useRouter();
	const introPreference = useOnboardingStore((s) => s.introPreference);
	const hasSeenIntro = useOnboardingStore((s) => s.hasSeenIntro);
	const markIntroSeen = useOnboardingStore((s) => s.markIntroSeen);
	const isOnboardingComplete = useOnboardingStore(
		(s) => s.isOnboardingComplete,
	);
	const showEntranceTransition = useOnboardingStore((s) => s.showEntranceTransition);
	const triggerEntranceTransition = useOnboardingStore((s) => s.triggerEntranceTransition);
	const completeEntranceTransition = useOnboardingStore((s) => s.completeEntranceTransition);

	const [showForm, setShowForm] = useState(false);
	const [introActive, setIntroActive] = useState(false);
	const [statusMessage, setStatusMessage] = useState("Loading Bedrock Chat");

	// Determine effective preference: first visit = full, returning = stored
	const effectivePreference = hasSeenIntro ? introPreference : "full";

	// Clear any stale entrance transition state on mount
	useEffect(() => {
		completeEntranceTransition();
	}, [completeEntranceTransition]);

	useEffect(() => {
		if (effectivePreference === "skip") {
			setShowForm(true);
			setStatusMessage("Login form ready");
		} else {
			setIntroActive(true);
		}
	}, [effectivePreference]);

	const handleWorldComplete = useCallback(() => {
		setIntroActive(false);
		setShowForm(true);
		setStatusMessage("Login form ready");
		markIntroSeen();
	}, [markIntroSeen]);

	const handleSkip = useCallback(() => {
		setIntroActive(false);
		setShowForm(true);
		setStatusMessage("Login form ready");
		markIntroSeen();
	}, [markIntroSeen]);

	const handleLoginSuccess = useCallback(() => {
		// Trigger entrance transition instead of immediate redirect
		setStatusMessage("Entering Bedrock...");
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
			{/* Screen reader status announcements */}
			<div className="sr-only" role="status" aria-live="polite">
				{statusMessage}
			</div>

			{/* World Formation Background */}
			{introActive && (
				<>
					<WorldFormation
						preference={effectivePreference}
						onComplete={handleWorldComplete}
					/>
					<SkipIntroButton onSkip={handleSkip} />
				</>
			)}

			{/* Auth Form */}
			<AnimatePresence>
				{showForm && <LoginForm onSuccess={handleLoginSuccess} />}
			</AnimatePresence>

			{/* App Entrance Transition (after login) */}
			<AppEntranceTransition
				isActive={showEntranceTransition}
				onComplete={handleEntranceComplete}
			/>
		</div>
	);
}
