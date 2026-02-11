"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

/**
 * Auth guard hook that redirects based on authentication state
 * @param requireAuth - If true, redirects to /login when not authenticated. If false, redirects to /channels when authenticated.
 * @returns Object containing isAuthenticated and isLoading
 */
export function useAuthGuard(requireAuth = true) {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuthStore();

	useEffect(() => {
		if (isLoading) return;

		if (requireAuth && !isAuthenticated) {
			router.push("/login");
		}

		if (!requireAuth && isAuthenticated) {
			router.push("/channels");
		}
	}, [isAuthenticated, isLoading, requireAuth, router]);

	return { isAuthenticated, isLoading };
}
