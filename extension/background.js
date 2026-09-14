// Background service worker. Validates urls from the content script and
// handles the right-click menu, which works on ANY page (instagram, x,
// threads…) — not just links. The content script does the actual protocol
// launch from the page (that's what earns chrome's "always allow" checkbox);
// the menu launch happens from the worker because context-menu clicks have
// no page script to do it.

// hosts the injected button covers. the context menu is not restricted.
const YT_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])

const MAX_URL_LENGTH = 2048

function registerMenu() {
  // on any page — instagram shows videos without usable right-clickable
  // links, so restricting to 'link' made the menu missing there
  chrome.contextMenus.create(
    {
      id: 'toukir-download-page',
      title: 'Download with toukir',
      contexts: ['page', 'video', 'image', 'link'],
    },
    () => void chrome.runtime.lastError, // duplicate id on re-registration — fine
  )
}

chrome.runtime.onInstalled.addListener(registerMenu)
registerMenu()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'toukir-download') return undefined
  const url = typeof message.url === 'string' ? message.url : null
  if (!url || url.length > MAX_URL_LENGTH) {
    sendResponse({ok: false, error: 'invalid url'})
    return undefined
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    sendResponse({ok: false, error: 'invalid url'})
    return undefined
  }
  if (!YT_HOSTS.has(parsed.hostname)) {
    sendResponse({ok: false, error: 'unsupported host: ' + parsed.hostname})
    return undefined
  }
  if (sender.tab?.id === undefined) {
    sendResponse({ok: false, error: 'unknown sender'})
    return undefined
  }
  sendResponse({ok: true})
  return undefined
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'toukir-download-page') return
  // link clicks carry the link; video/image/page clicks use the page url —
  // on an instagram post page the page url IS the video url yt-dlp needs
  const target = info.linkUrl || info.srcUrl || info.pageUrl
  if (!target) return
  const protocolUrl = 'toukir://download?url=' + encodeURIComponent(target)

  // from the worker there is no page initiator, so chrome shows the plain
  // prompt each time. after the user picks an action the throwaway tab is
  // closed so nothing blank lingers.
  chrome.tabs.create({url: protocolUrl, active: false}, created => {
    if (created?.id !== undefined) {
      const tabId = created.id
      setTimeout(() => chrome.tabs.remove(tabId).catch(() => {}), 4000)
    }
  })
  void tab
})
