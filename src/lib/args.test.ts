import assert from 'node:assert/strict'
import test from 'node:test'
import {parseArgs} from './args.js'

test('parses a url without confusing it for an option', () => {
  assert.deepEqual(parseArgs(['https://example.com/video']), {
    help: false,
    version: false,
    setup: false,
    initialUrl: 'https://example.com/video',
  })
})

test('rejects missing, invalid, and unknown options', () => {
  // --theme used to be a valid flag; now it must be rejected like any other
  assert.match(parseArgs(['--theme', 'sepia']).error ?? '', /unknown option/)
  assert.match(parseArgs(['--wat']).error ?? '', /unknown option/)
  assert.match(parseArgs(['one', 'two']).error ?? '', /expected one/)
})

test('recognizes -h and -v flags', () => {
  assert.equal(parseArgs(['-h']).help, true)
  assert.equal(parseArgs(['--help']).help, true)
  assert.equal(parseArgs(['-v']).version, true)
  assert.equal(parseArgs(['--version']).version, true)
})

test('parses the setup subcommand and rejects it with arguments', () => {
  assert.deepEqual(parseArgs(['setup']), {help: false, version: false, setup: true, initialUrl: undefined})
  assert.match(parseArgs(['setup', 'extra']).error ?? '', /setup takes no arguments/)
})

test('unwraps a toukir:// handler link into the video url', () => {
  const inner = 'https://www.youtube.com/watch?v=abc123'
  const result = parseArgs([`toukir://download?url=${encodeURIComponent(inner)}`])
  assert.equal(result.error, undefined)
  assert.equal(new URL(result.initialUrl ?? '').toString(), new URL(inner).toString())
  assert.equal(result.setup, false)
})

test('toukir://setup launches the setup flow', () => {
  const result = parseArgs(['toukir://setup'])
  assert.equal(result.setup, true)
  assert.equal(result.initialUrl, undefined)
})

test('rejects malformed toukir:// links with a reason', () => {
  const result = parseArgs(['toukir://download'])
  assert.match(result.error ?? '', /invalid toukir link/)
})
