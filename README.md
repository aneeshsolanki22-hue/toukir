# toukir

[![npm version](https://img.shields.io/npm/v/toukir.svg)](https://www.npmjs.com/package/toukir)
[![CI](https://github.com/aneeshsolanki22-hue/toukir/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/aneeshsolanki22-hue/toukir/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Download any video from YouTube, X, Instagram, Threads & 1800+ sites — right from your terminal. Paste a link, pick a quality, done.

Built with [React](https://react.dev) + [Ink](https://github.com/vadimdemedes/ink) for the terminal UI, powered by [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Install

```sh
npm install -g toukir
```

Then run it from anywhere:

```sh
toukir
```

> First run downloads the yt-dlp engine automatically (system install is used if you already have it). MP3 extraction needs ffmpeg — toukir falls back to `ffmpeg-static` if you don't have it.

## How it works

1. **Paste a link** — plain URL, even without `https://`; toukir reads your clipboard and offers it
2. **Pick a quality** — every resolution with honest size estimates, or audio-only mp3
3. **Done** — the file lands in your `~/Downloads`, path printed for copy-paste

Mouse and keyboard both work: click the options or use the number/arrow keys.

## Browser extension

Put toukir one click away in your browser:

- a red **⬇ toukir** button below YouTube videos (watch, Shorts, live)
- a right-click **Download with toukir** option on any website — Instagram, X, Threads, TikTok…

Clicking either one opens toukir on your machine with the video pre-filled — the extension never downloads anything itself.

### Setup (one time, ~2 minutes)

**1. Install toukir 0.2.0 or newer** and register the protocol handler:

```sh
npm install -g toukir@latest
toukir setup
```

`toukir setup` registers the `toukir://` handler with your OS (Windows: per-user registry; Linux: a desktop entry — no admin rights needed).

**2. Load the extension** in Chrome, Edge, or Brave. The easiest way is the release download:

<p align="center">
  <a href="https://github.com/aneeshsolanki22-hue/toukir/releases/download/v0.2.0/toukir-extension-v0.2.0.zip">
    <img src="https://img.shields.io/badge/⬇_Download_extension-v0.2.0-e53935?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download the toukir browser extension"/>
  </a>
</p>

Unzip it, then open `chrome://extensions` → enable **Developer mode** (top right) → **Load unpacked** → select the unzipped folder.

> Prefer living on the edge? Clone this repo and select its `extension/` folder instead — that's always the newest code.

**3. Use it.** Open any YouTube video and click **⬇ toukir**. The very first time, the browser asks *"Open toukir?"* — tick **Always allow** and it's silent from then on: one click → the toukir picker opens → pick a quality → the file lands in `~/Downloads`.

> After updating or reloading the extension, refresh any open tabs — pages keep the old button until refreshed.

Full details in [`extension/README.md`](./extension/README.md).

## Features

- 🎬 1800+ sites via yt-dlp — YouTube, X/Twitter, Instagram, Threads, and more
- 🧩 Browser extension — download YouTube videos without leaving the page
- 📏 Per-resolution size estimates (bitrate × duration when exact sizes aren't published)
- 🎵 Audio-only downloads as mp3 (via ffmpeg)
- 🖱️ Full mouse support — click buttons, quality rows, and cancel links
- ⌨️ Keyboard-first too — arrows, numbers, `enter`, `esc` to cancel
- 🛟 Plain-language errors — raw yt-dlp jargon mapped to a headline + one next step
- 📥 Auto-organizes into `~/Downloads` with clean filenames

## Requirements

- Node.js 18+
- ffmpeg (optional — needed for mp3 and merged video+audio; auto-fallback to `ffmpeg-static`)

## Development

```sh
npm install
npm run dev      # watch build
npm test         # tests
npm run typecheck
```

## License

MIT
