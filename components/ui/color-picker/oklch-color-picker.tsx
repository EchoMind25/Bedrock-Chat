"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { getContrastRatio } from "@/lib/themes/theme-validator";

interface OklchColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	className?: string;
}

const PRESET_COLORS = [
	{ label: "Purple", value: "oklch(0.65 0.25 265)" },
	{ label: "Blue", value: "oklch(0.65 0.25 240)" },
	{ label: "Cyan", value: "oklch(0.70 0.18 195)" },
	{ label: "Green", value: "oklch(0.65 0.20 155)" },
	{ label: "Yellow", value: "oklch(0.80 0.18 90)" },
	{ label: "Orange", value: "oklch(0.70 0.20 55)" },
	{ label: "Pink", value: "oklch(0.65 0.25 340)" },
	{ label: "Red", value: "oklch(0.60 0.25 25)" },
];

function parseOklchValues(oklch: string): { l: number; c: number; h: number } {
	const match = oklch.match(
		/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
	);
	if (!match) return { l: 0.65, c: 0.25, h: 265 };
	return {
		l: parseFloat(match[1]),
		c: parseFloat(match[2]),
		h: parseFloat(match[3]),
	};
}

function toOklch(l: number, c: number, h: number): string {
	return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${Math.round(h)})`;
}

export function OklchColorPicker({ value, onChange, className }: OklchColorPickerProps) {
	const parsed = parseOklchValues(value);
	const [hue, setHue] = useState(parsed.h);
	const [lightness, setLightness] = useState(parsed.l);
	const [chroma, setChroma] = useState(parsed.c);
	const [hexInput, setHexInput] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDraggingPlane = useRef(false);

	const currentColor = toOklch(lightness, chroma, hue);

	// Contrast against dark and light backgrounds
	const darkContrast = getContrastRatio(currentColor, "oklch(0.15 0.02 285)");
	const lightContrast = getContrastRatio(currentColor, "oklch(0.98 0.01 285)");

	const debouncedOnChange = useCallback(
		(color: string) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => onChange(color), 150);
		},
		[onChange],
	);

	// Sync external value changes
	useEffect(() => {
		const p = parseOklchValues(value);
		setHue(p.h);
		setLightness(p.l);
		setChroma(p.c);
	}, [value]);

	// Draw lightness/chroma plane
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;

		for (let x = 0; x < w; x++) {
			for (let y = 0; y < h; y++) {
				const c = (x / w) * 0.35;
				const l = 1 - y / h;
				ctx.fillStyle = `oklch(${l} ${c} ${hue})`;
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}, [hue]);

	const handlePlaneInteraction = useCallback(
		(e: React.MouseEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
			const newChroma = x * 0.35;
			const newLightness = 1 - y;
			setChroma(Math.round(newChroma * 100) / 100);
			setLightness(Math.round(newLightness * 100) / 100);
			debouncedOnChange(toOklch(newLightness, newChroma, hue));
		},
		[hue, debouncedOnChange],
	);

	const handleHueChange = (newHue: number) => {
		setHue(newHue);
		debouncedOnChange(toOklch(lightness, chroma, newHue));
	};

	const handlePresetClick = (preset: string) => {
		const p = parseOklchValues(preset);
		setHue(p.h);
		setLightness(p.l);
		setChroma(p.c);
		onChange(preset);
	};

	return (
		<div className={cn("space-y-4", className)}>
			{/* Lightness/Chroma plane */}
			<div className="relative">
				<canvas
					ref={canvasRef}
					width={200}
					height={150}
					className="w-full h-[150px] rounded-lg cursor-crosshair border border-white/10"
					onMouseDown={(e) => {
						isDraggingPlane.current = true;
						handlePlaneInteraction(e);
					}}
					onMouseMove={(e) => {
						if (isDraggingPlane.current) handlePlaneInteraction(e);
					}}
					onMouseUp={() => { isDraggingPlane.current = false; }}
					onMouseLeave={() => { isDraggingPlane.current = false; }}
				/>
				{/* Marker */}
				<div
					className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
					style={{
						left: `${(chroma / 0.35) * 100}%`,
						top: `${(1 - lightness) * 100}%`,
						backgroundColor: currentColor,
					}}
				/>
			</div>

			{/* Hue slider */}
			<div className="space-y-1.5">
				<label className="text-xs text-slate-400 font-medium">Hue</label>
				<input
					type="range"
					min={0}
					max={360}
					value={hue}
					onChange={(e) => handleHueChange(Number(e.target.value))}
					className="w-full h-3 rounded-full appearance-none cursor-pointer"
					style={{
						background: `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) =>
							`oklch(0.65 0.25 ${i * 30})`,
						).join(", ")})`,
					}}
				/>
			</div>

			{/* Preset swatches */}
			<div className="space-y-1.5">
				<label className="text-xs text-slate-400 font-medium">Presets</label>
				<div className="flex gap-2 flex-wrap">
					{PRESET_COLORS.map((preset) => (
						<button
							key={preset.label}
							type="button"
							onClick={() => handlePresetClick(preset.value)}
							className={cn(
								"w-8 h-8 rounded-full border-2 transition-all",
								value === preset.value
									? "border-white scale-110 shadow-lg"
									: "border-transparent hover:border-white/40 hover:scale-105",
							)}
							style={{ backgroundColor: preset.value }}
							title={preset.label}
						/>
					))}
				</div>
			</div>

			{/* Current color preview + contrast */}
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-lg border border-white/10 shrink-0"
					style={{ backgroundColor: currentColor }}
				/>
				<div className="flex-1 min-w-0">
					<input
						type="text"
						value={hexInput || currentColor}
						onChange={(e) => {
							setHexInput(e.target.value);
							const p = parseOklchValues(e.target.value);
							if (e.target.value.startsWith("oklch(")) {
								setHue(p.h);
								setLightness(p.l);
								setChroma(p.c);
								debouncedOnChange(e.target.value);
							}
						}}
						onBlur={() => setHexInput("")}
						placeholder="oklch(0.65 0.25 265)"
						className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-blue-500/50"
					/>
				</div>
			</div>

			{/* WCAG contrast badges */}
			<div className="flex gap-2 text-[10px] font-medium">
				<span
					className={cn(
						"px-2 py-0.5 rounded-full",
						darkContrast >= 4.5
							? "bg-green-500/20 text-green-300"
							: darkContrast >= 3
								? "bg-yellow-500/20 text-yellow-300"
								: "bg-red-500/20 text-red-300",
					)}
				>
					Dark: {darkContrast.toFixed(1)}:1
				</span>
				<span
					className={cn(
						"px-2 py-0.5 rounded-full",
						lightContrast >= 4.5
							? "bg-green-500/20 text-green-300"
							: lightContrast >= 3
								? "bg-yellow-500/20 text-yellow-300"
								: "bg-red-500/20 text-red-300",
					)}
				>
					Light: {lightContrast.toFixed(1)}:1
				</span>
			</div>
		</div>
	);
}
