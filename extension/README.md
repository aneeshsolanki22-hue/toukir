# toukir browser extension

Adds a **⬇ toukir** button on YouTube watch, Shorts & live pages, plus a
**Download with toukir** right-click option on any website (Instagram, X,
Threads, TikTok — every site yt-dlp supports).

Clicking either one hands the video URL to the **toukir app installed on your
machine** — the extension never downloads anything itself.

## Requirements

- **toukir 0.2.0 or newer** (`npm install -g toukir@latest`)
- Chrome, Edge, or Brave (any Chromium browser with Manifest V3 support)
- **Windows or Linux** for the auto-launch flow (see the macOS note below)

## Setup (one time, two steps)

**1. Register the protocol handler** — in a terminal:

```sh
toukir setup
```

Windows: registers `toukir://` in your per-user registry (no admin rights).
Linux: writes a desktop entry and sets it as the scheme handler.

> **⚠️ macOS:** `toukir setup` doesn't support macOS yet — the toukir app itself
> works fine on macOS, but the OS can't be told to launch it from a `toukir://`
> link, so the extension's button/menu won't open anything. Until macOS protocol
> support lands, run `toukir <url>` directly in a terminal instead. (Want this
> fixed? It needs a small generated `.app` bundle registered with Launch
> Services — see the repo issues.)

**2. Load the extension** — in Chrome/Edge/Brave, pick either:

**Option A — direct download (easiest):** download
[`toukir-extension-v0.2.0.zip`](https://github.com/aneeshsolanki22-hue/toukir/releases/download/v0.2.0/toukir-extension-v0.2.0.zip)
from the releases page and unzip it. Then:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the unzipped folder

**Option B — from source:** select this repo's `extension/` folder in the
same way (always the newest code).

Done. Open any YouTube video — the red **⬇ toukir** button appears below the
player. The first click shows the browser's *"Open toukir?"* prompt; tick
**Always allow** and from then on it's one click → toukir opens with the video
pre-filled → pick a quality → downloaded to `~/Downloads`.

> After reloading or updating the extension, **refresh any open tabs** — a page
> keeps its old button until refreshed (the button removes itself rather than
> erroring, but it won't come back until you reload the page).

## How it works

- `content.js` — detects the video on the page, injects the button, and opens
  the `toukir://` link from the page (that's what earns the **Always allow**
  checkbox on the first use)
- `background.js` — validates the URL (YouTube hosts for the button) and
  serves the right-click menu, which works on any site; menu launches hand the
  page/link URL to the OS directly
- the OS protocol handler (registered by `toukir setup`) launches
  `toukir "<url>"` in a terminal window

No servers, no analytics, no download happens in the browser — the extension
is two small scripts you can read in a minute.

## Notes

- The **Always allow** checkbox only appears for the YouTube button (launched
  from the page). Right-click launches always show the one-time-per-click
  prompt — that's a browser security rule, not a bug.
- A throwaway tab may flash open during the handoff; it closes itself.

## Uninstall

Remove it from `chrome://extensions`, and unregister the protocol:

```sh
reg delete HKCU\Software\Classes\toukir /f                        # windows
rm ~/.local/share/applications/toukir.desktop                      # linux
rm -rf ~/Applications/toukir.app                                   # macos, once support exists
```
