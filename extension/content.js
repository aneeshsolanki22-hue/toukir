// Injects a "Download with toukir" button on YouTube watch and shorts pages.
// The button launches the toukir:// protocol url *from the page itself* —
// that initiator identity is what makes Chrome show the "always allow"
// checkbox, so the prompt becomes one-time per site.

const BUTTON_ID = 'toukir-download-button'
const STYLE_ID = 'toukir-button-style'
// each time the extension is (re)loaded, this script runs fresh in pages
// opened afterwards — but pages already open keep the OLD script alive with
// a dead extension context. stale buttons get tagged with the generation so
// a newer script can replace them.
const GENERATION = Date.now().toString(36)

// after an extension reload the old script's chrome.runtime dies — using it
// throws "Extension context invalidated"
function extensionAlive() {
  try {
    return Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}

// canonical watch url — works for yt-dlp and stays stable across yt's layout
function currentVideoUrl() {
  const videoId =
    (location.pathname === '/watch' && new URLSearchParams(location.search).get('v')) ||
    (location.pathname.startsWith('/shorts/') && location.pathname.split('/')[2]) ||
    (location.pathname.startsWith('/live/') && location.pathname.split('/')[2]) ||
    (location.hostname === 'youtu.be' && location.pathname.slice(1)) ||
    null
  if (!videoId) return null
  return `https://www.youtube.com/watch?v=${videoId}`
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${BUTTON_ID} {
      display: inline-flex; align-items: center; gap: 6px;
      margin-left: 8px; padding: 8px 14px;
      background: #e53935; color: #fff; border: none; border-radius: 18px;
      font: 500 14px/1 "Roboto", "YouTube Sans", sans-serif;
      cursor: pointer; vertical-align: middle;
    }
    #${BUTTON_ID}:hover { background: #c62828; }
    #${BUTTON_ID}.toukir-sent { opacity: .6; }
  `
  document.head.appendChild(style)
}

function findAnchorRow() {
  // below the video: the like/share row. falls back to the top-level actions
  // container on layout changes.
  return (
    document.querySelector('ytd-watch-metadata #actions, #actions ytd-menu-renderer') ||
    document.querySelector('ytd-watch-flexy #top-row')
  )
}

// the protocol handoff opens a throwaway tab that lingers blank — close it
// once the os dialog has appeared
function launchProtocolUrl(protocolUrl) {
  const w = window.open(protocolUrl, '_blank')
  if (w) setTimeout(() => w.close(), 2000)
}

// remove buttons left by an older script generation (e.g. after the
// extension was reloaded while this page was open)
function removeStaleButtons() {
  for (const stale of document.querySelectorAll(`#${BUTTON_ID}[data-generation]`)) {
    if (stale.dataset.generation !== GENERATION) stale.remove()
  }
}

function injectButton() {
  if (!extensionAlive()) {
    observer?.disconnect()
    return
  }
  removeStaleButtons()
  if (!currentVideoUrl()) return removeButton()
  const row = findAnchorRow()
  if (!row || document.getElementById(BUTTON_ID)) return

  ensureStyle()
  const button = document.createElement('button')
  button.id = BUTTON_ID
  button.dataset.generation = GENERATION
  button.textContent = '⬇ toukir'
  button.title = 'Download this video with toukir'
  button.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    if (!extensionAlive()) {
      // this button belongs to a dead script generation (extension was
      // reloaded) — a fresh one can't be injected from here, so tell the user
      button.remove()
      return
    }
    const url = currentVideoUrl()
    if (!url) return
    button.classList.add('toukir-sent')
    // the background worker only validates — the actual protocol launch
    // happens here, from the page, so chrome offers "always allow"
    try {
      chrome.runtime.sendMessage({type: 'toukir-download', url}, response => {
        const error = extensionAlive()
          ? chrome.runtime.lastError ?? (response && !response.ok ? response.error : null)
          : 'extension was reloaded — refresh this page'
        if (error) {
          button.classList.remove('toukir-sent')
          button.title = 'toukir: ' + error
          return
        }
        launchProtocolUrl('toukir://download?url=' + encodeURIComponent(url))
        button.title = 'sent to toukir ✓'
        setTimeout(() => {
          button.classList.remove('toukir-sent')
          button.title = 'Download this video with toukir'
        }, 1500)
      })
    } catch {
      // context died between the check and the send — clean up quietly
      button.remove()
    }
  })
  row.appendChild(button)
}

function removeButton() {
  document.getElementById(BUTTON_ID)?.remove()
}

// youtube is a single-page app — the url changes without a page load, so
// watch for navigation and re-check whether the button belongs. the observer
// fires on every yt dom change, so throttle to 500 ms. stops entirely once
// the extension context dies (script orphaned by a reload).
let scheduled = null
const observer = new MutationObserver(() => {
  if (!extensionAlive()) {
    observer.disconnect()
    return
  }
  if (scheduled) return
  scheduled = setTimeout(() => {
    scheduled = null
    injectButton()
  }, 500)
})
observer.observe(document.body, {childList: true, subtree: true})
injectButton()
