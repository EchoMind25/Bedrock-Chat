"use client";

import { useState } from "react";
import { useFamilyStore } from "@/store/family.store";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";
import { Check, Eye, EyeOff, Info } from "lucide-react";

const LEVEL_ICONS: Record<MonitoringLevel, string> = {
	1: "1",
	2: "2",
	3: "3",
	4: "4",
};

const FEATURE_MATRIX = [
	{ feature: "View server list", levels: [true, true, true, true] },
	{ feature: "Basic activity stats", levels: [true, true, true, true] },
	{ feature: "Friend list visibility", levels: [true, true, true, true] },
	{ feature: "Message frequency data", levels: [false, true, true, true] },
	{ feature: "Channel topics visible", levels: [false, true, true, true] },
	{ feature: "On-demand message access", levels: [false, true, true, true] },
	{ feature: "AI content flags", levels: [false, false, true, true] },
	{ feature: "Server/friend approval required", levels: [false, false, true, true] },
	{ feature: "Real-time alerts", levels: [false, false, true, true] },
	{ feature: "Server whitelist", levels: [false, false, false, true] },
	{ feature: "Time limits & schedules", levels: [false, false, false, true] },
	{ feature: "Keyword alerts", levels: [false, false, false, true] },
	{ feature: "Complete activity logs", levels: [false, false, false, true] },
];

