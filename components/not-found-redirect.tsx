"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export function NotFoundRedirect() {
	const router = useRouter();
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

	useEffect(() => {
		if (isAuthenticated) {
			router.replace("/friends");
		}
	}, [isAuthenticated, router]);

	return null;
}
