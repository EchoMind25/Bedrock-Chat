export interface ConsentPreferences {
	/** Always true - required for core functionality */
	necessary: true;
	/** Performance and usage analytics */
	analytics: boolean;
	/** Promotional communications */
	marketing: boolean;
	/** Enhanced features (voice settings, theme persistence) */
	functional: boolean;
	/** ISO timestamp of last update */
	lastUpdated: string;
	/** Policy version user consented to */
	policyVersion: string;
}

export const DEFAULT_PREFERENCES: ConsentPreferences = {
	necessary: true,
	analytics: false,
	marketing: false,
	functional: false,
	lastUpdated: new Date().toISOString(),
	policyVersion: "1.0.0",
};
