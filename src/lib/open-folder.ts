import {spawn} from 'node:child_process'
import path from 'node:path'

/**
 * Pure: the command + args that reveal a downloaded file in the OS file
 * manager. Windows selects the file itself; macOS reveals it via Finder;
 * Linux opens the containing folder (xdg-open has no "reveal" concept).
 * `undefined` = platform with no supported opener.
 */
export function openFolderCommand(
  filepath: string,
  platform: NodeJS.Platform = process.platform,
): {command: string; args: string[]} | undefined {
  if (platform === 'win32') return {command: 'explorer.exe', args: ['/select,', path.normalize(filepath)]}
  if (platform === 'darwin') return {command: 'open', args: ['-R', filepath]}
  if (platform === 'linux') return {command: 'xdg-open', args: [path.dirname(filepath)]}
  return undefined
}

/**
 * Reveal the file in the OS file manager. Fire-and-forget: spawning must
 * never block or crash the TUI, so spawn errors are swallowed silently —
 * the worst case is that nothing opens.
 */
export function openFolder(filepath: string): void {
  const cmd = openFolderCommand(filepath)
  if (!cmd) return
  try {
    const child = spawn(cmd.command, cmd.args, {detached: true, stdio: 'ignore'})
    // explorer.exe is allowed to exit non-zero on success; ignore everything
    child.on('error', () => {})
    child.unref()
  } catch {
    // never let a failed opener take down the app
  }
}
