"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useFamilyStore } from "@/store/family.store";

interface ChatMonitoringNoticeProps {
	channelName?: string;
}

/**
 * Collapsible notice shown above the message list for teens with monitoring level >= 2.
 * Reappears on every page load (cannot be permanently dismissed).
 */
export function ChatMonitoringNotice({ channelName }: ChatMonitoringNoticeProps) {
	const isTeen = useFamilyStore((s) => s.isTeen);
	const myMonitoringLevel = useFamilyStore((s) => s.myMonitoringLevel);
	const [collapsed, setCollapsed] = useState(false);

	if (!isTeen || !myMonitoringLevel || myMonitoringLevel < 2) return null;

	const isActiveMonitoring = myMonitoringLevel >= 3;
	const message = isActiveMonitoring
		? `Your parent has active monitoring of your messages${channelName ? ` in #${channelName}` : ""}.`
		: `Your parent can view your messages${channelName ? ` in #${channelName}` : ""} on request.`;

	if (collapsed) {
		return (
			<button
				type="button"
				onClick={() => setCollapsed(false)}
				className="w-full flex items-center justify-between gap-2 px-4 py-1.5 text-xs transition-colors"
				style={{
					background: "oklch(0.18 0.04 265 / 0.6)",
					borderBottom: "1px solid oklch(0.35 0.08 265 / 0.3)",
					color: "oklch(0.65 0.08 265)",
				}}
				aria-label="Show monitoring notice"
			>
				<span className="flex items-center gap-1.5">
					<Eye size={11} aria-hidden="true" />
					Family monitoring is active
				</span>
				<ChevronDown size={12} aria-hidden="true" />
			</button>
		);
	}

	return (
		<div
			className="px-4 py-2.5 flex items-start justify-between gap-3"
			style={{
				background: "oklch(0.18 0.04 265 / 0.6)",
				borderBottom: "1px solid oklch(0.35 0.08 265 / 0.3)",
			}}
			role="note"
			aria-label="Family monitoring notice"
		>
			<div className="flex items-start gap-2.5 flex-1 min-w-0">
				<Eye size={14} className="shrink-0 mt-0.5" style={{ color: "oklch(0.65 0.15 265)" }} aria-hidden="true" />
				<div className="flex-1 min-w-0">
					<p className="text-xs" style={{ color: "oklch(0.75 0.05 265)" }}>
						{message}{" "}
						<Link
							href="/family/dashboard"
							className="underline hover:no-underline"
							style={{ color: "oklch(0.65 0.15 265)" }}
						>
							View your transparency log.
						</Link>
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={() => setCollapsed(true)}
				className="shrink-0 text-white/30 hover:text-white/60 transition-colors"
				aria-label="Collapse monitoring notice"
			>
				<ChevronUp size={14} aria-hidden="true" />
			</button>
		</div>
	);
}
