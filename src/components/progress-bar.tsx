import React from 'react'
import {Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * `hide` reserves the component's layout row (blank) instead of drawing a
 * bar. Used where the honest state is a spinner, not a bar — e.g. yt-dlp's
 * post-processing, which has no percent: a full bar there claims done.
 */
export function ProgressBar({percent, width = 30, hide = false}: {percent: number; width?: number; hide?: boolean}) {
  const theme = useTheme()
  if (hide) return <Text> </Text>
  const clamped = Math.max(0, Math.min(1, percent))
  const filled = Math.round(clamped * width)
  return (
    <Text>
      <Text color={theme.primary}>{'█'.repeat(filled)}</Text>
      <Text color={theme.gray} dimColor={theme.dimSecondary}>{'░'.repeat(width - filled)}</Text>
      {/* fixed-width percent — "5%" vs "100%" must not change the line width */}
      <Text color={theme.primary}> {`${Math.round(clamped * 100)}%`.padStart(4)}</Text>
    </Text>
  )
}
