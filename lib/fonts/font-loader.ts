const FONT_URLS: Record<string, string> = {
	inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
	merriweather:
		"https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
	"jetbrains-mono":
		"https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
	opendyslexic:
		"https://fonts.cdnfonts.com/css/opendyslexic",
};

const loadedFonts = new Set<string>();

export function loadFont(fontFamily: string): void {
	if (
		fontFamily === "system" ||
		fontFamily === "sf-pro" ||
		loadedFonts.has(fontFamily)
	) {
		return;
	}

	const url = FONT_URLS[fontFamily];
	if (!url) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = url;
	link.crossOrigin = "anonymous";
	document.head.appendChild(link);
	loadedFonts.add(fontFamily);
}
