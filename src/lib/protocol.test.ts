import assert from 'node:assert/strict'
import test from 'node:test'
import {isProtocolUrl, parseProtocolUrl} from './protocol.js'

const VIDEO = 'https://youtu.be/dQw4w9WgXcQ'

test('unwraps a standard handler link to the video url', () => {
  const raw = `toukir://download?url=${encodeURIComponent(VIDEO)}`
  const parsed = parseProtocolUrl(raw)
  assert.equal(parsed.kind, 'protocol')
  if (parsed.kind === 'protocol') assert.equal(new URL(parsed.videoUrl).toString(), new URL(VIDEO).toString())
})

test('preserves query strings of the inner video url through the round-trip', () => {
  const inner = 'https://www.youtube.com/watch?v=abc123&t=30s'
  const parsed = parseProtocolUrl(`toukir://download?url=${encodeURIComponent(inner)}`)
  assert.equal(parsed.kind, 'protocol')
  if (parsed.kind === 'protocol') assert.ok(parsed.videoUrl.includes('v=abc123&t=30s'))
})

test('accepts the toukir:download shape without slashes', () => {
  const parsed = parseProtocolUrl(`toukir:download?url=${encodeURIComponent(VIDEO)}`)
  assert.equal(parsed.kind, 'protocol')
})

test('recognizes the setup action', () => {
  assert.equal(parseProtocolUrl('toukir://setup').kind, 'setup')
  assert.equal(parseProtocolUrl('toukir:setup').kind, 'setup')
})

test('recovers the tail params of an unencoded link that lost them to &-splitting', () => {
  // some os/browser combos decode-once before the handler fires; the inner
  // link's own & then splits the query. the raw-tail repair must restore it.
  const parsed = parseProtocolUrl('toukir://download?url=https://www.youtube.com/watch?v=abc&list=PL9&t=30')
  assert.equal(parsed.kind, 'protocol')
  if (parsed.kind === 'protocol') {
    const recovered = new URL(parsed.videoUrl)
    assert.equal(recovered.searchParams.get('v'), 'abc')
    assert.equal(recovered.searchParams.get('list'), 'PL9')
    assert.equal(recovered.searchParams.get('t'), '30')
  }
})

test('rejects non-toukir protocols', () => {
  const parsed = parseProtocolUrl(`https://youtu.be/x`)
  assert.equal(parsed.kind, 'invalid')
  if (parsed.kind === 'invalid') assert.match(parsed.reason, /unsupported protocol/)
})

test('rejects missing or bad ?url= parameter', () => {
  const missing = parseProtocolUrl('toukir://download')
  assert.equal(missing.kind, 'invalid')
  if (missing.kind === 'invalid') assert.match(missing.reason, /missing/)

  const garbage = parseProtocolUrl(`toukir://download?url=${encodeURIComponent('not a url')}`)
  assert.equal(garbage.kind, 'invalid')
  if (garbage.kind === 'invalid') assert.match(garbage.reason, /not a valid link/)
})

test('rejects non-http inner urls (file:, javascript:)', () => {
  const parsed = parseProtocolUrl(`toukir://download?url=${encodeURIComponent('file:///C:/Windows/system32')}`)
  assert.equal(parsed.kind, 'invalid')
  if (parsed.kind === 'invalid') assert.match(parsed.reason, /http\(s\)/)
})

test('rejects unknown actions', () => {
  const parsed = parseProtocolUrl('toukir://nonsense?url=x')
  assert.equal(parsed.kind, 'invalid')
  if (parsed.kind === 'invalid') assert.match(parsed.reason, /unknown toukir action/)
})

test('isProtocolUrl detects toukir links and nothing else', () => {
  assert.equal(isProtocolUrl('toukir://download?url=x'), true)
  assert.equal(isProtocolUrl('  TOUKIR:setup '), true)
  assert.equal(isProtocolUrl('https://youtu.be/x'), false)
  assert.equal(isProtocolUrl('toukiratou'), false)
})
