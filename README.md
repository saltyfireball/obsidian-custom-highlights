# Custom Highlights for Obsidian

![Minesweeper](https://img.shields.io/badge/minesweeper-guessing%20expert-fff?style=flat&logo=windows&logoColor=FFFFFF&label=minesweeper&labelColor=5B595C&color=5C7CFA) ![Clipboard](https://img.shields.io/badge/clipboard-paste%20from%20stackoverflow-fff?style=flat&logo=stackoverflow&logoColor=FFFFFF&label=clipboard&labelColor=5B595C&color=FF6188) ![Pipeline](https://img.shields.io/badge/pipeline-its%20someone%20elses%20problem-fff?style=flat&logo=githubactions&logoColor=FFFFFF&label=pipeline&labelColor=5B595C&color=FFD866) ![VHS Tracking](https://img.shields.io/badge/vhs%20tracking-adjusting-fff?style=flat&logo=youtube&logoColor=FFFFFF&label=VHS%20tracking&labelColor=5B595C&color=78DCE8) ![Pop Up](https://img.shields.io/badge/pop--up-congratulations%20you%20won%20nothing-fff?style=flat&logo=googleads&logoColor=FFFFFF&label=pop-up&labelColor=5B595C&color=AB9DF2) ![Power Point](https://img.shields.io/badge/powerpoint-47%20slides%20no%20conclusion-fff?style=flat&logo=microsoftpowerpoint&logoColor=FFFFFF&label=power%20point&labelColor=5B595C&color=FFD866) ![No Scope](https://img.shields.io/badge/no%20scope-360%20certified-fff?style=flat&logo=xbox&logoColor=FFFFFF&label=no%20scope&labelColor=5B595C&color=FC9867) ![Jira](https://img.shields.io/badge/jira-947%20open%20tickets-fff?style=flat&logo=jira&logoColor=FFFFFF&label=jira&labelColor=5B595C&color=5C7CFA) ![Guestbook](https://img.shields.io/badge/guestbook-sign%20it-fff?style=flat&logo=bookstack&label=guestbook&labelColor=5B595C&color=FFD866)

<p align="center">
  <img src="assets/header.svg" width="600" />
</p>

Create custom highlight palettes with multiple mark styles for your Obsidian notes.

## Features

- **Custom color palettes** -- Define as many highlight colors as you need with full color customization
- **7 highlight styles** -- Classic, Skewed, Soft Glow, Bottom Heavy, Marker Stroke, Full, and Underline
- **Mix and match** -- Any palette color can be used with any enabled style
- **Quick apply** -- Apply highlights from the command palette, editor context menu, or keyboard shortcuts
- **Re-apply last** -- Quickly re-apply your most recent highlight choice with a single command
- **Per-palette customization** -- Set text color, underline color, font size, and font weight per palette
- **Live preview** -- See exactly how your highlight will look before applying
- **Mobile support** -- Works on both desktop and mobile

## Installation

### From Obsidian Community Plugins

**Might not be approved yet**

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Custom Highlights"
4. Install and enable the plugin

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](../../releases/latest)
2. Create a folder called `custom-highlights` inside your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into that folder
4. Enable the plugin in Obsidian Settings > Community Plugins

## Usage

### Quick Start

1. Enable the plugin in settings
2. Select some text in your note
3. Open the command palette (Ctrl/Cmd+P) and search for "Apply Highlight"
4. Pick a color palette and style, then click Apply

Your text will be wrapped in a `<mark>` tag with the appropriate CSS class:

```html
<mark class="hltr-m-pink">highlighted text</mark>
```

### Commands

| Command                  | Description                                      |
| ------------------------ | ------------------------------------------------ |
| **Apply Highlight**      | Opens the palette/style picker for the selection |
| **Apply Last Highlight** | Re-applies the most recently used palette+style  |

Both commands are also available from the editor right-click context menu.

### Highlight Styles

| Style         | Effect                                        |
| ------------- | --------------------------------------------- |
| Classic       | Gradient background with rounded corners      |
| Skewed        | Slightly rotated background block             |
| Soft Glow     | Soft colored glow effect                      |
| Bottom Heavy  | Gradient heavier at the bottom                |
| Marker Stroke | Highlighter pen effect (bottom 70%)           |
| Full          | Full coverage with shadow and slight rotation |
| Underline     | Colored background with underline decoration  |

Each style can be individually enabled or disabled in settings.

## Settings

Access settings via Obsidian Settings > Custom Highlights.

### Styles

Toggle which highlight styles are available. Disabled styles will not appear in the picker modal.

### Palettes

Each palette defines a highlight color. For each palette you can configure:

- **Name** -- Display name shown in the picker
- **Class ID** -- CSS class identifier (e.g. `pink` becomes `hltr-m-pink`). Changing this affects existing highlights
- **Highlight color** -- The main background color (#RRGGBB, #RRGGBBAA, rgb(), rgba())
- **Text color** -- Override the text color (optional)
- **Underline color** -- Color for the underline style (optional)
- **Font size** -- Override font size (optional, e.g. `14px`)
- **Font weight** -- Override font weight (optional, Light through Black)

### Default Palettes

The plugin ships with 6 palettes: Pink, Yellow, Orange, Green, Blue, and Purple. You can modify or remove these and add your own.

## CSS Class Format

Highlights use the class pattern `hltr-m-{paletteId}{suffix}`:

- `hltr-m-pink` -- Classic style with pink palette
- `hltr-m-blue-skewed` -- Skewed style with blue palette
- `hltr-m-green-soft-glow` -- Soft glow style with green palette
- `hltr-m-yellow-ul` -- Underline style with yellow palette

You can use these classes directly in HTML if you prefer manual markup:

```html
<mark class="hltr-m-pink-marker-stroke">important note</mark>
```

## Custom CSS

The plugin generates CSS dynamically based on your settings. If you need additional customization, you can add CSS snippets in Obsidian that target the `hltr-m-*` classes.

## License

This plugin is released under the [MIT License](LICENSE).
