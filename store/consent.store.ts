import { create } from "zustand";
import { persist } from "zustand/middleware";
import { conditionalDevtools } from "@/lib/utils/devtools-config";
import type { ConsentPreferences } from "@/lib/types/consent";
import { DEFAULT_PREFERENCES } from "@/lib/types/consent";

/** Bump this when the privacy policy changes to re-prompt users */
const CURRENT_POLICY_VERSION = "1.0.0";

interface ConsentState {
	/** Whether the user has made a consent choice */
	hasConsented: boolean;
	/** Whether the banner should be visible */
	showBanner: boolean;
	/** Granular consent preferences */
	preferences: ConsentPreferences;

	// Actions
	acceptAll: () => void;
	rejectAll: () => void;
	savePreferences: (prefs: Partial<Pick<ConsentPreferences, "analytics" | "marketing" | "functional">>) => void;
	openBanner: () => void;
	checkPolicyUpdate: () => void;
}

export const useConsentStore = create<ConsentState>()(
	conditionalDevtools(
		persist(
			(set, get) => ({
				hasConsented: false,
				showBanner: true,
				preferences: DEFAULT_PREFERENCES,

				acceptAll: () =>
					set({
						hasConsented: true,
						showBanner: false,
						preferences: {
							necessary: true,
							analytics: true,
							marketing: true,
							functional: true,
							lastUpdated: new Date().toISOString(),
							policyVersion: CURRENT_POLICY_VERSION,
						},
					}),

				rejectAll: () =>
					set({
						hasConsented: true,
						showBanner: false,
						preferences: {
							necessary: true,
							analytics: false,
							marketing: false,
							functional: false,
							lastUpdated: new Date().toISOString(),
							policyVersion: CURRENT_POLICY_VERSION,
						},
					}),

				savePreferences: (prefs) =>
					set((state) => ({
						hasConsented: true,
						showBanner: false,
						preferences: {
							...state.preferences,
							...prefs,
							lastUpdated: new Date().toISOString(),
							policyVersion: CURRENT_POLICY_VERSION,
						},
					})),

				openBanner: () => set({ showBanner: true }),

				checkPolicyUpdate: () => {
					const { preferences } = get();
					if (preferences.policyVersion !== CURRENT_POLICY_VERSION) {
						set({ showBanner: true, hasConsented: false });
					}
				},
			}),
			{
				name: "bedrock-consent",
				partialize: (state) => ({
					hasConsented: state.hasConsented,
					showBanner: state.showBanner,
					preferences: state.preferences,
				}),
			},
		),
		{ name: "ConsentStore" },
	),
);
