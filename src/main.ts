import {
	Editor,
	MarkdownView,
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
		{ id: "pink", name: "Pink", color: "#ff6188", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
		{ id: "yellow", name: "Yellow", color: "#ffd866", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
		{ id: "orange", name: "Orange", color: "#fc9867", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
		{ id: "green", name: "Green", color: "#a9dc76", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
		{ id: "blue", name: "Blue", color: "#78dce8", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
		{ id: "purple", name: "Purple", color: "#ab9df2", textColor: "", underlineColor: "", fontSize: "", fontWeight: "", enabled: true },
	],
	lastUsed: { paletteId: "pink", styleId: "base" },
};

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default class CustomHighlightsPlugin extends Plugin {
	settings!: CustomHighlightsSettings;
	private styleEl: HTMLStyleElement | null = null;
	private toolbarButtons = new WeakMap<MarkdownView, HTMLElement>();

	async onload() {
		await this.loadSettings();

		// Inject dynamic highlight CSS
		// eslint-disable-next-line obsidianmd/no-forbidden-elements -- dynamic CSS generation requires a style element; styles.css cannot handle runtime palette changes
		this.styleEl = document.createElement("style");
		this.styleEl.id = "custom-highlights-styles";
		document.head.appendChild(this.styleEl);
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
		if (this.styleEl) {
			this.styleEl.remove();
			this.styleEl = null;
		}
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
		if (!this.styleEl) return;
		this.styleEl.textContent = generateHighlightCSS(
			this.settings.palettes,
			this.settings.styles,
		);
	}

	async loadSettings() {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- loadData returns any
		const saved = await this.loadData();
		this.settings = Object.assign(
			{},
			JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as CustomHighlightsSettings,
			(saved || {}) as Partial<CustomHighlightsSettings>,
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

class CustomHighlightsSettingTab extends PluginSettingTab {
	plugin: CustomHighlightsPlugin;

	constructor(app: App, plugin: CustomHighlightsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("ch-settings");

		// --- Header ---
		;
		containerEl.createEl("p", {
			text: "Create custom highlight palettes and choose which mark styles to use. "
				+ "Select text in your note and use the command palette or right-click menu to apply highlights.",
			cls: "ch-hint",
		});

		// --- How to Use ---
		const howTo = containerEl.createDiv("ch-how-to");
		new Setting(howTo).setName("How to use").setHeading();
		const steps = howTo.createEl("ol");
		steps.createEl("li", { text: "Create highlight palettes below (or use the defaults)." });
		steps.createEl("li", { text: "Enable the mark styles you want to use." });
		steps.createEl("li", { text: "Select text in your note." });
		steps.createEl("li", { text: "Use \"Apply highlight\" from the command palette (Ctrl/Cmd+P) or right-click menu." });
		steps.createEl("li", { text: "Pick a palette and style, then click apply." });
		howTo.createEl("p", {
			text: "Tip: use \"apply last highlight\" to quickly re-apply your most recent choice.",
			cls: "ch-hint",
		});

		// --- Styles Section ---
		new Setting(containerEl).setName("Styles").setHeading();
		containerEl.createEl("p", {
			text: "Toggle which highlight styles are available when applying highlights. "
				+ "Each style creates a different visual effect using the palette color.",
			cls: "ch-hint",
		});

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
				.setDesc(styleDescriptions[style.id] || (style.suffix ? `Class suffix: ${style.suffix}` : "Base highlight style"))
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
			text: "Each palette defines a color used for highlights. "
				+ "The palette ID becomes part of the CSS class name (e.g. hltr-m-pink). "
				+ "Changing an ID will affect any existing highlights that use it.",
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
			this.renderPaletteItem(list, palette, index);
		});
	}

	private renderPaletteItem(
		list: HTMLElement,
		palette: HighlightPalette,
		index: number,
	): void {
		const item = list.createDiv("ch-palette-item");
		const header = item.createDiv("ch-palette-header");

		// Preview
		const preview = header.createDiv("ch-palette-preview");
		const previewMark = preview.createEl("mark", {
			text: palette.name || palette.id,
		});
		previewMark.className = `hltr-m-${palette.id}`;

		// Actions
		const actions = header.createDiv("ch-palette-actions");
		const enabledToggle = actions.createEl("input", {
			type: "checkbox",
			cls: "ch-toggle",
		});
		enabledToggle.checked = palette.enabled !== false;
		enabledToggle.addEventListener("change", () => {
			palette.enabled = enabledToggle.checked;
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
		});

		const editButton = actions.createEl("button", { text: "Edit" });
		const removeBtn = actions.createEl("button", {
			text: "Remove",
			cls: "ch-remove-btn",
		});

		// Expandable controls
		const controls = item.createDiv("ch-palette-controls");
		controls.addClass("ch-hidden");

		editButton.addEventListener("click", () => {
			const isHidden = controls.hasClass("ch-hidden");
			controls.toggleClass("ch-hidden", !isHidden);
			editButton.textContent = isHidden ? "Hide" : "Edit";
		});

		removeBtn.addEventListener("click", () => {
			this.plugin.settings.palettes.splice(index, 1);
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
			this.display();
		});

		// Name
		const nameControl = controls.createDiv("ch-control");
		nameControl.createEl("label", { text: "Name" });
		const nameInput = nameControl.createEl("input", {
			type: "text",
			value: palette.name || "",
			placeholder: "Display name",
			cls: "ch-input",
		});
		nameInput.addEventListener("change", () => {
			palette.name = nameInput.value.trim();
			previewMark.textContent = palette.name || palette.id;
			void this.plugin.saveSettings();
		});

		// Class ID
		const idControl = controls.createDiv("ch-control");
		idControl.createEl("label", { text: "Class ID" });
		const idInput = idControl.createEl("input", {
			type: "text",
			value: palette.id || "",
			placeholder: "CSS class identifier",
			cls: "ch-input ch-input-mono",
		});
		idInput.addEventListener("change", () => {
			const normalized = normalizeHighlightId(idInput.value || palette.id || "");
			if (!normalized) {
				new Notice("Palette ID is required");
				idInput.value = palette.id;
				return;
			}
			palette.id = normalized;
			idInput.value = normalized;
			previewMark.className = `hltr-m-${palette.id}`;
			previewMark.textContent = palette.name || palette.id;
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
		});

		// Highlight color (using the reusable color picker)
		renderColorPicker({
			container: controls,
			label: "Highlight color",
			value: palette.color || "",
			onChange: (value) => {
				palette.color = value;
				void this.plugin.saveSettings();
				this.plugin.updateHighlightCSS();
			},
		});

		// Text color
		renderColorPicker({
			container: controls,
			label: "Text color",
			value: palette.textColor || "",
			placeholder: "Text color (optional)",
			onChange: (value) => {
				palette.textColor = value;
				void this.plugin.saveSettings();
				this.plugin.updateHighlightCSS();
			},
		});

		// Underline color
		renderColorPicker({
			container: controls,
			label: "Underline color",
			value: palette.underlineColor || "",
			placeholder: "Underline color (optional)",
			onChange: (value) => {
				palette.underlineColor = value;
				void this.plugin.saveSettings();
				this.plugin.updateHighlightCSS();
			},
		});

		// Font size
		const fontSizeControl = controls.createDiv("ch-control");
		fontSizeControl.createEl("label", { text: "Font size" });
		const fontSizeInput = fontSizeControl.createEl("input", {
			type: "text",
			value: palette.fontSize || "",
			placeholder: "Font size (optional, e.g. 14px)",
			cls: "ch-input",
		});
		fontSizeInput.addEventListener("change", () => {
			palette.fontSize = fontSizeInput.value.trim();
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
		});

		// Font weight
		const fontWeightControl = controls.createDiv("ch-control");
		fontWeightControl.createEl("label", { text: "Font weight" });
		const fontWeightSelect = fontWeightControl.createEl("select", {
			cls: "ch-input",
		});
		const fontWeightOptions = [
			{ label: "Default", value: "" },
			{ label: "Light", value: "300" },
			{ label: "Normal", value: "400" },
			{ label: "Medium", value: "500" },
			{ label: "Semibold", value: "600" },
			{ label: "Bold", value: "700" },
			{ label: "Extra Bold", value: "800" },
			{ label: "Black", value: "900" },
		];
		fontWeightOptions.forEach((opt) => {
			fontWeightSelect.createEl("option", {
				text: opt.label,
				value: opt.value,
			});
		});
		fontWeightSelect.value = palette.fontWeight || "";
		fontWeightSelect.addEventListener("change", () => {
			palette.fontWeight = fontWeightSelect.value;
			void this.plugin.saveSettings();
			this.plugin.updateHighlightCSS();
		});
	}
}
