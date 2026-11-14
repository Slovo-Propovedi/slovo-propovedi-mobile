import { ThemeProvider } from 'expo-router/react-navigation'
import { type PropsWithChildren, useMemo } from 'react'
import { buildNavigationTheme } from './navigationTheme'
import { useTheme } from './ThemeContext/useTheme'

/* Bridges the app theme into expo-router's vendored react-navigation fork (see shared/ui/theme/navigationTheme.ts). Mounted in app/_layout.tsx as <NavThemeProvider>. */
export const NavThemeProvider = ({ children }: PropsWithChildren) => {
  const { currentTheme, isLight } = useTheme()
  const theme = useMemo(() => buildNavigationTheme(isLight, currentTheme), [currentTheme, isLight])

  return <ThemeProvider value={theme}>{children}</ThemeProvider>
}
