import {spawn} from 'node:child_process'
import path from 'node:path'

/**
 * Pure: the command + args that open the folder containing a downloaded file.
 * Windows: explorer accepts a quoted plain path argument, which works even
 * when the path has spaces. (The `/select,<file>` variant would also highlight
 * the file, but explorer's parsing of it breaks through Node's arg quoting
 * whenever the title contains spaces — it silently opens Documents instead.
 * Verified against a real download, so the folder is opened unselected.)
 * macOS reveals the file via Finder; Linux opens the containing folder.
 * `undefined` = platform with no supported opener.
 */
export function openFolderCommand(
  filepath: string,
  platform: NodeJS.Platform = process.platform,
): {command: string; args: string[]} | undefined {
  if (platform === 'win32') {
    // win32-specific path helpers — the host may be linux/mac (CI), where
    // path.normalize/dirname would mangle drive-letter paths
    const p = path.win32.normalize(filepath)
    return {command: 'explorer.exe', args: [path.win32.dirname(p)]}
  }
  if (platform === 'darwin') return {command: 'open', args: ['-R', filepath]}
  if (platform === 'linux') return {command: 'xdg-open', args: [path.posix.dirname(filepath)]}
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
