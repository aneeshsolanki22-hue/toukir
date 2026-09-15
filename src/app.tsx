import React, {useCallback, useEffect, useRef, useState} from 'react'
import os from 'node:os'
import path from 'node:path'
import {Box, Text, useApp, useInput, useStdout} from 'ink'
import SelectInput, {type IndicatorProps, type ItemProps} from 'ink-select-input'
import Spinner from 'ink-spinner'
import {FramedInput} from './components/framed-input.js'
import {FullScreen} from './components/fullscreen.js'
import {Logo} from './components/logo.js'
import {Panel} from './components/panel.js'
import {ProgressBar} from './components/progress-bar.js'
import {Shortcuts} from './components/shortcuts.js'
import {TextInput} from './components/text-input.js'
import {clickTargetAt, findFrameRow, frameRowSpan, type ClickTarget} from './lib/click-map.js'
import {friendlyError} from './lib/errors.js'
import {formatBytes, formatDuration, formatEta, formatSpeed, shortenPath, truncate, wrapText} from './lib/format.js'
import {addToHistory, loadHistory} from './lib/history.js'
import {openFolder} from './lib/open-folder.js'
import {detectPlatform, isProbablyUrl, type Platform} from './lib/platforms.js'
import {useMouseClick} from './lib/use-mouse-click.js'
import {ThemeProvider, useTheme} from './theme.js'
import {
  buildChoices,
  download,
  ensureYtDlp,
  findFfmpeg,
  probe,
  type DownloadChoice,
  type DownloadProgress,
  type VideoInfo,
} from './lib/ytdlp.js'

const OUT_DIR = path.join(os.homedir(), 'Downloads')
// the input step checks the link and opens the quality picker — the download
// starts only after a quality is chosen. Name the stage, not the fantasy.
const DOWNLOAD_BUTTON = 'check link'
const CANCEL_BUTTON = 'cancel'
const DONE_LABEL = 'enter · download another'
const RETRY_LABEL = 'enter · try again'
const OPEN_FOLDER_LABEL = 'o · open folder'
const TAGLINE = 'paste a link, pick a quality, done.'

// one term for each concept (audit #1, #5): "setting up" = getting yt-dlp
// ready; "checking the link" = reading video info. The body line repeats the
// footer's status verbatim — two lines, one operation, so they can never
// disagree. `setup` is sticky on purpose: onStatus() must not wipe it.
const BODY_STATUS_SETUP = 'setting up — fetching yt-dlp, this can take ~30 seconds…'
const BODY_STATUS_PROBE = 'checking the link — your quality options will appear in a moment…'

const choiceLabel = (choice: DownloadChoice) => `${choice.kind === 'audio' ? '♪ ' : '▶ '}${choice.label}`

function ChoiceIndicator({isSelected}: IndicatorProps) {
  const theme = useTheme()
  return (
    <Box marginRight={1}>
      <Text color={theme.primary}>{isSelected ? '❯' : ' '}</Text>
    </Box>
  )
}

function ChoiceItem({isSelected, label, index}: ItemProps & {index?: number}) {
  const theme = useTheme()
  return (
    <Text color={isSelected ? theme.primary : theme.gray} bold={isSelected} dimColor={!isSelected && theme.dimSecondary}>
      {typeof index === 'number' ? `${index + 1}.  ${label}` : label}
    </Text>
  )
}

// the wide bordered button under the done and error screens. Purely
// presentational — clicks are hit-tested against the rendered frame in the app
export function BigButton({label}: {label: string}) {
  const theme = useTheme()
  return (
    <Box
      borderStyle="round"
      borderColor={theme.gray}
      borderDimColor={theme.dimSecondary}
      borderBackgroundColor={theme.background}
      paddingX={3}
    >
      <Text bold color={theme.primary}>{label}</Text>
    </Box>
  )
}

