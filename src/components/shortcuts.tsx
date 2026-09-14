import React, {type ReactNode} from 'react'
import {Box, Text} from 'ink'
import {useTheme} from '../theme.js'

/**
 * `leading` renders before the shortcut items, joined by the same `·`.
 * Wraps as one block on narrow terminals instead of ink hard-wrapping the
 * Text raw (which visually splits a `key + label` pair across rows).
 */
export function Shortcuts({items, leading}: {items: Array<[key: string, label: string]>; leading?: ReactNode}) {
  const theme = useTheme()
  return (
    <Box flexWrap="wrap" flexShrink={0} justifyContent="center">
      {leading ? (
        <>
          {leading}
          <Text color={theme.gray} dimColor={theme.dimSecondary}>{'  ·  '}</Text>
        </>
      ) : null}
      {items.map(([key, label], index) => (
        <Text key={`${key}-${label}`}>
          {index > 0 ? <Text color={theme.gray} dimColor={theme.dimSecondary}>{'  ·  '}</Text> : null}
          <Text color={theme.primary}>{key}</Text>
          <Text color={theme.gray} dimColor={theme.dimSecondary}> {label}</Text>
        </Text>
      ))}
    </Box>
  )
}
