import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {openFolderCommand} from './open-folder.js'

test('windows opens the containing folder via a plain path argument', () => {
  const cmd = openFolderCommand('C:/Users/u/Downloads/v.mp4', 'win32')!
  assert.equal(cmd.command, 'explorer.exe')
  // a plain folder path survives node's arg quoting for titles with spaces;
  // the /select,<file> variant breaks in that case and opens the wrong folder
  assert.deepEqual(cmd.args, ['C:\\Users\\u\\Downloads'])
})

test('macos reveals the file in finder', () => {
  assert.deepEqual(openFolderCommand('/Users/u/v.mp4', 'darwin'), {command: 'open', args: ['-R', '/Users/u/v.mp4']})
})

test('linux opens the containing folder', () => {
  const cmd = openFolderCommand('/home/u/v.mp4', 'linux')!
  assert.equal(cmd.command, 'xdg-open')
  assert.equal(cmd.args[0], path.dirname('/home/u/v.mp4'))
})

test('unsupported platforms get no command', () => {
  assert.equal(openFolderCommand('/x/v.mp4', 'sunos'), undefined)
  assert.equal(openFolderCommand('/x/v.mp4', 'aix'), undefined)
})
