"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding.store";
import { AppEntranceTransition } from "@/components/transitions/app-entrance-transition";

/**
 * Always-mounted portal that renders the entrance transition overlay.
 * Lives in the root layout so it survives route changes — the portal
 * stays visible even when LoginPage unmounts during navigation.
 *
 * Safety: if the transition is active but the user ends up on an auth
 * page (e.g., server redirected back to /login due to a race condition),
 * the overlay clears after 1s so they can see the login form / error.
 */
export function GlobalEntranceTransition() {
	const showEntranceTransition = useOnboardingStore(
		(s) => s.showEntranceTransition,
	);
	const completeEntranceTransition = useOnboardingStore(
		(s) => s.completeEntranceTransition,
	);
	const pathname = usePathname();

	useEffect(() => {
		if (!showEntranceTransition) return;
		if (pathname !== "/login" && pathname !== "/signup") return;

		// Transition active on an auth page = something went wrong.
		// Clear after 1s to surface the login form / error state.
		const timer = setTimeout(completeEntranceTransition, 1000);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [showEntranceTransition, pathname]);

	return (
		<AppEntranceTransition
			isActive={showEntranceTransition}
			onComplete={completeEntranceTransition}
			preloadData={true}
		/>
	);
}
