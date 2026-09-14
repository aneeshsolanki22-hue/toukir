# Chrome Web Store listing — copy-paste ready

Everything below goes into the [Publisher Dashboard](https://chrome.google.com/webstore/devconsole) during upload. Text is already review-safe: it describes only what the code does, makes no download promises (toukir does the downloading, not the extension), and states the permission use plainly — the three things reviewers reject extensions for most.

## Store registration (one-time, only you can do this)

1. Go to https://chrome.google.com/webstore/devconsole and sign in with your Google account
2. Pay the **one-time $5 registration fee** (the only step that needs you)
3. Set a publisher name — "toukir" or your name

## Upload — New item → drag `toukir-extension-store.zip`

The zip is ready at the project root (already gitignored). It contains exactly the 6 files that run: manifest, 2 scripts, 3 icons.

## Listing fields

**Name**
```
toukir — video link to desktop downloader
```

**Short description (132 chars max)**
```
Adds a download button on YouTube and a right-click menu on any site — sends the link to the toukir app installed on your PC.
```

**Detailed description**
```
toukir connects your browser to the toukir desktop app (free, open source: https://github.com/aneeshsolanki22-hue/toukir).

WHAT IT DOES
• Adds a "⬇ toukir" button below YouTube videos (watch pages, Shorts, live)
• Adds "Download with toukir" to the right-click menu on any website
• Clicking either one passes the video's web address to the toukir app on your computer, which opens its quality picker and saves the video to your Downloads folder

WHAT IT DOES NOT DO
• The extension never downloads anything itself — it only forwards a URL
• No ads, no analytics, no tracking, no data collection of any kind

ONE-TIME SETUP
1. Install the toukir app: `npm install -g toukir`
2. Run `toukir setup` once — this registers toukir:// with your operating system
3. Install this extension

The first time you use it, your browser asks permission to open the toukir app — choose "Always allow" and it's one click from then on.

PRIVACY
The extension stores nothing, sends nothing to any server, and reads nothing from the page. The only permission it requests (contextMenus) is what adds the right-click menu item.

toukir is MIT-licensed open source. The extension ships in this repository under extension/ — you can read all of its code (two small scripts) in under a minute.
```

**Category:** Tools

**Language:** English

**Privacy tab answers:**
- Single purpose: "Sends the current video's URL to the toukir desktop app"
- Does it collect user data? **No** — no data collection, no analytics
- Permissions justification (required field):
  ```
  contextMenus: used to add the "Download with toukir" item to the browser's
  right-click menu. This is the only way to provide that feature. The
  extension requests no other permissions and stores no data.
  ```
- Remote code: **No** (everything is bundled in the zip)

**Distribution tab:** Public (or Unlisted if you'd rather share the link privately first)

## After submitting

Review typically takes 1–3 business days (URL-forwarding extensions with no data access usually sail through). Status shows in the dashboard; you'll get an email on approval.

## One heads-up for the review

The store policy teams dislike **downloaders that facilitate YouTube content piracy** — but this extension's honest posture (it downloads nothing itself; it's a URL handoff to a separate open-source tool) plus the clear description above is the right way to present it. If reviewers ask for changes, they'll email you specific fix requests rather than reject outright.
