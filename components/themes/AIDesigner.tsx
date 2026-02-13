"use client";

import { Glass } from "@/components/ui/glass/glass";

/**
 * AI-assisted theme designer placeholder.
 * Displays a "Coming Soon" state with a preview of the feature.
 * Will integrate with Claude Opus API when available.
 *
 * Cost model (not yet active): 200 points per generation.
 */
export function AIDesigner() {
	return (
		<Glass variant="light" border="none" className="p-6 relative overflow-hidden">
			{/* Coming Soon badge */}
			<div className="absolute top-3 right-3">
				<span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
					Coming Soon
				</span>
			</div>

			{/* Content */}
			<div className="flex items-start gap-4">
				{/* Icon */}
				<div
					className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
					style={{
						background:
							"linear-gradient(135deg, oklch(0.55 0.25 265 / 0.2), oklch(0.5 0.2 310 / 0.2))",
					}}
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="oklch(0.65 0.2 285)"
						strokeWidth="1.5"
					>
						<path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
					</svg>
				</div>

				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-semibold text-blue-300">
						AI Theme Designer
					</h3>
					<p className="text-xs text-blue-300/50 mt-1 leading-relaxed">
						Describe your ideal server environment and our AI will
						design a custom theme for you. Powered by Claude Opus.
					</p>

					{/* Preview of what the UI will look like */}
					<div className="mt-4 space-y-3 opacity-50 pointer-events-none">
						{/* Prompt input */}
						<div className="relative">
							<textarea
								className="w-full h-16 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-blue-300/40 resize-none"
								placeholder='e.g. "A cozy cyberpunk cafe with warm neon lights and rain outside..."'
								disabled
								readOnly
							/>
						</div>

						{/* Style selector */}
						<div className="flex gap-2">
							{["Neon", "Industrial", "Organic", "Abstract"].map(
								(style) => (
									<span
										key={style}
										className="text-[10px] px-2 py-1 rounded-md bg-white/5 text-blue-300/30 border border-white/5"
									>
										{style}
									</span>
								),
							)}
						</div>

						{/* Generate button */}
						<button
							className="w-full py-2 rounded-lg bg-blue-500/10 text-blue-400/40 text-xs font-medium border border-blue-500/10"
							disabled
						>
							Generate Theme (200 pts)
						</button>
					</div>

					{/* API structure info */}
					<div className="mt-4 p-3 rounded-lg bg-white/3 border border-white/5">
						<p className="text-[10px] text-blue-300/30 leading-relaxed">
							The AI Designer will generate a complete server
							theme including colors, effects, and layout. You'll
							get 3 alternatives and can regenerate up to 3 times
							per purchase.
						</p>
					</div>
				</div>
			</div>
		</Glass>
	);
}
