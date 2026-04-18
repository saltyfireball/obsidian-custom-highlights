import {
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	App,
} from "obsidian";
import { generateHighlightCSS } from "./css-generator";
import { HighlightPickerModal } from "./modal";
import { renderColorPicker } from "./color-picker";
import { normalizeHighlightId } from "./utils";

// ---------------------------------------------------------------------------
// Settings types
// ---------------------------------------------------------------------------

export interface HighlightStyle {
	id: string;
	label: string;
	suffix: string;
	enabled: boolean;
}

export interface HighlightPalette {
	id: string;
	name: string;
	color: string;
	textColor: string;
	underlineColor: string;
	fontSize: string;
	fontWeight: string;
	padding: string;
	margin: string;
	enabled: boolean;
}

export interface CustomHighlightsSettings {
	styles: HighlightStyle[];
	palettes: HighlightPalette[];
	lastUsed: { paletteId: string; styleId: string };
}

const DEFAULT_SETTINGS: CustomHighlightsSettings = {
	styles: [
		{ id: "base", label: "Classic", suffix: "", enabled: true },
		{ id: "skewed", label: "Skewed", suffix: "-skewed", enabled: true },
		{ id: "soft-glow", label: "Soft Glow", suffix: "-soft-glow", enabled: true },
		{ id: "bottom-heavy", label: "Bottom Heavy", suffix: "-bottom-heavy", enabled: true },
		{ id: "marker-stroke", label: "Marker Stroke", suffix: "-marker-stroke", enabled: true },
		{ id: "full", label: "Full", suffix: "-full", enabled: true },
		{ id: "underline", label: "Underline", suffix: "-ul", enabled: false },
	],
	palettes: [
		{ id: "pink", name: "Pink", color: "#ff6188", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
		{ id: "yellow", name: "Yellow", color: "#ffd866", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
		{ id: "orange", name: "Orange", color: "#fc9867", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
		{ id: "green", name: "Green", color: "#a9dc76", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
		{ id: "blue", name: "Blue", color: "#78dce8", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
		{ id: "purple", name: "Purple", color: "#ab9df2", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", padding: "", margin: "", enabled: true },
	],
	lastUsed: { paletteId: "pink", styleId: "base" },
};

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default class CustomHighlightsPlugin extends Plugin {
	settings!: CustomHighlightsSettings;
	private styleSheet: CSSStyleSheet | null = null;
	private toolbarButtons = new WeakMap<MarkdownView, HTMLElement>();

	async onload() {
		await this.loadSettings();

		// Inject dynamic highlight CSS
		this.styleSheet = new CSSStyleSheet();
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet];
		this.updateHighlightCSS();

		// Add highlighter toolbar button to active views
		this.setupToolbarButton();

		// Register editor context menu items
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				menu.addItem((item) => {
					item.setTitle("Apply highlight")
						.setIcon("highlighter")
						.onClick(() => {
							new HighlightPickerModal(
								this.app,
								this,
								editor,
								this.settings.lastUsed,
							).open();
						});
				});

				menu.addItem((item) => {
					item.setTitle("Apply last highlight")
						.setIcon("star")
						.onClick(() => {
							const selection = editor.getSelection();
							if (!selection) {
								new Notice("Select some text to highlight");
								return;
							}
							this.applyLastHighlight(editor);
						});
				});
			}),
		);

		// Register commands
		this.addCommand({
			id: "apply-highlight",
			name: "Apply highlight",
			editorCallback: (editor) => {
				new HighlightPickerModal(
					this.app,
					this,
					editor,
					this.settings.lastUsed,
				).open();
			},
		});

		this.addCommand({
			id: "apply-highlight-last",
			name: "Apply last highlight",
			editorCallback: (editor) => {
				const selection = editor.getSelection();
				if (!selection) {
					new Notice("Select some text to highlight");
					return;
				}
				this.applyLastHighlight(editor);
			},
		});

		// Settings tab
		this.addSettingTab(new CustomHighlightsSettingTab(this.app, this));
	}

	onunload() {
		if (this.styleSheet) {
			document.adoptedStyleSheets = document.adoptedStyleSheets.filter(s => s !== this.styleSheet);
			this.styleSheet = null;
		}
		// Remove toolbar buttons from all views
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				const btn = this.toolbarButtons.get(leaf.view);
				if (btn) {
					btn.remove();
					this.toolbarButtons.delete(leaf.view);
				}
			}
		});
	}

	private setupToolbarButton(): void {
		const addButtonToView = (view: MarkdownView) => {
			if (this.toolbarButtons.has(view)) return;
			const action = view.addAction("highlighter", "Apply Highlight", () => {
				new HighlightPickerModal(
					this.app,
					this,
					view.editor,
					this.settings.lastUsed,
				).open();
			});
			if (action) {
				this.toolbarButtons.set(view, action);
			}
		};

		// Add to current view
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) addButtonToView(activeView);

		// Add to new views as they become active
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) addButtonToView(view);
			}),
		);
	}

	updateHighlightCSS(): void {
		if (!this.styleSheet) return;
		this.styleSheet.replaceSync(generateHighlightCSS(
			this.settings.palettes,
			this.settings.styles,
		));
	}

	async loadSettings() {
		const saved = (await this.loadData()) as Partial<CustomHighlightsSettings> | null;
		this.settings = Object.assign(
			{},
			JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as CustomHighlightsSettings,
			saved ?? {},
		);
		// Ensure arrays exist (deep merge safety)
		if (!Array.isArray(this.settings.styles)) {
			this.settings.styles = (JSON.parse(JSON.stringify(DEFAULT_SETTINGS.styles)) as HighlightStyle[]);
		}
		if (!Array.isArray(this.settings.palettes)) {
			this.settings.palettes = (JSON.parse(JSON.stringify(DEFAULT_SETTINGS.palettes)) as HighlightPalette[]);
		}
		if (!this.settings.lastUsed) {
			this.settings.lastUsed = { ...DEFAULT_SETTINGS.lastUsed };
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private applyLastHighlight(editor: Editor): void {
		const selection = editor.getSelection();
		if (!selection) return;
		const paletteId = this.settings.lastUsed?.paletteId || "pink";
		const styleId = this.settings.lastUsed?.styleId || "base";
		const style = (this.settings.styles || []).find((s) => s.id === styleId);
		const suffix = style?.suffix || "";
		const className = `hltr-m-${paletteId}${suffix}`;
		editor.replaceSelection(`<mark class="${className}">${selection}</mark>`);
	}
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Palette Edit Modal
// ---------------------------------------------------------------------------

class PaletteEditModal extends Modal {
	private palette: HighlightPalette;
	private plugin: CustomHighlightsPlugin;
	private onSave: () => void;

	constructor(app: App, plugin: CustomHighlightsPlugin, palette: HighlightPalette, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.palette = palette;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ch-edit-modal");

		contentEl.createEl("h3", { text: "Edit palette" });

		// Preview
		const previewBox = contentEl.createDiv("ch-edit-preview");
		const previewMark = previewBox.createEl("mark", {
			text: this.palette.name || this.palette.id,
		});
		previewMark.className = `hltr-m-${this.palette.id}`;

		const save = () => {
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
			previewMark.className = `hltr-m-${this.palette.id}`;
			previewMark.textContent = this.palette.name || this.palette.id;
		};

		// Name
		const nameControl = contentEl.createDiv("ch-control");
		nameControl.createEl("label", { text: "Name" });
		const nameInput = nameControl.createEl("input", {
			type: "text",
			value: this.palette.name || "",
			placeholder: "Display name",
			cls: "ch-input",
		});
		nameInput.addEventListener("change", () => {
			this.palette.name = nameInput.value.trim();
			save();
		});

		// Class ID
		const idControl = contentEl.createDiv("ch-control");
		idControl.createEl("label", { text: "Class ID" });
		const idInput = idControl.createEl("input", {
			type: "text",
			value: this.palette.id || "",
			placeholder: "CSS class identifier",
			cls: "ch-input ch-input-mono",
		});
		idInput.addEventListener("change", () => {
			const normalized = normalizeHighlightId(idInput.value || this.palette.id || "");
			if (!normalized) {
				new Notice("Palette ID is required");
				idInput.value = this.palette.id;
				return;
			}
			this.palette.id = normalized;
			idInput.value = normalized;
			save();
		});

		// Highlight color
		renderColorPicker({
			container: contentEl,
			label: "Highlight color",
			value: this.palette.color || "",
			onChange: (value) => { this.palette.color = value; save(); },
		});

		// Text color
		renderColorPicker({
			container: contentEl,
			label: "Text color",
			value: this.palette.textColor || "",
			placeholder: "Text color (optional)",
			onChange: (value) => { this.palette.textColor = value; save(); },
		});

		// Underline color
		renderColorPicker({
			container: contentEl,
			label: "Underline color",
			value: this.palette.underlineColor || "",
			placeholder: "Underline color (optional)",
			onChange: (value) => { this.palette.underlineColor = value; save(); },
		});

		// Font size
		const fontSizeControl = contentEl.createDiv("ch-control");
		fontSizeControl.createEl("label", { text: "Font size" });
		const fontSizeInput = fontSizeControl.createEl("input", {
			type: "text",
			value: this.palette.fontSize || "",
			placeholder: "Font size (optional, e.g. 14px)",
			cls: "ch-input",
		});
		fontSizeInput.addEventListener("change", () => {
			this.palette.fontSize = fontSizeInput.value.trim();
			save();
		});

		// Font weight
		const fontWeightControl = contentEl.createDiv("ch-control");
		fontWeightControl.createEl("label", { text: "Font weight" });
		const fontWeightSelect = fontWeightControl.createEl("select", { cls: "ch-input" });
		for (const opt of [
			{ label: "Default", value: "" },
			{ label: "Light", value: "300" },
			{ label: "Normal", value: "400" },
			{ label: "Medium", value: "500" },
			{ label: "Semibold", value: "600" },
			{ label: "Bold", value: "700" },
			{ label: "Extra Bold", value: "800" },
			{ label: "Black", value: "900" },
		]) {
			fontWeightSelect.createEl("option", { text: opt.label, value: opt.value });
		}
		fontWeightSelect.value = this.palette.fontWeight || "";
		fontWeightSelect.addEventListener("change", () => {
			this.palette.fontWeight = fontWeightSelect.value;
			save();
		});

		// Padding
		const paddingControl = contentEl.createDiv("ch-control");
		paddingControl.createEl("label", { text: "Padding" });
		const paddingInput = paddingControl.createEl("input", {
			type: "text",
			value: this.palette.padding || "",
			placeholder: "e.g. 2px 0px (leave blank for default)",
			cls: "ch-input",
		});
		paddingInput.addEventListener("change", () => {
			this.palette.padding = paddingInput.value.trim();
			save();
		});

		// Margin
		const marginControl = contentEl.createDiv("ch-control");
		marginControl.createEl("label", { text: "Margin" });
		const marginInput = marginControl.createEl("input", {
			type: "text",
			value: this.palette.margin || "",
			placeholder: "e.g. 0px (leave blank for default)",
			cls: "ch-input",
		});
		marginInput.addEventListener("change", () => {
			this.palette.margin = marginInput.value.trim();
			save();
		});

		// Done button
		const footer = contentEl.createDiv("ch-edit-footer");
		const doneBtn = footer.createEl("button", { text: "Done", cls: "mod-cta" });
		doneBtn.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.onSave();
	}
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

class CustomHighlightsSettingTab extends PluginSettingTab {
	plugin: CustomHighlightsPlugin;
	private dragSourceIndex: number | null = null;

	constructor(app: App, plugin: CustomHighlightsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("ch-settings");

		containerEl.createEl("p", {
			text: "Create custom highlight palettes and choose which mark styles to use. "
				+ "Select text in your note and use the command palette or right-click menu to apply highlights.",
			cls: "ch-hint",
		});

		// --- Styles Section ---
		new Setting(containerEl).setName("Styles").setHeading();

		const styleDescriptions: Record<string, string> = {
			base: "Gradient background with rounded corners",
			skewed: "Slightly rotated background block",
			"soft-glow": "Soft colored glow effect",
			"bottom-heavy": "Gradient heavier at the bottom",
			"marker-stroke": "Highlighter pen effect (bottom 70%)",
			full: "Full coverage with shadow and slight rotation",
			underline: "Colored background with underline decoration",
		};

		const styles = this.plugin.settings.styles || [];
		styles.forEach((style) => {
			new Setting(containerEl)
				.setName(style.label)
				.setDesc(styleDescriptions[style.id] || "")
				.addToggle((toggle) => {
					toggle.setValue(!!style.enabled);
					toggle.onChange((value) => {
						style.enabled = value;
						void this.plugin.saveSettings();
						this.plugin.updateHighlightCSS();
					});
				});
		});

		// --- Palettes Section ---
		new Setting(containerEl).setName("Palettes").setHeading();
		containerEl.createEl("p", {
			text: "Drag to reorder. Order here matches the selection modal.",
			cls: "ch-hint",
		});

		const addBtn = containerEl.createEl("button", {
			text: "Add palette",
			cls: "ch-add-btn",
		});
		addBtn.addEventListener("click", () => {
			const id = `highlight-${Date.now()}`;
			this.plugin.settings.palettes.push({
				id,
				name: "New Highlight",
				color: "#ffd866",
				textColor: "",
				underlineColor: "",
				fontSize: "",
				fontWeight: "",
				padding: "",
				margin: "",
				enabled: true,
			});
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
			this.display();
		});

		const palettes = this.plugin.settings.palettes || [];
		if (palettes.length === 0) {
			containerEl.createEl("p", {
				text: "No highlight palettes yet. Add one to get started.",
				cls: "ch-empty-message",
			});
			return;
		}

		const list = containerEl.createDiv("ch-palette-list");
		palettes.forEach((palette, index) => {
			this.renderPaletteRow(list, palette, index);
		});
	}

	private renderPaletteRow(
		list: HTMLElement,
		palette: HighlightPalette,
		index: number,
	): void {
		const row = list.createDiv("ch-palette-row");
		row.setAttribute("draggable", "true");
		row.dataset.index = String(index);

		// Drag handle
		const handle = row.createDiv("ch-drag-handle");
		handle.textContent = "\u2261";
		handle.setAttribute("aria-label", "Drag to reorder");

		// Color swatch
		const swatch = row.createDiv("ch-row-swatch");
		swatch.style.backgroundColor = palette.color || "transparent";
		if (palette.underlineColor?.trim()) {
			const line = swatch.createDiv("ch-row-swatch-underline");
			line.style.backgroundColor = palette.underlineColor;
		}

		// Name
		const name = row.createDiv("ch-row-name");
		name.textContent = palette.name || palette.id;

		// Class ID
		const classId = row.createDiv("ch-row-id");
		classId.textContent = palette.id;

		// Toggle
		const toggle = row.createEl("input", { type: "checkbox", cls: "checkbox-container" });
		(toggle as HTMLInputElement).checked = palette.enabled !== false;
		toggle.addEventListener("change", () => {
			palette.enabled = (toggle as HTMLInputElement).checked;
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
		});

		// Edit button
		const editBtn = row.createEl("button", { text: "Edit", cls: "ch-row-btn" });
		editBtn.addEventListener("click", () => {
			new PaletteEditModal(this.app, this.plugin, palette, () => {
				this.display();
			}).open();
		});

		// Remove button
		const removeBtn = row.createEl("button", { cls: "ch-row-btn ch-row-btn-danger" });
		removeBtn.textContent = "\u00D7";
		removeBtn.setAttribute("aria-label", "Remove");
		removeBtn.addEventListener("click", () => {
			this.plugin.settings.palettes.splice(index, 1);
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
			this.display();
		});

		// Drag events
		row.addEventListener("dragstart", (e) => {
			this.dragSourceIndex = index;
			row.addClass("ch-dragging");
			e.dataTransfer?.setData("text/plain", String(index));
		});

		row.addEventListener("dragend", () => {
			this.dragSourceIndex = null;
			row.removeClass("ch-dragging");
			list.querySelectorAll(".ch-drag-over").forEach((el) => el.removeClass("ch-drag-over"));
		});

		row.addEventListener("dragover", (e) => {
			e.preventDefault();
			if (this.dragSourceIndex === null || this.dragSourceIndex === index) return;
			list.querySelectorAll(".ch-drag-over").forEach((el) => el.removeClass("ch-drag-over"));
			row.addClass("ch-drag-over");
		});

		row.addEventListener("dragleave", () => {
			row.removeClass("ch-drag-over");
		});

		row.addEventListener("drop", (e) => {
			e.preventDefault();
			row.removeClass("ch-drag-over");
			if (this.dragSourceIndex === null || this.dragSourceIndex === index) return;
			const palettes = this.plugin.settings.palettes;
			const [moved] = palettes.splice(this.dragSourceIndex, 1);
			palettes.splice(index, 0, moved);
			this.dragSourceIndex = null;
			void this.plugin.saveSettings();
			this.display();
		});
	}
}
