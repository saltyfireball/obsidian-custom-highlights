/**
 * Normalize a font size value -- appends "px" if the value is digits only.
 */
export function normalizeFontSize(value?: string): string {
	const trimmed = (value || "").trim();
	if (!trimmed) return "";
	return /^\d+$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

/**
 * Validate a 6-digit hex color string (e.g. "#ff6188").
 */
export function isHexColor(value?: string): boolean {
	return /^#[0-9A-Fa-f]{6}$/.test((value || "").trim());
}

/**
 * Validate a hex color with optional alpha (6 or 8 hex digits after #).
 */
export function isHexOrHexAlpha(value?: string): boolean {
	return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test((value || "").trim());
}

/**
 * Convert a color string to an "R, G, B" triplet.
 * Accepts: #RRGGBB, #RRGGBBAA, rgb(r,g,b), rgba(r,g,b,a).
 * Returns null if the input cannot be parsed.
 */
export function hexToRgb(value?: string): string | null {
	const trimmed = (value || "").trim();
	if (!trimmed) return null;

	const rgbaMatch = trimmed.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgbaMatch) {
		const r = Math.min(255, Math.max(0, parseFloat(rgbaMatch[1])));
		const g = Math.min(255, Math.max(0, parseFloat(rgbaMatch[2])));
		const b = Math.min(255, Math.max(0, parseFloat(rgbaMatch[3])));
		if ([r, g, b].some((val) => Number.isNaN(val))) return null;
		return `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
	}

	const hex = trimmed.replace(/^#/, "");
	if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	return `${r}, ${g}, ${b}`;
}

/**
 * Extract the alpha value (0-1) from a color string.
 * Returns 1 if no alpha is specified.
 */
export function getColorAlpha(value?: string): number {
	const trimmed = (value || "").trim();
	if (!trimmed) return 1;

	const rgbaMatch = trimmed.match(
		/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgbaMatch) {
		return rgbaMatch[1] !== undefined
			? Math.min(1, Math.max(0, parseFloat(rgbaMatch[1])))
			: 1;
	}

	const hex = trimmed.replace(/^#/, "");
	if (hex.length === 8) {
		return parseInt(hex.slice(6, 8), 16) / 255;
	}
	return 1;
}

/**
 * Normalize a highlight palette ID to a safe CSS class fragment.
 */
export function normalizeHighlightId(value?: string): string {
	return (value || "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-")
		.replace(/--+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Parse a color string into an RGBA object.
 * Supports: #RRGGBB, #RRGGBBAA, rgb(r,g,b), rgba(r,g,b,a).
 * Returns null if the input cannot be parsed.
 */
export function parseColor(
	value?: string,
): { r: number; g: number; b: number; a: number } | null {
	const trimmed = (value || "").trim();
	if (!trimmed) return null;

	// Try rgb/rgba
	const rgbaMatch = trimmed.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
	);
	if (rgbaMatch) {
		const r = Math.min(255, Math.max(0, Math.round(parseFloat(rgbaMatch[1]))));
		const g = Math.min(255, Math.max(0, Math.round(parseFloat(rgbaMatch[2]))));
		const b = Math.min(255, Math.max(0, Math.round(parseFloat(rgbaMatch[3]))));
		const a = rgbaMatch[4] !== undefined
			? Math.min(1, Math.max(0, parseFloat(rgbaMatch[4])))
			: 1;
		if ([r, g, b, a].some((val) => Number.isNaN(val))) return null;
		return { r, g, b, a };
	}

	// Try hex
	const hex = trimmed.replace(/^#/, "");
	if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(hex)) return null;
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
	return { r, g, b, a };
}

/**
 * Convert RGBA values to a hex string (#RRGGBB or #RRGGBBAA).
 */
export function rgbaToHex(r: number, g: number, b: number, a?: number): string {
	const hex = "#" +
		r.toString(16).padStart(2, "0") +
		g.toString(16).padStart(2, "0") +
		b.toString(16).padStart(2, "0");
	if (a !== undefined && a < 1) {
		return hex + Math.round(a * 255).toString(16).padStart(2, "0");
	}
	return hex;
}
