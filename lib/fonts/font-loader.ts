/**
 * Font loader — privacy-first.
 *
 * All Google Fonts (Inter, JetBrains Mono, Merriweather) are self-hosted
 * via next/font in app/layout.tsx. They are downloaded at BUILD time —
 * ZERO runtime requests to fonts.googleapis.com.
 *
 * This module only handles OpenDyslexic (loaded from cdnfonts on demand)
 * and marks other fonts as "loaded" since they're already available
 * via CSS variables (--font-inter, --font-jetbrains-mono, --font-merriweather).
 */

const EXTERNAL_FONT_URLS: Record<string, string> = {
	opendyslexic: "https://fonts.cdnfonts.com/css/opendyslexic",
};

// Fonts that are self-hosted via next/font (always available)
const SELF_HOSTED_FONTS = new Set(["inter", "jetbrains-mono", "merriweather"]);

const loadedFonts = new Set<string>();

export function loadFont(fontFamily: string): void {
	if (
		fontFamily === "system" ||
		fontFamily === "sf-pro" ||
		loadedFonts.has(fontFamily)
	) {
		return;
	}

	// Self-hosted fonts are always available via next/font CSS variables
	if (SELF_HOSTED_FONTS.has(fontFamily)) {
		loadedFonts.add(fontFamily);
		return;
	}

	// External fonts (OpenDyslexic) loaded on demand
	const url = EXTERNAL_FONT_URLS[fontFamily];
	if (!url) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = url;
	link.crossOrigin = "anonymous";
	document.head.appendChild(link);
	loadedFonts.add(fontFamily);
}
