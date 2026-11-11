import { ThemeProvider } from 'expo-router/react-navigation'
import { type PropsWithChildren, useMemo } from 'react'
import { buildNavigationTheme, useTheme } from 'shared/ui/theme'

/* Bridges the app theme into expo-router's vendored react-navigation fork (see shared/ui/theme/navigationTheme.ts). Mounted in app/_layout.tsx under the app ThemeProvider. */
export const NavThemeProvider = ({ children }: PropsWithChildren) => {
  const { currentTheme, isLight } = useTheme()
  const theme = useMemo(() => buildNavigationTheme(isLight, currentTheme), [currentTheme, isLight])

  return <ThemeProvider value={theme}>{children}</ThemeProvider>
}