// explicit blank lines — empty <Box height={1}/> spacers can collapse, and
// ink boxes default to flexShrink=1, so spacers are the first thing yoga
// crushes when content overflows the terminal
const Gap = ({lines = 1}: {lines?: number}) => (
  <Box flexDirection="column" flexShrink={0}>
    {Array.from({length: lines}, (_, i) => (
      <Text key={i}> </Text>
    ))}
  </Box>
)

// fixed-width slots — the centered line must not change width as values tick,
// otherwise the whole layout shifts on every progress update
function partLabel(progress: DownloadProgress): string {
  // explains the bar resetting between files (video, then audio)
  return progress.totalParts > 1 ? `part ${progress.part + 1}/${progress.totalParts}  ` : ''
}

function downloadMeta(progress: DownloadProgress): string {
  const total = progress.totalBytes
  // when the size is known, the numbers read like a receipt — how much is
  // done and how much is left — not just an ever-changing rate
  const bytes = total
    ? `${formatBytes(progress.downloadedBytes)} / ${formatBytes(total)}`
    : formatBytes(progress.downloadedBytes)
  const speed = progress.speed ? formatSpeed(progress.speed) : ''
  const eta = progress.eta ? `${formatEta(progress.eta)} left` : ''
  return `${partLabel(progress)}${bytes.padStart(18)}  ${speed.padStart(10)}  ${eta.padEnd(12)}`
}

function indeterminateMeta(progress: DownloadProgress): string {
  const bytes = formatBytes(progress.downloadedBytes)
  const speed = progress.speed ? formatSpeed(progress.speed) : ''
  return `${partLabel(progress)}${bytes.padStart(18)}  ${speed.padEnd(10)}`
}

export type Outcome = {filepath?: string}

type Phase =
  | {name: 'input'; warning?: string}
  | {name: 'probing'; status: string; setup?: boolean}
  | {name: 'picking'}
  | {
      name: 'downloading'
      choice: DownloadChoice
      progress?: DownloadProgress
      processing: boolean
      refreshing?: boolean
    }
  | {name: 'done'; filepath: string}
  | {name: 'error'; message: string}

// key names are spelled out — "ctrl + c", never "^c" — so people who never
// learned terminal notation can read the footer. Keys double as click-target
// match text (see hintAction / clickTargets below), so keep them exact.
const HINTS: Record<Phase['name'], Array<[string, string]>> = {
  input: [
    ['enter', 'check link'],
    ['ctrl + c', 'quit'],
  ],
  probing: [
    ['esc', 'cancel'],
    ['ctrl + c', 'quit'],
  ],
  picking: [
    ['↑↓', 'move'],
    ['enter', 'download'],
    ['1–9', 'pick'],
    ['esc', 'back'],
    ['ctrl + c', 'quit'],
  ],
  downloading: [
    ['esc', 'cancel'],
    ['ctrl + c', 'quit'],
  ],
  done: [['o', 'open folder'], ['ctrl + c', 'quit']],
  error: [
    ['enter', 'try again'],
    ['ctrl + c', 'quit'],
  ],
}

type AppProps = {
  initialUrl?: string
  clipboardUrl?: string
  onOutcome: (outcome: Outcome) => void
}

export function App(props: AppProps) {
  return (
    <ThemeProvider>
      <AppContent {...props} />
    </ThemeProvider>
  )
}

