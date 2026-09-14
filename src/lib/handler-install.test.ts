import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import {supportedPlatform, toukirCommand} from './handler-install.js'

test('platform support matches process.platform', () => {
  const expected = process.platform === 'win32' ? 'windows' : process.platform === 'linux' ? 'linux' : null
  assert.equal(supportedPlatform(), expected)
})

test('toukirCommand resolves to the running node + entry script when it exists', () => {
  const {command, args} = toukirCommand()
  const entry = process.argv[1]
  // only a plain .js/.cjs/.mjs entry is trusted — under tsx, argv[1] is
  // src/cli.tsx which node cannot execute, so the bare-name fallback applies
  const trusted = Boolean(entry && /\.[cm]?js$/i.test(entry) && fs.existsSync(entry))
  if (trusted) {
    assert.equal(command, process.execPath)
    assert.deepEqual(args, [entry])
  } else {
    assert.equal(command, 'toukir')
    assert.deepEqual(args, [])
  }
})
