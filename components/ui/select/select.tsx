"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

interface SelectOption<T extends string> {
	value: T;
	label: string;
	description?: string;
}

interface SelectProps<T extends string> {
	options: SelectOption<T>[];
	value: T;
	onChange: (value: T) => void;
	label?: string;
	placeholder?: string;
	className?: string;
}

export function Select<T extends string>({
	options,
	value,
	onChange,
	label,
	placeholder,
	className,
}: SelectProps<T>) {
	return (
		<div className={cn("space-y-1.5", className)}>
			{label && (
				<label className="text-sm text-slate-300 font-medium">{label}</label>
			)}
			<div className="relative">
				<select
					value={value}
					onChange={(e) => onChange(e.target.value as T)}
					className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-sm text-slate-200 cursor-pointer transition-colors hover:bg-white/8 focus:outline-hidden focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
				>
					{placeholder && (
						<option value="" disabled>
							{placeholder}
						</option>
					)}
					{options.map((option) => (
						<option
							key={option.value}
							value={option.value}
							className="bg-[oklch(0.14_0.02_250)]"
						>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
			</div>
		</div>
	);
}

export type { SelectProps, SelectOption };
