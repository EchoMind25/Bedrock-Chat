"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { useFamilyStore } from "@/store/family.store";
import { motion } from "motion/react";

const navigationItems = [
	{ href: "/family/dashboard", label: "Dashboard", icon: "📊" },
	{ href: "/family/messages", label: "Messages", icon: "💬" },
	{ href: "/family/servers", label: "Servers", icon: "🏰" },
	{ href: "/family/friends", label: "Friends", icon: "👥" },
	{ href: "/family/flags", label: "Content Flags", icon: "🚩" },
];

export default function FamilyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated, user } = useAuthStore();
	const { isParent, isInitialized, init } = useFamilyStore();

	// Initialize family store
	useEffect(() => {
		if (user && !isInitialized) {
			init(user.id, user.accountType);
		}
	}, [user, isInitialized, init]);

	// Redirect if not authenticated or not a parent
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		} else if (isInitialized && !isParent) {
			router.push("/channels");
		}
	}, [isAuthenticated, isInitialized, isParent, router]);

	if (!isAuthenticated || !user || !isInitialized || !isParent) {
		return (
			<div className="min-h-screen bg-[oklch(0.12_0.02_250)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="mt-4 text-white/60">Loading Family Dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen overflow-hidden bg-[oklch(0.12_0.02_250)]">
			{/* Family Navigation Sidebar */}
			<aside className="w-64 bg-[oklch(0.15_0.02_250)] border-r border-white/5 flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-white/5">
					<Link
						href="/channels"
						className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
					>
						<span>←</span>
						<span className="text-sm">Back to Chat</span>
					</Link>
					<h1 className="mt-4 text-xl font-bold text-white">
						Family Dashboard
					</h1>
					<p className="text-sm text-white/60">Parent Controls</p>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-3 space-y-1">
					{navigationItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link key={item.href} href={item.href}>
								<motion.div
									className={`
										flex items-center gap-3 px-3 py-2.5 rounded-lg
										transition-colors cursor-pointer
										${
											isActive
												? "bg-white/10 text-white"
												: "text-white/70 hover:bg-white/5 hover:text-white"
										}
									`}
									whileHover={{ x: 4 }}
									whileTap={{ scale: 0.98 }}
								>
									<span className="text-xl">{item.icon}</span>
									<span className="font-medium">{item.label}</span>
								</motion.div>
							</Link>
						);
					})}
				</nav>

				{/* Footer */}
				<div className="p-4 border-t border-white/5">
					<div className="text-xs text-white/40 space-y-1">
						<p>🔒 All access is logged</p>
						<p>Teens can see transparency logs</p>
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<main className="flex-1 flex flex-col overflow-hidden">{children}</main>
		</div>
	);
}