function AppContent({
  initialUrl,
  clipboardUrl,
  onOutcome,
}: {
  initialUrl?: string
  clipboardUrl?: string
  onOutcome: (outcome: Outcome) => void
}) {
  const theme = useTheme()
  const {exit} = useApp()
  const {stdout} = useStdout()
  const [url, setUrl] = useState(initialUrl ?? '')
  const [urlInput, setUrlInput] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [platform, setPlatform] = useState<Platform>()
  const [info, setInfo] = useState<VideoInfo>()
  const [choices, setChoices] = useState<DownloadChoice[]>([])
  const ytdlpRef = useRef('')
  const highlightRef = useRef(0) // choice under the cursor, for the enter hint click
  const infoJsonRef = useRef<string | undefined>(undefined)
  const abortRef = useRef<AbortController | undefined>(undefined)
  // last successfully downloaded file — the done screen's "open folder"
  // action needs it even when phase state has already moved on
  const lastFilepathRef = useRef<string | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>(
    initialUrl ? {name: 'probing', status: BODY_STATUS_SETUP, setup: true} : {name: 'input'},
  )
  const columns = stdout?.columns && stdout.columns > 0 ? stdout.columns : 80
  const boxWidth = Math.max(14, Math.min(64, columns - 6))
  const contentWidth = Math.max(10, Math.min(columns - 4, 78))

  const startProbe = useCallback(async (targetUrl: string) => {
    const controller = new AbortController()
    abortRef.current = controller
    setPlatform(detectPlatform(targetUrl))
    setPhase({name: 'probing', status: BODY_STATUS_SETUP, setup: true})
    try {
      const ytdlp =
        ytdlpRef.current ||
        (await ensureYtDlp(status => {
          if (status.startsWith('setting up')) {
            setPhase({name: 'probing', status, setup: true})
          } else {
            setPhase(prev =>
              prev.name === 'probing' && prev.setup
                ? {...prev, status}
                : {name: 'probing', status},
            )
          }
        }, controller.signal))
      ytdlpRef.current = ytdlp
      if (controller.signal.aborted) return
      setPhase({name: 'probing', status: BODY_STATUS_PROBE})
      const {info: videoInfo, infoJsonPath} = await probe(ytdlp, targetUrl, controller.signal)
      if (controller.signal.aborted) return
      infoJsonRef.current = infoJsonPath
      setInfo(videoInfo)
      setChoices(buildChoices(videoInfo))
      highlightRef.current = 0
      setPhase({name: 'picking'})
    } catch (error) {
      if (controller.signal.aborted) return
      setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
    }
  }, [])

  useEffect(() => {
    if (initialUrl) void startProbe(initialUrl)
  }, [initialUrl, startProbe])

  const resetToInput = useCallback(() => {
    setUrl('')
    setUrlInput('')
    setPlatform(undefined)
    setInfo(undefined)
    setChoices([])
    setPhase({name: 'input'})
  }, [])

  const cancelRun = useCallback(() => {
    abortRef.current?.abort()
    resetToInput()
    setUrlInput(url) // keep the link around so a cancel isn't destructive
  }, [resetToInput, url])

  useInput(
    (input, key) => {
      if (key.escape && (phase.name === 'picking' || phase.name === 'error' || phase.name === 'done')) resetToInput()
      if (key.escape && (phase.name === 'probing' || phase.name === 'downloading')) cancelRun()
      if (key.return && (phase.name === 'error' || phase.name === 'done')) resetToInput()
      // reveal the finished file in the file manager (no modifier, no chording)
      if (input === 'o' && phase.name === 'done' && lastFilepathRef.current) openFolder(lastFilepathRef.current)
      // number keys 1–9 jump straight to a format, matching the hints
      if (
        phase.name === 'picking' &&
        !key.ctrl &&
        !key.meta &&
        !key.shift &&
        /^[1-9]$/.test(input) &&
        Number(input) <= choices.length
      ) {
        handlePick({value: Number(input) - 1})
        return
  }
    },
    {isActive: Boolean(process.stdin.isTTY)},
  )

  const handleUrlSubmit = (value: string) => {
    let trimmed = value.trim()
    // forgive the common slip of pasting "youtube.com/…" without the scheme
    if (trimmed && !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`
    if (!isProbablyUrl(trimmed)) {
      // say what actually failed (scheme-less hosts like "youtube.com/…" are
      // fixed up automatically) and give an example instead of a rule
      setPhase({name: 'input', warning: "that doesn't look like a link — try something like youtube.com/watch?v=…"})
      return
    }
    setUrl(trimmed)
    void startProbe(trimmed)
  }

  const clipboardOffered = Boolean(clipboardUrl) && urlInput === ''
  const clipboardAccepted = Boolean(clipboardUrl) && urlInput === clipboardUrl

  const handlePick = (item: {value: number}) => {
    const choice = choices[item.value]
    const controller = new AbortController()
    abortRef.current = controller
    setPhase({name: 'downloading', choice, processing: false})
    void (async () => {
      const handlers = {
        onProgress: (progress: DownloadProgress) =>
          setPhase(prev => (prev.name === 'downloading' ? {...prev, progress, processing: false} : prev)),
        onProcessing: () =>
          setPhase(prev => (prev.name === 'downloading' ? {...prev, processing: true} : prev)),
      }
      try {
        const ffmpegLocation = await findFfmpeg()
        const base = {ytdlp: ytdlpRef.current, ffmpegLocation, url, choice, outDir: OUT_DIR}
        let filepath: string
        try {
          // reuse the probe's metadata — starts immediately instead of re-extracting
          filepath = await download({...base, infoJsonPath: infoJsonRef.current}, handlers, controller.signal)
        } catch (error) {
          if (controller.signal.aborted) throw error
          // media urls in the cached info can expire — retry with a fresh extraction
          setPhase(prev =>
            prev.name === 'downloading' ? {...prev, progress: undefined, refreshing: true} : prev,
          )
          filepath = await download(base, handlers, controller.signal)
        }
        onOutcome({filepath})
        lastFilepathRef.current = filepath
        setHistory(addToHistory(url))
        setPhase({name: 'done', filepath})
      } catch (error) {
        if (controller.signal.aborted) return
        setPhase({name: 'error', message: error instanceof Error ? error.message : String(error)})
      }
    })()
  }

  let hints: Array<[string, string]> = [...HINTS[phase.name]]
  if (phase.name === 'input' && history.length > 0) {
    hints = [hints[0]!, ['↑', 'history'], ...hints.slice(1)]
  }

  // the error screen gets a translated, plain-language version of the message
  const friendly = phase.name === 'error' ? friendlyError(phase.message) : undefined

  // Anything a mouse user would expect to press is clickable. Targets are
  // found by their text in the rendered frame (see lib/click-map.ts), so
  // there is no layout math to keep in sync.
  const hintAction = (key: string): (() => void) | undefined => {
    if (key === 'ctrl + c') return () => exit()
    if (key === 'esc') return phase.name === 'probing' || phase.name === 'downloading' ? cancelRun : resetToInput
    if (key === 'o') return phase.name === 'done' && lastFilepathRef.current ? () => openFolder(lastFilepathRef.current!) : undefined
    if (key === 'enter') {
      if (phase.name === 'input') return () => handleUrlSubmit(urlInput)
      if (phase.name === 'picking') return () => handlePick({value: highlightRef.current})
      if (phase.name === 'error' || phase.name === 'done') return resetToInput
    }
    return undefined // ↑↓ / ↑ stay keyboard-only
  }
  const clickTargets: ClickTarget[] = []
  if (phase.name === 'input') {
    // the frame button rows above/below the label are part of the button
    clickTargets.push({match: `  ${DOWNLOAD_BUTTON}  `, padY: 1, action: () => handleUrlSubmit(urlInput)})
  }
  if (phase.name === 'picking') {
    for (const [index, choice] of choices.entries()) {
      // the rendered row is "1.  ▶ 1080p · mp4 …" — click on any of it
      clickTargets.push({match: choiceLabel(choice), padX: 4, action: () => handlePick({value: index})})
    }
  }
  if (phase.name === 'probing') {
    // logo → home, and the framed link itself cancels (like pressing esc)
    clickTargets.push({match: url, padX: 1, padY: 1, action: cancelRun})
  }
  if (phase.name === 'done') {
    clickTargets.push({match: DONE_LABEL, padX: 4, padY: 1, action: resetToInput})
    // clicking the file path or the open-folder hint reveals it in the file manager
    if (lastFilepathRef.current) {
      clickTargets.push({match: shortenPath(lastFilepathRef.current, os.homedir(), 60), action: () => openFolder(lastFilepathRef.current!)})
      clickTargets.push({match: OPEN_FOLDER_LABEL, action: () => openFolder(lastFilepathRef.current!)})
    }
  }
  if (phase.name === 'error') {
    // the big retry button — same action as the footer's enter hint
    clickTargets.push({match: RETRY_LABEL, padX: 4, padY: 1, action: resetToInput})
  }
  for (const [key, label] of hints) {
    const action = hintAction(key)
    if (action) clickTargets.push({match: `${key} ${label}`, action})
  }

  useMouseClick(
    (x, y) => {
      // the logo takes you home — it's the 3 rows one gap above the tagline
      const taglineRow = findFrameRow(TAGLINE)
      if (taglineRow > 3 && y - 1 >= taglineRow - 4 && y - 1 <= taglineRow - 2) {
        const span = frameRowSpan(y - 1)
        if (span && x >= span[0] - 1 && x <= span[1] + 1) {
          if (phase.name === 'probing' || phase.name === 'downloading') cancelRun()
          else if (phase.name !== 'input') resetToInput()
          return
        }
      }
      clickTargetAt(x, y, clickTargets)?.action()
    },
    Boolean(process.stdin.isTTY),
  )

  return (
    <FullScreen>
      <Logo />
      <Gap />
      <Text bold color={theme.primary}>{TAGLINE}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>youtube · x · instagram · threads · tiktok · +1800 more sites</Text>
      <Gap />

      {phase.name === 'input' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title="Paste a video link" width={boxWidth} button={DOWNLOAD_BUTTON}>
            <TextInput
              value={urlInput}
              onChange={setUrlInput}
              onSubmit={handleUrlSubmit}
              placeholder="https://youtube.com/watch?v=…"
              width={boxWidth - 6}
              history={history}
              submitOnPaste={isProbablyUrl}
              onTab={() => {
                if (clipboardOffered) setUrlInput(clipboardUrl!)
              }}
            />
          </FramedInput>
          {phase.warning ? (
            // validation must stand out from helper text, not fade below it
            <Text bold color={theme.primary}>✗ {phase.warning}</Text>
          ) : clipboardOffered ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>a link is already in your clipboard — press tab to use it</Text>
          ) : clipboardAccepted ? (
            <Text color={theme.gray} dimColor={theme.dimSecondary}>pulled from your clipboard — press enter to check it</Text>
          ) : null}
        </Box>
      )}

      {phase.name === 'probing' && (
        <Box flexDirection="column" alignItems="center">
          <FramedInput title={platform ? platform.label : 'link'} width={boxWidth} button={CANCEL_BUTTON} buttonDim>
            <Text color={theme.gray} dimColor={theme.dimSecondary}>{url.length > boxWidth - 8 ? `${url.slice(0, boxWidth - 9)}…` : url}</Text>
          </FramedInput>
          <Gap lines={1} />
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {phase.setup ? BODY_STATUS_SETUP : BODY_STATUS_PROBE}
          </Text>
        </Box>
      )}

      {phase.name === 'picking' && platform && (
        <Box width={contentWidth}>
          <Box flexDirection="column" flexGrow={1} flexBasis={0} paddingTop={1} paddingRight={3}>
            {/* wrapped by hand so continuation lines stay flush left —
                ink's wrapping keeps the break's space as a 1-cell indent */}
            {wrapText(info?.title ?? '', Math.max(10, contentWidth - 41)).map((line, index) => (
              <Text key={index} bold color={theme.primary}>
                {line}
              </Text>
            ))}
            <Gap />
            <Text color={theme.gray} dimColor={theme.dimSecondary}>
              ▸ {platform.label}
              {info?.duration ? ` · ${formatDuration(info.duration)}` : ''}
              {info?.uploader ? ` · ${info.uploader}` : ''}
            </Text>
            <Gap />
            {/* keys are already in the footer — this line only adds what the
                list can't show: that audio-only sits below the videos */}
            <Text color={theme.gray} dimColor={theme.dimSecondary}>audio only · mp3 is at the bottom of the list</Text>
          </Box>
          <Panel title="Download" width={38}>
            <SelectInput
              indicatorComponent={ChoiceIndicator}
              itemComponent={ChoiceItem}
              items={choices.map((choice, index) => ({
                key: String(index),
                label: choiceLabel(choice),
                value: index,
                index,
              }))}
              onSelect={handlePick}
              onHighlight={item => (highlightRef.current = item.value)}
            />
          </Panel>
        </Box>
      )}

      {phase.name === 'downloading' && (
        <Box flexDirection="column" alignItems="center">
          <Text color={theme.gray} dimColor={theme.dimSecondary}>
            {info?.title ? `${truncate(info.title, 42)} · ` : ''}
            {phase.choice.label}
          </Text>
          <Gap />
          {/* every branch is exactly three rows — bar, gap, meta — so the layout never jumps */}
          {phase.processing ? (
            <>
              {/* a full bar would claim the merge is done — spin instead */}
              <ProgressBar percent={1} hide />
              <Gap />
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> almost done — finishing the file, don't close the terminal…</Text>
              </Text>
            </>
          ) : phase.progress?.totalBytes ? (
            <>
              <ProgressBar percent={phase.progress.downloadedBytes / phase.progress.totalBytes} />
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{downloadMeta(phase.progress)}</Text>
            </>
          ) : phase.progress ? (
            <>
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}> downloading…</Text>
              </Text>
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>{indeterminateMeta(phase.progress)}</Text>
            </>
          ) : (
            <>
              <ProgressBar percent={0} />
              <Gap />
              <Text>
                <Text color={theme.primary}>
                  <Spinner type="dots" />
                </Text>
                <Text color={theme.gray} dimColor={theme.dimSecondary}>
                  {phase.refreshing
                    ? ' the link expired — grabbing a fresh one, hang on…'
                    : ' connecting — starting the download…'}
                </Text>
              </Text>
            </>
          )}
        </Box>
      )}

      {phase.name === 'done' && (
        <Box flexDirection="column" alignItems="center">
          <Text bold color={theme.primary}>✓ saved</Text>
          <Gap lines={1} />
          <Text color={theme.primary}>{shortenPath(phase.filepath, os.homedir(), 60)}</Text>
          <Gap lines={2} />
          <BigButton label={DONE_LABEL} />
        </Box>
      )}

      {phase.name === 'error' && friendly && (
        <Box flexDirection="column" alignItems="center" width={Math.max(10, Math.min(columns - 6, 72))}>
          <Text bold color={theme.primary}>✗ {friendly.headline}</Text>
          {friendly.hint ? (
            <>
              <Gap />
              {wrapText(friendly.hint, Math.max(10, Math.min(columns - 8, 70))).map((line, index) => (
                <Text key={index} color={theme.gray} dimColor={theme.dimSecondary}>
                  {line}
                </Text>
              ))}
            </>
          ) : null}
          {phase.message.trim() && phase.message.trim() !== friendly.headline ? (
            <>
              <Gap />
              <Text color={theme.gray} dimColor={theme.dimSecondary}>details: {truncate(phase.message.trim(), 80)}</Text>
            </>
          ) : null}
          <Gap lines={2} />
          <BigButton label={RETRY_LABEL} />
        </Box>
      )}

      {hints.length > 0 ? (
        <>
          {/* hints wrap on narrow terminals — reserve their rows so the
              whole layout doesn't shift every frame when items fold */}
          <Gap lines={2} />
          <Box flexShrink={0} minHeight={2}>
            <Shortcuts
              items={hints}
              leading={
                phase.name === 'probing' ? (
                  <Text>
                    <Text color={theme.primary}>
                      <Spinner type="dots" />
                    </Text>
                    <Text color={theme.gray} dimColor={theme.dimSecondary}> {phase.status}</Text>
                  </Text>
                ) : undefined
              }
            />
          </Box>
        </>
      ) : null}
    </FullScreen>
  )
}
