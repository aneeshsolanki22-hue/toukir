# toukir

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

There's also a **Chrome extension** in [`extension/`](./extension): a *⬇ toukir* button on YouTube pages plus a right-click **Download with toukir** on any link. Clicking it opens `toukir` on your machine with the video pre-filled.

One-time setup:

```sh
toukir setup          # registers the toukir:// protocol handler
```

Then load the unpacked extension via `chrome://extensions` — full instructions in [`extension/README.md`](./extension/README.md).

## Features

- 🎬 1800+ sites via yt-dlp — YouTube, X/Twitter, Instagram, Threads, and more
- 📏 Per-resolution size estimates (bitrate × duration when exact sizes aren't published)
- 🎵 Audio-only downloads as mp3 (via ffmpeg)
- 🖱️ Full mouse support — click buttons, quality rows, and cancel links
- ⌨️ Keyboard-first too — arrows, numbers, `enter`, `esc` to cancel
- 🛟 Plain-language errors — raw yt-dlp jargon mapped to a headline + one next step
- 📥 Auto-organizes into `~/Downloads` with clean filenames

## Requirements

- Node.js 18+
- ffmpeg (optional — needed for mp3 and merged video+audio; auto-fallback to ffmpeg-static)

## Roadmap

- [x] Publish to npm
- [x] Browser extension (YouTube button + right-click → toukir)
- [ ] `toukir <url> --best` — skip the picker for scripts
- [ ] Playlist support
- [ ] `curl toukir.sh | sh` installer

## Development

```sh
npm install
npm run dev      # watch build
npm test         # tests
npm run typecheck
```

## License

MIT
