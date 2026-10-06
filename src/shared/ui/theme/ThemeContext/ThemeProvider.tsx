import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import * as NavigationBar from 'expo-navigation-bar'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Appearance, Platform, StatusBar as RNStatusBar, useColorScheme } from 'react-native'
import { reportError } from '../../../model/error-dialog'
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

const SPLASH_FADE_MS = 300

// The web splash shell (public/index.html, #sp-splash) sits next to #root and
// covers the app until React mounts. Fade it out, then drop it from the DOM so
// it stops intercepting pointer events.
const dismissWebSplash = () => {
  // Escape-key/modal tests install a partial `document` stub; only touch the DOM
  // when the real query API is present.
  if (typeof document.getElementById !== 'function') return

  const splash = document.getElementById('sp-splash')
  if (!splash) return

  splash.style.opacity = '0'
  setTimeout(() => splash.remove(), SPLASH_FADE_MS)
}

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
    if (Platform.OS !== 'android') return
    try {
      // Sync wrapper over a native AsyncFunction: a native rejection escapes this try-catch as an
      // unhandled rejection (acceptable — cosmetic call, no dialog/crash path on native)
      NavigationBar.setStyle(isLight ? 'dark' : 'light')
    } catch (error) {
      reportError(error, 'Не удалось настроить системную навигационную панель')
    }
  }, [isLight])

  useEffect(() => {
    // Feed the active theme into the CSS scrollbar vars declared in public/index.html.
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    const root = document.documentElement.style
    root.setProperty('--sp-scrollbar-thumb', String(currentTheme.textMuted))
    root.setProperty('--sp-scrollbar-thumb-hover', String(currentTheme.text))
    // Paint the overscroll/reset area (html/body) with the active theme so a dark
    // theme never flashes the static light fallback from public/index.html.
    const background = String(currentTheme.background)
    root.backgroundColor = background
    if (document.body) document.body.style.backgroundColor = background
    dismissWebSplash()
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, isLight, themeMode }}>
      <StatusBar style='auto' />
      {children}
    </ThemeContext.Provider>
  )
}
