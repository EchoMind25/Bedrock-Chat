import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";

export type IntroPreference = "full" | "condensed" | "skip";

interface OnboardingState {
	introPreference: IntroPreference;
	hasSeenIntro: boolean;
	isOnboardingComplete: boolean;
	onboardingStep: number;

	// App entrance transition (shown after login/signup and on PWA launch)
	showEntranceTransition: boolean;

	setIntroPreference: (pref: IntroPreference) => void;
	markIntroSeen: () => void;
	setOnboardingStep: (step: number) => void;
	completeOnboarding: () => void;
	resetOnboarding: () => void;
	triggerEntranceTransition: () => void;
	completeEntranceTransition: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
	conditionalDevtools(
		persist(
			(set) => ({
				introPreference: "full",
				hasSeenIntro: false,
				isOnboardingComplete: false,
				onboardingStep: 0,
				showEntranceTransition: false,

				setIntroPreference: (pref) => set({ introPreference: pref }),

				markIntroSeen: () => set({ hasSeenIntro: true }),

				setOnboardingStep: (step) => set({ onboardingStep: step }),

				completeOnboarding: () =>
					set({ isOnboardingComplete: true, onboardingStep: 0 }),

				resetOnboarding: () =>
					set({
						isOnboardingComplete: false,
						onboardingStep: 0,
						hasSeenIntro: false,
						introPreference: "full",
						showEntranceTransition: false,
					}),

				triggerEntranceTransition: () => set({ showEntranceTransition: true }),

				completeEntranceTransition: () => set({ showEntranceTransition: false }),
			}),
			{
				name: "bedrock-onboarding",
				partialize: (state) => ({
					introPreference: state.introPreference,
					hasSeenIntro: state.hasSeenIntro,
					isOnboardingComplete: state.isOnboardingComplete,
				}),
			},
		),
		{ name: "OnboardingStore" },
	),
);
