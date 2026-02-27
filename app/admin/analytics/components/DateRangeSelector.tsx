"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type Range = "7d" | "30d" | "90d";

const OPTIONS: { value: Range; label: string }[] = [
	{ value: "7d", label: "7 days" },
	{ value: "30d", label: "30 days" },
	{ value: "90d", label: "90 days" },
];

interface DateRangeSelectorProps {
	className?: string;
}

export function DateRangeSelector({ className }: DateRangeSelectorProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentRange = (searchParams.get("range") as Range) ?? "30d";
	const currentTab = searchParams.get("tab") ?? "navigation";

	const setRange = (range: Range) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("range", range);
		params.set("tab", currentTab);
		router.push(`?${params.toString()}`);
	};

	return (
		<div className={cn("flex items-center gap-1 bg-slate-800/50 rounded-lg p-1", className)}>
			{OPTIONS.map((opt) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => setRange(opt.value)}
					className={cn(
						"px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
						currentRange === opt.value
							? "bg-slate-700 text-white"
							: "text-slate-400 hover:text-slate-200",
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}

export function useDateRange(): { startDate: Date; endDate: Date; range: Range } {
	const searchParams = useSearchParams();
	const range = (searchParams.get("range") as Range) ?? "30d";
	const endDate = new Date();
	const startDate = new Date();

	switch (range) {
		case "7d":
			startDate.setDate(startDate.getDate() - 7);
			break;
		case "90d":
			startDate.setDate(startDate.getDate() - 90);
			break;
		default:
			startDate.setDate(startDate.getDate() - 30);
	}

	return { startDate, endDate, range };
}
