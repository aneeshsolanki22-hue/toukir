import React, {createContext, type ReactNode, useContext} from 'react'

// one fixed palette — the dark gray theme. No modes, no switching.
export type Theme = {
  primary: string
  gray: string
  dark: string
  background: string
  dimSecondary: boolean
  inverseButton: boolean
}

export const theme: Theme = {
  primary: '#ffffff',
  gray: '#a1a1aa',
  dark: '#18181b',
  background: '#18181b',
  dimSecondary: false,
  inverseButton: false,
}

const ThemeContext = createContext<Theme>(theme)

export function ThemeProvider({children}: {children: ReactNode}) {
  return React.createElement(ThemeContext.Provider, {value: theme}, children)
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
