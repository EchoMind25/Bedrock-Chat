"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { motion } from "motion/react";
import { useFamilyStore } from "@/store/family.store";
import { MONITORING_LEVELS } from "@/lib/types/family";

/**
 * Non-dismissible banner shown at the top of the main content area for teen accounts.
 * IMPORTANT: Must never be permanently dismissible (FTC §5 / no deception requirement).
 */
export function MonitoringBadge() {
	const isTeen = useFamilyStore((s) => s.isTeen);
	const isInitialized = useFamilyStore((s) => s.isInitialized);
	const myMonitoringLevel = useFamilyStore((s) => s.myMonitoringLevel);

	if (!isTeen || !isInitialized || !myMonitoringLevel) return null;

	const levelInfo = MONITORING_LEVELS[myMonitoringLevel];

	return (
		<motion.div
			initial={{ y: -32, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.3 }}
			className="flex items-center justify-between gap-3 px-4 py-2 shrink-0"
			style={{
				background: `color-mix(in oklch, ${levelInfo.color} 12%, transparent)`,
				borderBottom: `1px solid color-mix(in oklch, ${levelInfo.color} 20%, transparent)`,
			}}
			role="status"
			aria-label="Family monitoring is active on your account"
		>
			<div className="flex items-center gap-2 text-xs">
				<Shield size={13} style={{ color: levelInfo.color }} aria-hidden="true" />
				<span className="font-medium" style={{ color: levelInfo.color }}>
					Family Monitoring Active
				</span>
				<span className="opacity-40 text-white">·</span>
				<span className="text-white/50">{levelInfo.name}</span>
			</div>
			<Link
				href="/family/dashboard"
				className="text-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
				style={{ color: levelInfo.color }}
			>
				Details
			</Link>
		</motion.div>
	);
}
