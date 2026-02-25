/**
 * Reusable color picker component for Obsidian plugins.
 *
 * Supports: #RRGGBB, #RRGGBBAA, rgb(r,g,b), rgba(r,g,b,a)
 * Provides: visual swatch preview, native color picker, text input.
 *
 * This module is self-contained and can be copied to other plugins.
 */

import { parseColor, rgbaToHex, isHexColor } from "./utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColorPickerOptions {
	/** Parent element to render into. */
	container: HTMLElement;
	/** Label text shown above the picker. */
	label: string;
	/** Current color value (hex, rgb, rgba, or empty string). */
	value: string;
	/** Called when the user changes the color. */
	onChange: (value: string) => void;
	/** Placeholder text for the text input. */
	placeholder?: string;
	/** Optional CSS class prefix (default: "ch"). */
	cssPrefix?: string;
}

export interface ColorPickerControls {
	/** Update the picker's displayed value externally. */
	setValue: (value: string) => void;
	/** Get the current value. */
	getValue: () => string;
	/** The root container element. */
	el: HTMLElement;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Render a color picker into the given container.
 *
 * Layout:
 *   [Label]
 *   [Swatch] [Native Picker (hidden)] [Text Input: #hex / rgb / rgba]
 *
 * The swatch shows the current color and opens the native picker on click.
 * The text input accepts any supported format and validates on change.
 */
export function renderColorPicker(options: ColorPickerOptions): ColorPickerControls {
	const {
		container,
		label,
		value,
		onChange,
		placeholder,
		cssPrefix = "ch",
	} = options;

	let currentValue = value;

	const section = container.createDiv(`${cssPrefix}-color-picker`);
	section.createEl("label", { text: label, cls: `${cssPrefix}-color-picker-label` });

	const row = section.createDiv(`${cssPrefix}-color-picker-row`);

	// Swatch + native input wrapper -- the swatch is a <label> so clicking
	// it reliably opens the native color picker on all platforms.
	const swatchWrapper = row.createDiv(`${cssPrefix}-color-swatch-wrapper`);

	const nativeInput = swatchWrapper.createEl("input", {
		type: "color",
		cls: `${cssPrefix}-color-native-input`,
	}) as HTMLInputElement;
	const inputId = `ch-color-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
	nativeInput.id = inputId;
	const parsed = parseColor(currentValue);
	nativeInput.value = parsed ? rgbaToHex(parsed.r, parsed.g, parsed.b) : "#6c757d";

	const swatch = swatchWrapper.createEl("label", {
		cls: `${cssPrefix}-color-swatch`,
		attr: {
			"for": inputId,
			"role": "button",
			"tabindex": "0",
			"aria-label": `Pick ${label.toLowerCase()}`,
		},
	});
	applySwatch(swatch, currentValue);

	// Text input
	const textInput = row.createEl("input", {
		type: "text",
		cls: `${cssPrefix}-color-text-input`,
		placeholder: placeholder ?? "#RRGGBB, #RRGGBBAA, rgb(), rgba()",
		value: currentValue || "",
	}) as HTMLInputElement;

	nativeInput.addEventListener("input", () => {
		currentValue = nativeInput.value;
		textInput.value = currentValue;
		applySwatch(swatch, currentValue);
		onChange(currentValue);
	});

	textInput.addEventListener("input", () => {
		const val = textInput.value.trim();
		// Live-update swatch as user types (if valid)
		if (parseColor(val)) {
			applySwatch(swatch, val);
			// Sync native picker if it's a plain hex
			if (isHexColor(val)) {
				nativeInput.value = val;
			}
		} else if (val === "") {
			applySwatch(swatch, "");
		}
	});

	textInput.addEventListener("change", () => {
		const val = textInput.value.trim();
		currentValue = val;
		applySwatch(swatch, val);
		if (isHexColor(val)) {
			nativeInput.value = val;
		}
		onChange(val);
	});

	// Clear button
	const clearBtn = row.createEl("button", {
		cls: `${cssPrefix}-color-clear-btn`,
		attr: { type: "button", "aria-label": "Clear color" },
	});
	clearBtn.innerHTML = "&#x2715;"; // x mark
	clearBtn.addEventListener("click", () => {
		currentValue = "";
		textInput.value = "";
		nativeInput.value = "#6c757d";
		applySwatch(swatch, "");
		onChange("");
	});

	return {
		setValue(val: string) {
			currentValue = val;
			textInput.value = val;
			applySwatch(swatch, val);
			const p = parseColor(val);
			if (p) nativeInput.value = rgbaToHex(p.r, p.g, p.b);
		},
		getValue() {
			return currentValue;
		},
		el: section,
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applySwatch(el: HTMLElement, value: string): void {
	const trimmed = (value || "").trim();
	if (!trimmed) {
		el.style.backgroundColor = "transparent";
		el.classList.add("ch-color-swatch-empty");
		return;
	}
	el.classList.remove("ch-color-swatch-empty");
	el.style.backgroundColor = trimmed;
}
