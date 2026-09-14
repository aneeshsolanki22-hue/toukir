export type FriendlyError = {
  /** Short, plain-language summary — no jargon. */
  headline: string
  /** One concrete next step the user can actually take. */
  hint?: string
}

// Ordered: earlier rules win. `cleanYtDlpError` already stripped the
// `ERROR: [site]` prefix, so these match the bare message text.
const RULES: Array<{pattern: RegExp; headline: string; hint?: string}> = [
  {
    pattern: /sign in to confirm|private video|members-?only|login required|account/i,
    headline: 'this video needs an account or permission',
    hint: "Private, age-restricted, and members-only videos can't be downloaded. Try a public video.",
  },
  {
    pattern: /requested format is not available|no video formats/i,
    headline: "that format didn't work for this video",
    hint: "Choose a different resolution or the audio-only option, then press enter to try again.",
  },
  {
    // before the generic "not found" rule — "ffmpeg not found" is a tooling
    // problem, not a missing video
    pattern: /ffmpeg|ffprobe/i,
    headline: 'ffmpeg is needed for this choice',
    hint: 'High-res merges and mp3 conversion need ffmpeg — install it from ffmpeg.org, or pick a lower resolution or a different format.',
  },
  {
    pattern: /video unavailable|not available|removed by the uploader|has been removed|terminated|does not exist|404|not found/i,
    headline: "that video isn't available",
    hint: 'It may be deleted, private, or region-locked — check the link in your browser.',
  },
  {
    pattern: /unsupported url|is not a valid url|unable to extract/i,
    headline: "that link isn't supported",
    hint: 'This tool needs a direct link to a video. For every supported site, see the yt-dlp supported-sites list (github.com/yt-dlp/yt-dlp).',
  },
  {
    pattern: /http error 429|too many requests/i,
    headline: 'the site is asking you to slow down',
    hint: 'Too many requests came from your network — wait a minute, then try again.',
  },
  {
    pattern: /http error 403|forbidden|drm/i,
    headline: 'the site refused this download',
    hint: 'The video is likely protected or restricted. Try another video — or another format.',
  },
  {
    pattern: /enotfound|econnrefused|etimedout|econnreset|getaddrinfo|unable to download webpage|unable to connect/i,
    headline: "can't reach the site right now",
    hint: 'Check your internet connection, then try again.',
  },
  {
    pattern: /cancel/i,
    headline: 'download cancelled',
  },
]

export function friendlyError(raw: string): FriendlyError {
  const message = raw.trim()
  if (message) {
    for (const rule of RULES) {
      if (rule.pattern.test(message)) return {headline: rule.headline, hint: rule.hint}
    }
  }
  return {
    // Unknown error: the primary message stays plain (raw yt-dlp text is
    // jargon and must not be the headline). The real text still reaches the
    // user — the error screen shows it verbatim as `details:` below.
    headline: "couldn't download this video",
    hint: 'If it keeps failing, check that the link opens in your browser, then try again.',
  }
}
