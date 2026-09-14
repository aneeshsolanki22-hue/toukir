import React, {type ReactNode} from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * A bordered panel with the title on the top border, sized to its content:
 * the top line is drawn by hand (ink borders can't embed titles), the
 * sides and bottom come from ink with borderTop disabled.
 * Over-long titles are truncated so the top border can't overrun the box.
 */
const titleWithin = (title: string, inner: number) => {
  const room = Math.max(0, inner - 5)
  return title.length <= room ? title : `${title.slice(0, Math.max(1, room - 1))}…`
}
export function Panel({title, width, children}: {title: string; width: number; children: ReactNode}) {
  const theme = useTheme()
  const inner = width - 2
  const shownTitle = titleWithin(title, inner)
  const tail = Math.max(0, inner - shownTitle.length - 3)
  return (
    <Box flexDirection="column" width={width}>
      <Text>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{'╭─ '}</Text>
        <Text color={theme.primary}>{shownTitle}</Text>
        <Text color={theme.gray} dimColor={theme.dimSecondary}>{` ${'─'.repeat(tail)}╮`}</Text>
      </Text>
      <Box
        width={width}
        borderStyle="round"
        borderColor={theme.gray}
        borderDimColor={theme.dimSecondary}
        borderBackgroundColor={theme.background}
        borderTop={false}
        flexDirection="column"
        paddingX={2}
      >
        {children}
      </Box>
    </Box>
  )
}
