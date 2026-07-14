# <img src="icons/icon48.png" width="50" height="50" align="absmiddle"> Glyph



A Chrome extension that replaces website fonts with your operating system's native font (SF Pro on macOS, Segoe UI on Windows). Automatically detects and preserves code/monospace fonts.

![Glyph Extension](screenshots/Project%20screenshot.png)

## Features

- One-click toggle per site or globally
- Auto-detects monospace/code fonts and leaves them untouched
- Works on any website
- Zero data collection, fully offline
- Handles SPAs, lazy-loaded content, and dynamic rendering

## Before & After

| Site | Before | After |
|:---:|:---:|:---:|
| **YouTube** | ![Before YT](screenshots/Before%20yt.png) | ![After YT](screenshots/After%20yt.png) |
| **Medium** | ![Before Medium](screenshots/Before%20medium.png) | ![After Medium](screenshots/After%20medium.png) |
| **GeeksforGeeks** | ![Before GFG](screenshots/Before%20GFG.png) | ![After GFG](screenshots/After%20GFG.png) |

## Install (Development)

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this folder
5. Navigate to any website → click the extension icon → toggle on

> **Incognito mode:** To use Glyph in Incognito, go to `chrome://extensions` → find Glyph → click **Details** → enable **Allow in Incognito**.

## How It Works

The extension uses a simple, reliable strategy:

1. **Read** every element's computed `font-family`
2. If it's monospace or an icon font → **skip** (don't touch)
3. If it's a regular text font → **override** to system font

This guarantees code blocks, terminal output, and icon fonts are never affected, regardless of which website you're on.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension config |
| `content.js` | Core logic: detects fonts and applies override |
| `background.js` | Manages per-site state and script injection |
| `popup.html/js` | Extension popup UI |
| `options.html/js` | Full options page |
| `docs/privacy-policy.md` | Privacy policy for Chrome Web Store |

## Chrome Web Store Submission

1. Create icons at 16x16, 48x48, 128x128 px (replace placeholders in `icons/`)
2. Take 3-5 screenshots (1280x800 or 640x400)
3. Host privacy policy (e.g., GitHub Pages from `docs/privacy-policy.md`)
4. Zip this folder and upload at https://chrome.google.com/webstore/devconsole
5. Fill in listing details, attach screenshots, link privacy policy

## Privacy

This extension collects no data. See [Privacy Policy](docs/privacy-policy.md).

## License

MIT
