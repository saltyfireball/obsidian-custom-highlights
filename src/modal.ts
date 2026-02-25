/**
 * Modal for picking and applying highlight palettes + styles to selected text.
 */

import { Modal, Notice } from "obsidian";
import type { HighlightStyle, HighlightPalette, CustomHighlightsSettings } from "./main";

export interface HighlightSelection {
	paletteId?: string;
	styleId?: string;
}

export interface HighlightPickerPlugin {
	settings: CustomHighlightsSettings;
	saveSettings(): Promise<void>;
}

export class HighlightPickerModal extends Modal {
	private plugin: HighlightPickerPlugin;
	private editor: any;
	private initialSelection: HighlightSelection | null;

	constructor(
		app: any,
		plugin: HighlightPickerPlugin,
		editor: any,
		initialSelection: HighlightSelection | null = null,
	) {
		super(app);
		this.plugin = plugin;
		this.editor = editor;
		this.initialSelection = initialSelection;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ch-highlight-picker-modal");

		contentEl.createEl("h2", { text: "Apply Highlight" });

		const selectionText = (this.editor?.getSelection?.() || "").trim();

		const palettes = (this.plugin.settings.palettes || []).filter(
			(p) => p.enabled !== false,
		);
		const styles = (this.plugin.settings.styles || []).filter(
			(s) => s.enabled,
		);

		if (palettes.length === 0 || styles.length === 0) {
			contentEl.createEl("p", {
				text: "Enable at least one palette and one style in the Custom Highlights settings.",
				cls: "ch-empty-message",
			});
			return;
		}

		// --- Palette selection ---
		const paletteRow = contentEl.createDiv("ch-picker-row");
		paletteRow.createEl("label", { text: "Palette" });
		const paletteGrid = paletteRow.createDiv("ch-palette-grid");
		paletteGrid.setAttr("role", "radiogroup");
		paletteGrid.setAttr("aria-label", "Highlight palette options");

		const paletteIdFallbacks = palettes.map((p, i) => p.id ?? `palette-${i}`);
		const fallbackPaletteId = paletteIdFallbacks[0] ?? "";
		let selectedPaletteId = fallbackPaletteId;

		const preferredPaletteId =
			this.initialSelection?.paletteId || this.plugin.settings.lastUsed?.paletteId;
		if (
			preferredPaletteId &&
			palettes.some((c, i) =>
				c.id === preferredPaletteId || paletteIdFallbacks[i] === preferredPaletteId,
			)
		) {
			selectedPaletteId = preferredPaletteId;
		}

		// --- Style selection ---
		const styleRow = contentEl.createDiv("ch-picker-row");
		styleRow.createEl("label", { text: "Style" });
		const styleSelect = styleRow.createEl("select");
		styles.forEach((style) => {
			styleSelect.createEl("option", {
				text: style.label,
				value: style.id,
			});
		});
		if (this.initialSelection?.styleId) {
			styleSelect.value = this.initialSelection.styleId;
		}

		// --- Preview ---
		const preview = contentEl.createDiv("ch-picker-preview");
		preview.createEl("label", { text: "Preview" });
		const previewMark = preview.createEl("mark", {
			text: selectionText || "Select text to preview",
		});

		const paletteButtons: HTMLButtonElement[] = [];

		const updatePreview = () => {
			const styleId = styleSelect.value;
			const style = styles.find((c) => c.id === styleId);
			const suffix = style?.suffix || "";
			previewMark.className = `hltr-m-${selectedPaletteId}${suffix}`;
			if (selectionText) {
				previewMark.textContent = selectionText;
			}
		};

		const activatePalette = (paletteId: string) => {
			selectedPaletteId = paletteId;
			paletteButtons.forEach((btn) => {
				const isActive = btn.dataset.paletteId === paletteId;
				btn.toggleClass("is-active", isActive);
				btn.setAttr("aria-checked", isActive ? "true" : "false");
			});
			updatePreview();
		};

		styleSelect.addEventListener("change", updatePreview);

		palettes.forEach((palette, index) => {
			const paletteId = paletteIdFallbacks[index] ?? `palette-${index}`;
			const swatch = paletteGrid.createEl("button", {
				cls: "ch-palette-swatch",
				attr: {
					type: "button",
					role: "radio",
					"aria-checked": "false",
					"aria-label": palette.name || paletteId,
				},
			});
			swatch.dataset.paletteId = paletteId;
			swatch.style.setProperty("--ch-palette-color", palette.color || "transparent");
			swatch.style.backgroundColor = palette.color || "transparent";
			swatch.addEventListener("click", () => activatePalette(paletteId));
			swatch.addEventListener("keydown", (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					activatePalette(paletteId);
					return;
				}
				if (event.key === "ArrowRight" || event.key === "ArrowDown") {
					event.preventDefault();
					const nextIndex = (index + 1) % paletteButtons.length;
					paletteButtons[nextIndex]?.focus();
					const nextId = paletteButtons[nextIndex]?.dataset.paletteId;
					if (nextId) activatePalette(nextId);
				}
				if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
					event.preventDefault();
					const prevIndex = (index - 1 + paletteButtons.length) % paletteButtons.length;
					paletteButtons[prevIndex]?.focus();
					const prevId = paletteButtons[prevIndex]?.dataset.paletteId;
					if (prevId) activatePalette(prevId);
				}
			});
			paletteButtons.push(swatch);
		});

		if (paletteButtons.length > 0 && selectedPaletteId) {
			activatePalette(selectedPaletteId);
		}

		// --- Actions ---
		const actions = contentEl.createDiv("ch-modal-actions");
		actions.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());

		const applyBtn = actions.createEl("button", {
			text: "Apply",
			cls: "mod-cta",
		});

		applyBtn.addEventListener("click", () => {
			const selection = this.editor.getSelection();
			if (!selection) {
				new Notice("Select some text to highlight");
				return;
			}

			const paletteId = selectedPaletteId;
			const styleId = styleSelect.value;
			const style = styles.find((c) => c.id === styleId);
			const suffix = style?.suffix || "";
			const className = `hltr-m-${paletteId}${suffix}`;
			this.editor.replaceSelection(`<mark class="${className}">${selection}</mark>`);
			this.plugin.settings.lastUsed = { paletteId, styleId };
			void this.plugin.saveSettings();
			this.close();
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
