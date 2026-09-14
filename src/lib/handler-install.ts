import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// registers the `toukir://` url protocol with the os so that opening
//   toukir://download?url=…
// launches `toukir "<that url>"` in a visible terminal window. hkcu/desktop
// entries only — never needs admin rights. idempotent: re-running overwrites.

export type SetupResult = {ok: boolean; message: string}

const PROTOCOL = 'toukir'

/** What `toukir setup` will do on this platform. `null` = unsupported. */
export function supportedPlatform(): 'windows' | 'linux' | null {
  if (process.platform === 'win32') return 'windows'
  if (process.platform === 'linux') return 'linux'
  return null
}

/** Resolve how `toukir` is invoked on this machine — the global install, the local bin shim, or a bare name. */
export function toukirCommand(): {command: string; args: string[]} {
  // process.execPath = node, argv[1] = the cli entry script. only trust
  // argv[1] when it is a plain js file node can execute directly — in dev
  // (tsx) argv[1] is src/cli.tsx, which `node` cannot run
  const entry = process.argv[1]
  if (entry && /\.[cm]?js$/i.test(entry) && fs.existsSync(entry)) {
    // a real node entry: run it explicitly so a missing PATH entry can't break the handler
    return {command: process.execPath, args: [entry]}
  }
  return {command: 'toukir', args: []}
}

function run(command: string, args: string[]): {ok: boolean; stderr?: string} {
  // never shell — reg data contains quotes and &, which cmd.exe would eat.
  // node escapes argv itself; reg.exe parses via CommandLineToArgvW so the
  // value arrives intact.
  const result = spawnSync(command, args, {stdio: 'pipe'})
  if (result.status === 0) return {ok: true}
  return {ok: false, stderr: result.stderr?.toString().trim() || `exit code ${result.status ?? 'unknown'}`}
}

function setupWindows(): SetupResult {
  const key = `HKCU\\Software\\Classes\\${PROTOCOL}`
  const cmdKey = `${key}\\shell\\open\\command`

  const {command, args} = toukirCommand()
  // %1 is the toukir:// url the browser hands over. quote it; if toukir
  // exits nonzero (bad link, no network) `pause` keeps the window open so
  // the error is readable instead of a window flashing shut.
  const quoted = [command, ...args].map(part => (part.includes(' ') ? `"${part}"` : part)).join(' ')
  const inner = `${quoted} "%1"`
  const cmdLine = `cmd /s /c "${inner} & if errorlevel 1 pause"`

  const reg = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'reg.exe')
  const steps: Array<{what: string; run: () => {ok: boolean; stderr?: string}}> = [
    {what: 'protocol class', run: () => run(reg, ['add', key, '/ve', '/t', 'REG_SZ', '/d', `URL:${PROTOCOL} Protocol`, '/f'])},
    {what: 'url protocol flag', run: () => run(reg, ['add', key, '/v', 'URL Protocol', '/t', 'REG_SZ', '/d', '', '/f'])},
    {what: 'open command', run: () => run(reg, ['add', cmdKey, '/ve', '/t', 'REG_SZ', '/d', cmdLine, '/f'])},
  ]
  for (const step of steps) {
    const outcome = step.run()
    if (!outcome.ok) {
      return {ok: false, message: `could not register the ${step.what}: ${outcome.stderr ?? 'unknown error'}`}
    }
  }
  return {ok: true, message: `registered ${PROTOCOL}:// in the windows registry (HKCU) — browsers can now launch toukir`}
}

function setupLinux(): SetupResult {
  const appsDir = path.join(os.homedir(), '.local', 'share', 'applications')
  const desktopPath = path.join(appsDir, 'toukir.desktop')
  const {command, args} = toukirCommand()
  const exec = [...args].length > 0 ? `"${command}" ${args.map(a => `"${a}"`).join(' ')} %u` : `"${command}" %u`
  const desktop = [
    '[Desktop Entry]',
    'Type=Application',
    'Name=toukir',
    'Comment=Download a video with toukir',
    `Exec=${exec}`,
    `MimeType=x-scheme-handler/${PROTOCOL};`,
    'NoDisplay=true',
    '',
  ].join('\n')
  try {
    fs.mkdirSync(appsDir, {recursive: true})
    fs.writeFileSync(desktopPath, desktop)
  } catch (error) {
    return {ok: false, message: `could not write ${desktopPath}: ${error instanceof Error ? error.message : String(error)}`}
  }
  // make it the default handler for the scheme
  const xdg = run('xdg-mime', ['default', 'toukir.desktop', `x-scheme-handler/${PROTOCOL}`])
  if (!xdg.ok) {
    return {
      ok: true,
      message: `wrote ${desktopPath}, but xdg-mime failed (${xdg.stderr ?? 'unknown error'}) — run: xdg-mime default toukir.desktop x-scheme-handler/${PROTOCOL}`,
    }
  }
  return {ok: true, message: `registered ${PROTOCOL}:// via ${desktopPath} — browsers can now launch toukir`}
}

/** Register the protocol handler. Never throws — always returns a human-readable result. */
export function runSetup(): SetupResult {
  const platform = supportedPlatform()
  if (platform === 'windows') return setupWindows()
  if (platform === 'linux') return setupLinux()
  return {
    ok: false,
    message:
      'automatic protocol registration is not supported on this platform yet.\n' +
      'The browser extension still works without it — use `toukir <url>` directly.',
  }
}
