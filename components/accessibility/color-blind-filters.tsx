/**
 * SVG filters for color-blind simulation.
 * Mount once in the app shell. Applied via CSS:
 *   [data-color-blind-mode="protanopia"] { filter: url('#protanopia-filter'); }
 *
 * Color matrices from established medical research on
 * color vision deficiency simulation.
 */
export function ColorBlindFilters() {
	return (
		<svg
			aria-hidden="true"
			style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
		>
			<defs>
				{/* Protanopia: reduced red sensitivity */}
				<filter id="protanopia-filter">
					<feColorMatrix
						type="matrix"
						values="0.567 0.433 0     0 0
						        0.558 0.442 0     0 0
						        0     0.242 0.758 0 0
						        0     0     0     1 0"
					/>
				</filter>

				{/* Deuteranopia: reduced green sensitivity */}
				<filter id="deuteranopia-filter">
					<feColorMatrix
						type="matrix"
						values="0.625 0.375 0   0 0
						        0.7   0.3   0   0 0
						        0     0.3   0.7 0 0
						        0     0     0   1 0"
					/>
				</filter>

				{/* Tritanopia: reduced blue sensitivity */}
				<filter id="tritanopia-filter">
					<feColorMatrix
						type="matrix"
						values="0.95  0.05  0     0 0
						        0     0.433 0.567 0 0
						        0     0.475 0.525 0 0
						        0     0     0     1 0"
					/>
				</filter>
			</defs>
		</svg>
	);
}
