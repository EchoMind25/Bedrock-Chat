import { Badge } from "@/components/ui/badge/badge";
import { MONITORING_LEVELS } from "@/lib/types/family";
import type { MonitoringLevel } from "@/lib/types/family";

interface TeenBadgeProps {
	/**
	 * Show parent-managed badge
	 */
	showParentManaged?: boolean;

	/**
	 * Show monitoring level
	 */
	monitoringLevel?: MonitoringLevel;

	/**
	 * Size variant
	 */
	size?: "sm" | "md" | "lg";
}

/**
 * Badge component to indicate teen account status
 * Shows "Parent-Managed Account" and/or monitoring level
 */
export function TeenBadge({
	showParentManaged = true,
	monitoringLevel,
	size = "md",
}: TeenBadgeProps) {
	const sizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	return (
		<div className="flex items-center gap-2 flex-wrap">
			{showParentManaged && (
				<Badge variant="secondary" className={sizeClasses[size]}>
					👨‍👩‍👧 Parent-Managed
				</Badge>
			)}

			{monitoringLevel && (
				<Badge
					variant="secondary"
					className={sizeClasses[size]}
					style={{
						backgroundColor: `${MONITORING_LEVELS[monitoringLevel].color.replace(")", " / 0.2)")}`,
						color: MONITORING_LEVELS[monitoringLevel].color,
						borderColor: MONITORING_LEVELS[monitoringLevel].color,
					}}
				>
					{MONITORING_LEVELS[monitoringLevel].name} Level
				</Badge>
			)}
		</div>
	);
}
