// the browser extension and protocol handler launch toukir as
//   toukir "toukir://download?url=https%3A%2F%2Fyoutu.be%2F..."
// windows %1-quoting mangles bare & in urls, so the real link always rides
// inside an encoded `url` query parameter

export type ParsedProtocolUrl =
  | {kind: 'protocol'; videoUrl: string}
  | {kind: 'setup'}
  | {kind: 'invalid'; reason: string}

const SUPPORTED_HOSTS = new Set(['download', 'setup'])

/** Turn a `toukir://…` string into the video URL it carries, or explain why it's unusable. */
export function parseProtocolUrl(raw: string): ParsedProtocolUrl {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return {kind: 'invalid', reason: 'not a parseable url'}
  }
  if (parsed.protocol !== 'toukir:') return {kind: 'invalid', reason: `unsupported protocol “${parsed.protocol}”`}

  // windows passes the whole handler string through untouched — accept both
  // toukir://download and toukir:download shapes
  const host = (parsed.hostname || parsed.host || raw.replace(/^toukir:/i, '').split('?')[0] || '').toLowerCase()
  if (!SUPPORTED_HOSTS.has(host)) {
    return {kind: 'invalid', reason: `unknown toukir action “${host}” — expected download or setup`}
  }
  if (host === 'setup') return {kind: 'setup'}

  const target = parsed.searchParams.get('url')
  if (!target) return {kind: 'invalid', reason: 'missing ?url= parameter'}
  let decoded: URL
  try {
    decoded = new URL(target)
  } catch {
    return {kind: 'invalid', reason: '?url= is not a valid link'}
  }
  if (decoded.protocol !== 'http:' && decoded.protocol !== 'https:') {
    return {kind: 'invalid', reason: '?url= must be an http(s) link'}
  }
  // some os/browser combos decode-once before the handler runs — if the
  // link arrived unencoded, its own & split the query and the tail is lost
  // (e.g. watch?v=abc&list=… loses &list=…). the raw search of a
  // non-special scheme like toukir: survives parsing verbatim, so take
  // everything after url= greedily, decode, and accept it only when it
  // parses as a strictly richer http(s) url than what searchParams saw.
  if (parsed.search.toLowerCase().startsWith('?url=')) {
    const candidate = decodeURIComponent(parsed.search.slice(5))
    if (candidate !== target) {
      try {
        const repaired = new URL(candidate)
        if (
          (repaired.protocol === 'http:' || repaired.protocol === 'https:') &&
          repaired.search.length > decoded.search.length
        ) {
          return {kind: 'protocol', videoUrl: repaired.toString()}
        }
      } catch {
        // candidate isn't a valid url — keep the searchParams result
      }
    }
  }
  return {kind: 'protocol', videoUrl: decoded.toString()}
}

/** True when the string is a toukir:// link (used by arg parsing before url validation). */
export function isProtocolUrl(raw: string): boolean {
  return /^toukir:/i.test(raw.trim())
}
