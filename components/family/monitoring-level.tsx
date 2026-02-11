import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";
import { motion } from "motion/react";

interface MonitoringLevelDisplayProps {
	/**
	 * Current monitoring level
	 */
	level: MonitoringLevel;

	/**
	 * Show full details
	 */
	showDetails?: boolean;

	/**
	 * Compact mode
	 */
	compact?: boolean;
}

/**
 * Display monitoring level with icon and details
 */
export function MonitoringLevelDisplay({
	level,
	showDetails = false,
	compact = false,
}: MonitoringLevelDisplayProps) {
	const levelInfo = MONITORING_LEVELS[level];

	const icon = {
		1: "🟢",
		2: "🟡",
		3: "🟠",
		4: "🔴",
	}[level];

	if (compact) {
		return (
			<div className="flex items-center gap-2">
				<span className="text-lg">{icon}</span>
				<span
					className="text-sm font-medium"
					style={{ color: levelInfo.color }}
				>
					{levelInfo.name}
				</span>
			</div>
		);
	}

	return (
		<motion.div
			className="p-4 rounded-lg border"
			style={{
				backgroundColor: `${levelInfo.color.replace(")", " / 0.1)")}`,
				borderColor: `${levelInfo.color.replace(")", " / 0.3)")}`,
			}}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
		>
			<div className="flex items-start gap-4">
				<div
					className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
					style={{
						backgroundColor: `${levelInfo.color.replace(")", " / 0.2)")}`,
						color: levelInfo.color,
					}}
				>
					{icon}
				</div>
				<div className="flex-1">
					<h3 className="text-lg font-bold text-white">{levelInfo.name}</h3>
					<p className="text-sm text-white/70 mt-1">{levelInfo.description}</p>

					{showDetails && (
						<ul className="mt-3 space-y-2">
							{levelInfo.features.map((feature, idx) => (
								<li
									key={idx}
									className="text-sm text-white/60 flex items-start gap-2"
								>
									<span className="text-primary">✓</span>
									<span>{feature}</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</motion.div>
	);
}
