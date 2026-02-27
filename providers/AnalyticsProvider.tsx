"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useConsentStore } from "@/store/consent.store";
import { AnalyticsCollector } from "@/lib/analytics/collector";
import type { AgeTier } from "@/lib/analytics/events";
import { initPerformanceObserver } from "@/lib/analytics/performance";

interface AnalyticsContextValue {
	collector: AnalyticsCollector | null;
}

export const AnalyticsContext = createContext<AnalyticsContextValue>({ collector: null });

export function useAnalyticsCollector(): AnalyticsCollector | null {
	return useContext(AnalyticsContext).collector;
}

function deriveAgeTier(accountType: string | undefined): AgeTier {
	if (!accountType) return "unknown";
	if (accountType === "teen") return "teen_13_15"; // conservative — no DOB available
	return "adult";
}

interface AnalyticsProviderProps {
	children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
	const [collector, setCollector] = useState<AnalyticsCollector | null>(null);
	const collectorRef = useRef<AnalyticsCollector | null>(null);
	const user = useAuthStore((s) => s.user);
	const analyticsEnabled = useConsentStore((s) => s.preferences.analytics);

	useEffect(() => {
		// Skip in SSR
		if (typeof window === "undefined") return;
		// Skip in development unless explicitly opted in
		if (
			process.env.NODE_ENV === "development" &&
			process.env.NEXT_PUBLIC_ANALYTICS_DEV !== "true"
		) {
			return;
		}

		const ageTier = deriveAgeTier(user?.accountType);

		// under_13: completely disabled
		if (ageTier === "under_13") return;

		const getEnabled = () => {
			// Read live from consent store state at flush time
			return useConsentStore.getState().preferences.analytics;
		};

		const instance = new AnalyticsCollector({
			endpoint: "/api/analytics/ingest",
			ageTier,
			getEnabled,
		});

		collectorRef.current = instance;
		setCollector(instance);

		// Register performance observers
		const cleanupPerf = initPerformanceObserver((name, durationMs, isError) => {
			instance.trackPerformance(name, durationMs, isError);
		});

		// Flush on tab hide/close
		const handleVisibilityChange = () => {
			if (document.visibilityState === "hidden") {
				instance.flush();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			instance.destroy();
			cleanupPerf();
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			collectorRef.current = null;
			setCollector(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.accountType]);

	// When consent is revoked, flush immediately
	useEffect(() => {
		if (!analyticsEnabled && collectorRef.current) {
			collectorRef.current.flush();
		}
	}, [analyticsEnabled]);

	return (
		<AnalyticsContext.Provider value={{ collector }}>
			{children}
		</AnalyticsContext.Provider>
	);
}
