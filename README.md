# Content to Markdown Extension

Chrome and Edge extension that converts page or selected content on a page into Markdown format.

## Features

- **Convert Entire Page**: Saves the entire page content as Markdown, automatically excluding navigation, footer, sidebar, and other non-essential elements
- **Convert Selection**: Saves only the selected text as Markdown
- **Copy to Clipboard**: Default action - copies Markdown directly to your clipboard
- **Save as File**: Option to save Markdown as a `.md` file
- **Context Menu Integration**: Right-click on selected text or page to quickly convert
- **Configurable Exclusions**: Settings page to customize which elements to exclude (navigation, footer, sidebar, ads, comments, forms, etc.)
- **Custom Selectors**: Add your own CSS selectors for elements to exclude

## Installation

### Development/Testing

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder

### Building for Production

```bash
npm run build
```

The built extension will be in the `dist` directory.

## Usage

### Popup Interface
1. Click the extension icon in your browser toolbar
2. Choose from:
   - **Copy Page as Markdown** - Converts the entire page (excluding navigation, footer, etc.)
   - **Copy Selection as Markdown** - Converts only selected text (button enabled when text is selected)
   - **Save Page as File** - Downloads the page as a `.md` file
   - **Save Selection as File** - Downloads selected content as a `.md` file

### Context Menu
- Right-click anywhere on a page and select "Copy page as Markdown"
- Select text, right-click, and select "Copy selection as Markdown"

### Settings
Click "⚙️ Settings" in the popup or go to the extension options to configure:

#### Elements to Exclude
- Navigation (nav elements, header navigation)
- Footer elements
- Sidebars (aside elements)
- Advertisements and banners
- Comments sections
- Forms and input fields
- Script and style content

#### Custom Exclusions
Add your own CSS selectors (one per line) for elements you want to exclude, such as:
- `.cookie-banner`
- `#popup-modal`
- `[data-ads]`

#### Output Options
- Include/exclude images in output
- Include/exclude links in output
- Preserve table formatting
- Include page title as heading
- Include source URL in output

## Development

### Project Structure

```
├── public/                 # Static assets
│   ├── manifest.json       # Chrome extension manifest
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Popup styles
│   ├── options.html        # Settings page UI
│   ├── options.css         # Settings page styles
│   ├── content.css         # Content script styles
│   └── icons/              # Extension icons
├── src/
│   ├── background/         # Service worker
│   │   └── background.ts
│   ├── content/            # Content script
│   │   └── content.ts
│   ├── popup/              # Popup logic
│   │   └── popup.ts
│   ├── options/            # Settings page logic
│   │   └── options.ts
│   └── utils/              # Shared utilities
│       ├── converter.ts    # HTML to Markdown conversion
│       ├── messages.ts     # Message types
│       └── settings.ts     # Settings management
├── dist/                   # Built extension (gitignored)
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### Scripts

- `npm run build` - Build production version
- `npm run build:dev` - Build development version
- `npm run watch` - Watch mode for development

### Technologies

- TypeScript
- Webpack
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion

## License

ISC

