import assert from 'node:assert/strict'
import test from 'node:test'
import {buildChoices, type VideoInfo} from './ytdlp.js'

// Current YouTube payloads: progressive/adaptive itags carry `tbr` but no
// `filesize`/`filesize_approx`. Sizes must come from bitrate × duration, so
// every resolution gets its own honest estimate instead of all rows showing
// the audio track's size.
const youtubeLike: VideoInfo = {
  title: 'sample video',
  duration: 60,
  formats: [
    {format_id: '137', ext: 'mp4', vcodec: 'avc1.640028', acodec: 'none', height: 1080, tbr: 2646},
    {format_id: '136', ext: 'mp4', vcodec: 'avc1.64001f', acodec: 'none', height: 720, tbr: 1232},
    {format_id: '133', ext: 'mp4', vcodec: 'avc1.4d4015', acodec: 'none', height: 240, tbr: 294},
    {format_id: '251', ext: 'webm', vcodec: 'none', acodec: 'opus', abr: 160, tbr: 172},
  ],
}

test('estimates distinct sizes per resolution from bitrate × duration', () => {
  const labels = buildChoices(youtubeLike).map(choice => choice.label)

  // 2646 kbps over 60 s ≈ 19.4 MB video + 1.3 MB audio — formatBytes
  // rounds values ≥10 MB to whole numbers, so ~20.6 MB prints as 21 MB
  assert.match(labels[0]!, /1080p · mp4 · ~21 MB$/)
  // 294 kbps over 60 s ≈ 2.2 MB video + 1.3 MB audio — not the same as 1080p
  assert.match(labels[2]!, /240p · mp4 · ~3\.4 MB$/)
  // audio-only row: source audio stream, 172 kbps ≈ 1.3 MB
  assert.match(labels.at(-1)!, /audio only · mp3 · ~1\.3 MB$/)
})

test('prefers an exact filesize over estimates and never adds audio to muxed formats', () => {
  const info: VideoInfo = {
    title: 'muxed',
    duration: 60,
    formats: [
      // muxed format with an exact size — label must be that size alone
      {format_id: '18', ext: 'mp4', vcodec: 'avc1.42001E', acodec: 'mp4a.40.2', height: 360, tbr: 600, filesize: 4_500_000},
      {format_id: '251', ext: 'webm', vcodec: 'none', acodec: 'opus', abr: 160, tbr: 172},
    ],
  }
  const labels = buildChoices(info).map(choice => choice.label)

  // 4,500,000 bytes ≈ 4.3 MB — with audio (1.3 MB) added it would read ~5.6 MB
  assert.match(labels[0]!, /360p · mp4 · ~4\.3 MB$/)
})

test('shows no size label when the video size is unknowable, instead of faking one', () => {
  const info: VideoInfo = {
    title: 'no size info',
    formats: [
      // height but no filesize fields and no tbr and no duration: video size
      // cannot be estimated — the row must not show the audio size as total
      {format_id: '137', ext: 'mp4', vcodec: 'avc1.640028', acodec: 'none', height: 1080, tbr: 2646},
      {format_id: '251', ext: 'webm', vcodec: 'none', acodec: 'opus', abr: 160, tbr: 172, filesize_approx: 1_300_000},
    ],
  }
  const labels = buildChoices(info).map(choice => choice.label)

  assert.equal(labels[0], '1080p · mp4')
  assert.match(labels.at(-1)!, /audio only · mp3 · ~1\.2 MB$/)
})

test('prefers a sizeable format for the label without changing what downloads', () => {
  const info: VideoInfo = {
    title: 'scoring',
    duration: 60,
    formats: [
      // higher tbr but no size fields — loses the label slot to the sizeable one
      {format_id: '315', ext: 'webm', vcodec: 'vp9.2', acodec: 'none', height: 720, tbr: 3000},
      // lower tbr, mp4, exact size — wins the label
      {format_id: '136', ext: 'mp4', vcodec: 'avc1.64001f', acodec: 'none', height: 720, tbr: 1232, filesize: 9_000_000},
      {format_id: '251', ext: 'webm', vcodec: 'none', acodec: 'opus', abr: 160, tbr: 172},
    ],
  }
  const labels = buildChoices(info).map(choice => choice.label)

  // 9,000,000 bytes ≈ 8.6 MB
  assert.match(labels[0]!, /720p · mp4 · ~9\.8 MB$/)
})
