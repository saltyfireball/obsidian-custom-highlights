/**
 * Generates dynamic CSS for highlight mark styles based on user settings.
 */

import { normalizeFontSize, hexToRgb, getColorAlpha } from "./utils";
import type { HighlightStyle, HighlightPalette } from "./main";

export function generateHighlightCSS(
	palettes: HighlightPalette[],
	styles: HighlightStyle[],
): string {
	const enabledStyles = styles.filter((s) => s.enabled);
	const lines = ["/* Custom Highlights - Dynamic Styles */"];

	for (const palette of palettes) {
		if (palette.enabled === false) continue;

		const rgb = hexToRgb(palette.color || "");
		if (!rgb) continue;

		// Use the alpha from the user's color (e.g., #00000000 = 0, #ff618880 = 0.5)
		const userAlpha = getColorAlpha(palette.color || "");
		// Scale the template opacities by the user's alpha
		const a = (templateOpacity: number): string =>
			(templateOpacity * userAlpha).toFixed(3).replace(/\.?0+$/, "");

		const textColor = palette.textColor?.trim() || "var(--text-normal)";
		const underlineColor =
			palette.underlineColor?.trim() || "var(--text-on-accent)";
		const underlineRgb = hexToRgb(palette.underlineColor || "");
		const underlineAlpha = getColorAlpha(palette.underlineColor || "");
		const fontSize = normalizeFontSize(palette.fontSize);
		const fontWeight = palette.fontWeight?.trim() || "";
		const fontSizeRule = fontSize ? `  font-size: ${fontSize} !important;` : "";
		const fontWeightRule = fontWeight
			? `  font-weight: ${fontWeight} !important;`
			: "  font-weight: var(--hltr-font-weight) !important;";
		const baseClass = `.hltr-m-${palette.id}`;

		// If the palette has an underline color, add underline rules to all styles
		const resolvedUnderlineColor = underlineRgb
			? `rgba(${underlineRgb}, ${underlineAlpha})`
			: underlineColor;
		const hasUnderline = Boolean(palette.underlineColor?.trim());
		const underlineRules = hasUnderline
			? `  text-decoration: underline !important;\n  text-decoration-color: ${resolvedUnderlineColor} !important;\n  text-decoration-thickness: 2px !important;\n  text-underline-offset: 3px !important;\n  text-decoration-skip-ink: var(--hltr-text-decoration-skip-ink) !important;`
			: "";

		const addFontRules = () =>
			[
				fontWeightRule,
				"  box-decoration-break: clone !important;",
				"  -webkit-box-decoration-break: clone !important;",
				`  color: ${textColor} !important;`,
				fontSizeRule,
				underlineRules,
			]
				.filter(Boolean)
				.join("\n");

		const templates: Record<string, string> = {
			base: `\n${baseClass} {\n  background: linear-gradient(\n    to bottom,\n    rgba(${rgb}, ${a(0.4)}) 0%,\n    rgba(${rgb}, ${a(0.7)}) 50%,\n    rgba(${rgb}, ${a(0.4)}) 100%\n  ) !important;\n  padding: 2px 6px !important;\n  margin: 0 -2px !important;\n  border-radius: 3px 8px 5px 7px !important;\n${addFontRules()}\n}`,
			skewed: `\n${baseClass}-skewed {\n  background-color: rgba(${rgb}, ${a(0.65)}) !important;\n  padding: 2px 6px !important;\n  margin: 0 -2px !important;\n  border-radius: 3px !important;\n  transform: skewX(-5deg) !important;\n  display: inline-block !important;\n${addFontRules()}\n}`,
			"soft-glow": `\n${baseClass}-soft-glow {\n  background-color: rgba(${rgb}, ${a(0.55)}) !important;\n  box-shadow: 0 0 8px rgba(${rgb}, ${a(0.4)}) !important;\n  padding: 2px 6px !important;\n  border-radius: 4px !important;\n${addFontRules()}\n}`,
			"bottom-heavy": `\n${baseClass}-bottom-heavy {\n  background: linear-gradient(\n    to bottom,\n    rgba(${rgb}, ${a(0.3)}) 0%,\n    rgba(${rgb}, ${a(0.7)}) 100%\n  ) !important;\n  padding: 4px 6px 2px 6px !important;\n  margin: 0 -2px !important;\n  border-radius: 2px 6px 4px 8px !important;\n${addFontRules()}\n}`,
			"marker-stroke": `\n${baseClass}-marker-stroke {\n  background: linear-gradient(\n    to bottom,\n    transparent 0%,\n    transparent 30%,\n    rgba(${rgb}, ${a(0.7)}) 30%,\n    rgba(${rgb}, ${a(0.7)}) 100%\n  ) !important;\n  padding: 2px 5px !important;\n  margin: 0 -2px !important;\n  border-radius: 2px !important;\n${addFontRules()}\n}`,
			full: `\n${baseClass}-full {\n  background: linear-gradient(\n    to bottom,\n    rgba(${rgb}, ${a(0.35)}) 0%,\n    rgba(${rgb}, ${a(0.7)}) 50%,\n    rgba(${rgb}, ${a(0.5)}) 100%\n  ) !important;\n  padding: 3px 7px 2px 7px !important;\n  margin: 0 -3px !important;\n  border-radius: 3px 8px 5px 7px !important;\n  box-shadow: 0 1px 3px rgba(${rgb}, ${a(0.25)}) !important;\n  transform: skewX(-2deg) !important;\n  display: inline-block !important;\n${addFontRules()}\n}`,
			underline: `\n${baseClass}-ul {\n  background-color: rgba(${rgb}, ${a(0.65)}) !important;\n  text-decoration: underline !important;\n  text-decoration-color: ${resolvedUnderlineColor} !important;\n  text-decoration-thickness: 2px !important;\n  text-underline-offset: 3px !important;\n  text-decoration-skip-ink: var(--hltr-text-decoration-skip-ink) !important;\n  padding: 2px 4px !important;\n  border-radius: 3px !important;\n${addFontRules()}\n}`,
		};

		for (const style of enabledStyles) {
			const template = templates[style.id];
			if (typeof template === "string") {
				lines.push(template);
			}
		}
	}

	return lines.join("\n");
}
