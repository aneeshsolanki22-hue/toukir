import assert from 'node:assert/strict'
import test from 'node:test'
import {parseArgs} from './args.js'

test('parses a url without confusing it for an option', () => {
  assert.deepEqual(parseArgs(['https://example.com/video']), {
    help: false,
    version: false,
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
