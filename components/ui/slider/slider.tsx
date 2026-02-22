"use client";

import { cn } from "@/lib/utils/cn";

interface SliderProps {
	min: number;
	max: number;
	step?: number;
	value: number;
	onChange: (value: number) => void;
	label?: string;
	showValue?: boolean;
	formatValue?: (value: number) => string;
	className?: string;
}

export function Slider({
	min,
	max,
	step = 0.1,
	value,
	onChange,
	label,
	showValue = true,
	formatValue,
	className,
}: SliderProps) {
	const percentage = ((value - min) / (max - min)) * 100;
	const displayValue = formatValue ? formatValue(value) : value.toString();

	return (
		<div className={cn("space-y-1.5", className)}>
			{(label || showValue) && (
				<div className="flex items-center justify-between">
					{label && (
						<label className="text-sm text-slate-300 font-medium">{label}</label>
					)}
					{showValue && (
						<span className="text-xs text-slate-400 font-mono tabular-nums">
							{displayValue}
						</span>
					)}
				</div>
			)}
			<div className="relative">
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10"
					style={{
						background: `linear-gradient(to right, oklch(0.65 0.25 265) 0%, oklch(0.65 0.25 265) ${percentage}%, oklch(0.2 0.02 250) ${percentage}%, oklch(0.2 0.02 250) 100%)`,
					}}
				/>
			</div>
		</div>
	);
}

export type { SliderProps };
