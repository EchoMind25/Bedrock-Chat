"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

export interface Tab {
	id: string;
	label: string;
	count?: number;
	icon?: ReactNode;
}

interface TabsProps {
	tabs: Tab[];
	activeTab: string;
	onTabChange: (tabId: string) => void;
	variant?: "default" | "pills";
	className?: string;
}

export function Tabs({
	tabs,
	activeTab,
	onTabChange,
	variant = "default",
	className,
}: TabsProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-2",
				variant === "default" && "border-b border-white/10 px-4",
				variant === "pills" && "p-2",
				className
			)}
			role="tablist"
		>
			{tabs.map((tab) => {
				const isActive = activeTab === tab.id;

				return (
					<motion.button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={isActive}
						aria-controls={`tab-panel-${tab.id}`}
						onClick={() => onTabChange(tab.id)}
						className={cn(
							"px-4 py-2 text-sm font-medium relative transition-colors",
							variant === "default" &&
								(isActive
									? "text-white"
									: "text-white/60 hover:text-white/80"),
							variant === "pills" &&
								(isActive
									? "text-white bg-white/10 rounded-lg"
									: "text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg")
						)}
						whileHover={{ y: variant === "default" ? -2 : 0 }}
						whileTap={{ scale: 0.95 }}
					>
						<span className="flex items-center gap-2">
							{tab.icon && <span>{tab.icon}</span>}
							{tab.label}
							{tab.count !== undefined && tab.count > 0 && (
								<span
									className={cn(
										"ml-1 px-1.5 py-0.5 text-xs rounded-full",
										isActive
											? "bg-primary text-white"
											: "bg-white/10 text-white/60"
									)}
								>
									{tab.count}
								</span>
							)}
						</span>

						{/* Active Indicator (for default variant) */}
						{variant === "default" && isActive && (
							<motion.div
								layoutId="tab-indicator"
								className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
								transition={{
									type: "spring",
									stiffness: 260,
									damping: 20,
								}}
							/>
						)}
					</motion.button>
				);
			})}
		</div>
	);
}