export default function MonitoringPage() {
	const getSelectedTeenAccount = useFamilyStore((s) => s.getSelectedTeenAccount);
	const setMonitoringLevel = useFamilyStore((s) => s.setMonitoringLevel);
	const teenAccount = getSelectedTeenAccount();
	const [showPreview, setShowPreview] = useState(false);
	const [showComparison, setShowComparison] = useState(false);

	if (!teenAccount) {
		return (
			<div className="flex items-center justify-center h-full">
				<p style={{ color: "var(--pd-text-muted)" }}>No teen account selected</p>
			</div>
		);
	}

	const currentLevel = teenAccount.monitoringLevel;
	const currentLevelInfo = MONITORING_LEVELS[currentLevel];

	return (
		<div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-semibold" style={{ color: "var(--pd-text)" }}>
					Monitoring Settings
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--pd-text-muted)" }}>
					Adjust the monitoring level for {teenAccount.user.displayName}. Changes are logged and visible to your teen.
				</p>
			</div>

			{/* Current level */}
			<div className="pd-card p-5">
				<div className="flex items-center gap-4">
					<div
						className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
						style={{
							backgroundColor: `${currentLevelInfo.color.replace(")", " / 0.15)")}`,
							color: currentLevelInfo.color,
						}}
					>
						{currentLevel}
					</div>
					<div className="flex-1">
						<h2 className="text-lg font-semibold" style={{ color: "var(--pd-text)" }}>
							Currently: {currentLevelInfo.name}
						</h2>
						<p className="text-sm" style={{ color: "var(--pd-text-muted)" }}>
							{currentLevelInfo.description}
						</p>
					</div>
				</div>
			</div>

			{/* Level selector */}
			<div>
				<h3 className="text-base font-semibold mb-3" style={{ color: "var(--pd-text)" }}>
					Select Monitoring Level
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{([1, 2, 3, 4] as MonitoringLevel[]).map((level) => {
						const info = MONITORING_LEVELS[level];
						const isActive = level === currentLevel;
						return (
							<button
								key={level}
								type="button"
								onClick={() => {
									if (!isActive) setMonitoringLevel(teenAccount.id, level);
								}}
								className="pd-card p-5 text-left transition-all relative"
								style={{
									borderColor: isActive ? info.color : "var(--pd-border)",
									borderWidth: isActive ? "2px" : "1px",
								}}
							>
								{isActive && (
									<div
										className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
										style={{ background: info.color }}
									>
										<Check size={14} className="text-white" />
									</div>
								)}
								<div className="flex items-start gap-3">
									<div
										className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold shrink-0"
										style={{
											backgroundColor: `${info.color.replace(")", " / 0.15)")}`,
											color: info.color,
										}}
									>
										{LEVEL_ICONS[level]}
									</div>
									<div>
										<h4 className="font-semibold" style={{ color: "var(--pd-text)" }}>
											{info.name}
										</h4>
										<p className="text-sm mt-0.5" style={{ color: "var(--pd-text-muted)" }}>
											{info.description}
										</p>
										<ul className="mt-3 space-y-1.5">
											{info.features.map((feature, idx) => (
												<li
													key={idx}
													className="text-xs flex items-start gap-1.5"
													style={{ color: "var(--pd-text-secondary)" }}
												>
													<Check size={12} className="mt-0.5 shrink-0" style={{ color: info.color }} />
													<span>{feature}</span>
												</li>
											))}
										</ul>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</div>

			{/* Teen preview toggle */}
			<div className="pd-card p-5">
				<button
					type="button"
					onClick={() => setShowPreview(!showPreview)}
					className="flex items-center gap-3 w-full text-left"
				>
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
						style={{ background: "var(--pd-primary-light)" }}
					>
						{showPreview ? (
							<EyeOff size={20} style={{ color: "var(--pd-primary)" }} />
						) : (
							<Eye size={20} style={{ color: "var(--pd-primary)" }} />
						)}
					</div>
					<div>
						<h3 className="font-semibold text-sm" style={{ color: "var(--pd-text)" }}>
							{showPreview ? "Hide" : "Show"} What {teenAccount.user.displayName} Sees
						</h3>
						<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
							Preview the monitoring notification in your teen&apos;s settings
						</p>
					</div>
				</button>

				{showPreview && (
					<div
						className="mt-4 p-4 rounded-lg border"
						style={{
							background: "var(--pd-bg-secondary)",
							borderColor: "var(--pd-border)",
						}}
					>
						<div className="flex items-center gap-2 mb-3">
							<Info size={16} style={{ color: "var(--pd-primary)" }} />
							<span className="text-sm font-medium" style={{ color: "var(--pd-text)" }}>
								Teen&apos;s Settings View
							</span>
						</div>
						<div
							className="p-3 rounded-lg border"
							style={{
								backgroundColor: `${currentLevelInfo.color.replace(")", " / 0.08)")}`,
								borderColor: `${currentLevelInfo.color.replace(")", " / 0.2)")}`,
							}}
						>
							<p className="text-sm font-medium" style={{ color: currentLevelInfo.color }}>
								{currentLevelInfo.name} Monitoring Active
							</p>
							<p className="text-xs mt-1" style={{ color: "var(--pd-text-secondary)" }}>
								Your parent can see:
							</p>
							<ul className="mt-1 space-y-0.5">
								{currentLevelInfo.features.map((f, i) => (
									<li key={i} className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
										- {f}
									</li>
								))}
							</ul>
						</div>
					</div>
				)}
			</div>

			{/* Comparison table toggle */}
			<div className="pd-card p-5">
				<button
					type="button"
					onClick={() => setShowComparison(!showComparison)}
					className="flex items-center gap-3 w-full text-left"
				>
					<div
						className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
						style={{ background: "var(--pd-bg-secondary)" }}
					>
						<Info size={20} style={{ color: "var(--pd-text-secondary)" }} />
					</div>
					<div>
						<h3 className="font-semibold text-sm" style={{ color: "var(--pd-text)" }}>
							{showComparison ? "Hide" : "Show"} Level Comparison
						</h3>
						<p className="text-xs" style={{ color: "var(--pd-text-muted)" }}>
							Compare features across all monitoring levels
						</p>
					</div>
				</button>

				{showComparison && (
					<div className="mt-4 overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr style={{ borderBottom: "1px solid var(--pd-border)" }}>
									<th className="text-left py-2 pr-4 font-medium" style={{ color: "var(--pd-text)" }}>
										Feature
									</th>
									{([1, 2, 3, 4] as MonitoringLevel[]).map((level) => (
										<th
											key={level}
											className="text-center py-2 px-3 font-medium"
											style={{ color: MONITORING_LEVELS[level].color }}
										>
											{MONITORING_LEVELS[level].name}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{FEATURE_MATRIX.map((row) => (
									<tr key={row.feature} style={{ borderBottom: "1px solid var(--pd-border)" }}>
										<td className="py-2 pr-4 text-xs" style={{ color: "var(--pd-text-secondary)" }}>
											{row.feature}
										</td>
										{row.levels.map((enabled, idx) => (
											<td key={idx} className="text-center py-2 px-3">
												{enabled ? (
													<Check size={16} style={{ color: "var(--pd-success)" }} className="mx-auto" />
												) : (
													<span style={{ color: "var(--pd-text-muted)" }}>-</span>
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Privacy notice */}
			<div
				className="text-center text-sm p-4 rounded-lg"
				style={{ background: "var(--pd-warning-light)", color: "var(--pd-warning)" }}
			>
				Monitoring level changes are immediately logged and visible to your teen.
			</div>
		</div>
	);
}
