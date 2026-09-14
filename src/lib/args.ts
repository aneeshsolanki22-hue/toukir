import {isProtocolUrl, parseProtocolUrl} from './protocol.js'

export type CliArgs = {
  help: boolean
  version: boolean
  setup: boolean
  initialUrl?: string
  error?: string
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {help: false, version: false, setup: false}
  const positional: string[] = []

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === '-h' || arg === '--help') {
      result.help = true
    } else if (arg === '-v' || arg === '--version') {
      result.version = true
    } else if (arg === 'setup') {
      result.setup = true
    } else if (arg.startsWith('-')) {
      return {...result, error: `unknown option “${arg}”`}
    } else {
      positional.push(arg)
    }
  }

  if (result.setup && positional.length > 0) {
    return {...result, error: 'setup takes no arguments'}
  }

  // a toukir:// handler link carries the real video url inside ?url= —
  // unwrap it here so the rest of the app only ever sees plain urls
  if (positional.length === 1 && isProtocolUrl(positional[0]!)) {
    const parsed = parseProtocolUrl(positional[0]!)
    if (parsed.kind === 'invalid') return {...result, error: `invalid toukir link: ${parsed.reason}`}
    if (parsed.kind === 'setup') {
      result.setup = true
      result.initialUrl = undefined
      return result
    }
    positional[0] = parsed.videoUrl
  }

  if (positional.length > 1) return {...result, error: `got ${positional.length} urls — expected one`}
  result.initialUrl = positional[0]
  return result
}
