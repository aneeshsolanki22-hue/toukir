import assert from 'node:assert/strict'
import test from 'node:test'
import {friendlyError} from './errors.js'

test('maps common yt-dlp failures to plain-language headlines with a hint', () => {
  const cases: Array<[string, RegExp, RegExp]> = [
    ["Sign in to confirm you're not a bot", /needs an account|permission/, /public video/i],
    ['Video unavailable', /isn't available/, /browser/i],
    ['Unsupported URL', /isn't supported/, /supported-sites|link/i],
    ['ERROR: [youtube] abc: Requested format is not available', /format/, /picker|resolution/i],
    ['ffmpeg not found', /ffmpeg/, /ffmpeg\.org|different format/i],
    ['HTTP Error 429: Too Many Requests', /slow down/, /try again/i],
    ['getaddrinfo ENOTFOUND example.com', /can't reach/, /internet connection/i],
  ]
  for (const [raw, headline, hint] of cases) {
    const result = friendlyError(raw)
    assert.match(result.headline, headline, `headline for: ${raw}`)
    assert.match(result.hint ?? '', hint, `hint for: ${raw}`)
  }
})

test('unknown errors get a plain headline, not raw yt-dlp text, plus a next step', () => {
  const result = friendlyError('weird unexpected failure 42')
  assert.equal(result.headline, "couldn't download this video")
  assert.match(result.hint ?? '', /try again/i)
})

test('empty error falls back to a generic headline with a hint', () => {
  const result = friendlyError('')
  assert.match(result.headline, /couldn't download this video/)
  assert.match(result.hint ?? '', /try again/i)
})

test('cancelled downloads get a calm headline and no noisy hint', () => {
  const result = friendlyError('Download cancelled.')
  assert.match(result.headline, /cancelled/)
  assert.equal(result.hint, undefined)
})
