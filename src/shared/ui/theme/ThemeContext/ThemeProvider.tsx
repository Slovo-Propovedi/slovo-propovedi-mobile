import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Appearance, Platform, StatusBar as RNStatusBar, useColorScheme } from 'react-native'
import { updateCOLORS } from '../colors'
import {
  currentThemeAtom,
  dynamicColorsEnabledAtom,
  loadDynamicColors,
  loadThemeMode,
  setSystemTheme,
  themeModeAtom,
  updateThemeBasedOnMode,
} from '../model'
import { ThemeContext } from './themeContext'

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme] = useAtom(currentThemeAtom)
  const [themeMode] = useAtom(themeModeAtom)
  const [dynamicEnabled] = useAtom(dynamicColorsEnabledAtom)
  const systemTheme = useColorScheme()
  const ctx = useCtx()
  const setSystemThemeAction = useAction(setSystemTheme)
  const loadThemeModeAction = useAction(loadThemeMode)
  const loadDynamicColorsAction = useAction(loadDynamicColors)
  const updateThemeBasedOnModeAction = useAction(updateThemeBasedOnMode)

  const isLight = dynamicEnabled
    ? systemTheme === 'light'
    : themeMode === 'system'
      ? systemTheme === 'light'
      : themeMode === 'light'

  useEffect(() => {
    updateCOLORS(ctx)
  }, [currentTheme, ctx])

  useEffect(() => {
    void loadThemeModeAction()
    void loadDynamicColorsAction()
  }, [loadThemeModeAction, loadDynamicColorsAction])

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setSystemThemeAction(colorScheme as 'dark' | 'light')
    })
    return () => subscription.remove()
  }, [setSystemThemeAction])

  useEffect(() => {
    void updateThemeBasedOnModeAction()
  }, [themeMode, dynamicEnabled, systemTheme, updateThemeBasedOnModeAction])

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setTranslucent(true)
      RNStatusBar.setBackgroundColor('transparent')
    }
  }, [])

  useEffect(() => {
    // Feed the active theme into the CSS scrollbar vars declared in public/index.html.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const root = document.documentElement.style
    root.setProperty('--sp-scrollbar-thumb', String(currentTheme.textMuted))
    root.setProperty('--sp-scrollbar-thumb-hover', String(currentTheme.text))
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, isLight, themeMode }}>
      <StatusBar style='auto' />
      {children}
    </ThemeContext.Provider>
  )
}
