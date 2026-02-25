# Custom Highlights for Obsidian

![works on my machine](https://img.shields.io/badge/worksonmymachien-on%20my%20machine-fff?style=flat&logo=apple&logoColor=FFFFFF&logoSize=FF6188&label=works&labelColor=5B595C&color=A9DC76) ![MySpace](https://img.shields.io/badge/myspace-42%20online-fff?style=flat&logo=myspace&logoColor=FFFFFF&logoSize=FF6188&label=My%20Space&labelColor=5B595C&color=5C7CFA) ![All Your Base](https://img.shields.io/badge/all%20your%20base-are%20belong%20to%20us-fff?style=flat&logo=retroarch&label=all%20your%20base&labelColor=5B595C&color=78DCE8) ![Neopets](https://img.shields.io/badge/neopets-starving-fff?style=flat&logo=paw&label=neopet&labelColor=5B595C&color=FFD866) ![ICQ](https://img.shields.io/badge/icq-uh%20oh!-fff?style=flat&logo=wechat&label=ICQ&labelColor=5B595C&color=78DCE8) ![Bees](https://img.shields.io/badge/bees-approximately%20seven-fff?style=flat&logo=honeybadger&logoColor=FFFFFF&label=bees&labelColor=5B595C&color=FFD866) ![Winamp](https://img.shields.io/badge/winamp-it%20really%20whips-fff?style=flat&logo=musicbrainz&label=winamp&labelColor=5B595C&color=A9DC76) ![Bees 2](https://img.shields.io/badge/bees-still%20approximately%20seven-fff?style=flat&logo=honey&label=bees&labelColor=5B595C&color=FFD866) ![Printer](https://img.shields.io/badge/printer-offline-fff?style=flat&logo=hp&label=printer&labelColor=5B595C&color=FF6188) ![Best Viewed In](https://img.shields.io/badge/best%20viewed%20in-IE6-fff?style=flat&logo=internetexplorer&label=browser&labelColor=5B595C&color=78DCE8) ![YouTube](https://img.shields.io/badge/youtube-240p-fff?style=flat&logo=youtube&label=quality&labelColor=5B595C&color=FF6188)

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
