# toukir browser extension

Adds a **⬇ toukir** button on YouTube watch & shorts pages, plus a
**Download with toukir** right-click option on any link (X, Instagram, Threads,
TikTok — every site yt-dlp supports).

Clicking either one hands the video URL to the **toukir app installed on your
machine** — the extension never downloads anything itself.

## Setup (one time, two steps)

**1. Register the protocol handler** — in a terminal:

```sh
toukir setup
```

**2. Load the extension** — in Chrome/Edge/Brave:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `extension/` folder

Done. Open any YouTube video — the red **⬇ toukir** button appears below the
player. The first click shows Chrome's *"Open toukir?"* prompt; tick **Always
allow** and from then on it's one click → toukir opens with the video
pre-filled → pick a quality → downloaded to `~/Downloads`.

## How it works

- `content.js` — detects the video on the page, injects the button
- `background.js` — opens `toukir://download?url=<video url>`
- the OS protocol handler (registered by `toukir setup`) launches
  `toukir "<url>"` in a terminal window

No servers, no analytics, no download happens in the browser — the extension
is two small scripts you can read in a minute.

## Requirements

- toukir installed (`npm install -g toukir`) and `toukir setup` run once
- Chrome, Edge, or Brave (any Chromium browser with Manifest V3 support)

## Uninstall

Remove it from `chrome://extensions`, and unregister the protocol with:

```sh
reg delete HKCU\Software\Classes\toukir /f   # windows
```
