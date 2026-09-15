# toukir

[![npm](https://img.shields.io/npm/v/toukir.svg)](https://www.npmjs.com/package/toukir)
[![CI](https://github.com/aneeshsolanki22-hue/toukir/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/aneeshsolanki22-hue/toukir/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A terminal video downloader with a real interface: launch it, hand it a link, choose a quality from a list with accurate file sizes, and let it save the file wherever you expect to find it.

Works with YouTube, X/Twitter, Instagram, Threads, TikTok and 1,800+ other sites — everything [yt-dlp](https://github.com/yt-dlp/yt-dlp) supports — wrapped in a keyboard-and-mouse friendly UI built with [React](https://react.dev) and [Ink](https://github.com/vadimdemedes/ink).

---

## Quick start

```sh
npm install -g toukir
```

```sh
toukir                      # opens the app
toukir <url>                # jumps straight to the quality picker
toukir --help               # all options
```

| Step | What happens |
|---|---|
| **Give it a link** | Type it, paste it, or just launch `toukir` with the link already in your clipboard — it detects and offers it |
| **Choose a format** | Every available resolution with size estimates, or audio-only mp3 |
| **Get the file** | Saved to `~/Downloads` with a clean name; the full path is printed when finished |

First run fetches the yt-dlp engine automatically (an existing system install is preferred). ffmpeg is optional — needed only for mp3 extraction and merging, with `ffmpeg-static` as an automatic fallback.

## Browser extension

toukir also ships a Chromium extension (Chrome, Edge, Brave) that bridges the browser to the app:

- a **⬇ toukir** button on YouTube pages — watch, Shorts, and live
- a **right-click → Download with toukir** action on any site

Both hand the video URL to the app on your machine. The extension performs no downloads, stores nothing, and contacts no servers.

### Setup

**1. Install the app (0.2.0+) and register the protocol handler**

```sh
npm install -g toukir@latest
toukir setup
```

This registers the `toukir://` scheme with your OS — per-user Windows registry or a Linux desktop entry, no administrator rights required.

> **macOS** — the app itself is fully supported, but protocol registration isn't implemented yet. Use `toukir <url>` directly for now.

**2. Install the extension**

<p align="center">
  <a href="https://github.com/aneeshsolanki22-hue/toukir/releases/download/v0.2.1/toukir-extension-v0.2.1.zip">
    <img src="https://img.shields.io/badge/⬇_Download_extension-v0.2.1-e53935?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Download the toukir browser extension"/>
  </a>
</p>

Unzip, then open `chrome://extensions` → **Developer mode** → **Load unpacked** → select the unzipped folder. (Alternatively, point Load unpacked at this repo's `extension/` directory for the latest code.)

**3. Use it** — open a YouTube video, click **⬇ toukir**. The browser asks permission once ("Open toukir?" → **Always allow**); from then on, one click opens the app with the video ready to pick.

Details and troubleshooting: [`extension/README.md`](./extension/README.md).

## Highlights

- **1,800+ sites** through the yt-dlp engine, kept current by its maintainers
- **Honest sizes** — per-resolution estimates from bitrate × duration when exact sizes aren't published; nothing is faked
- **Audio-only mp3** extraction via ffmpeg
- **Fully mouse-driven** — buttons, quality rows, and cancel links are clickable
- **Fully keyboard-driven** — arrows, number shortcuts, `enter`, `esc`
- **Readable errors** — yt-dlp failures are translated to a plain-language headline plus one concrete next step
- **Zero configuration** — sensible defaults, organized output, no config files

## Requirements

- Node.js 18+
- ffmpeg (optional — see Quick start)

## Development

```sh
npm install
npm run dev          # watch mode build
npm test             # test suite
npm run typecheck    # strict type check
```

## License

[MIT](./LICENSE) — © toukir contributors.

toukir builds on prior art from the open-source community; the [LICENSE](./LICENSE) file carries the full attribution chain, including the original work it derives from.
