import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Appearance, StatusBar as RNStatusBar } from 'react-native'
import { updateCOLORS } from '../colors'
import { LightTheme } from '../constants'
import {
  currentThemeAtom,
  loadThemeMode,
  setSystemTheme,
  themeModeAtom,
  updateThemeBasedOnMode,
} from '../model'
import { ThemeContext } from './themeContext'

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTheme] = useAtom(currentThemeAtom)
  const [themeMode] = useAtom(themeModeAtom)
  const ctx = useCtx()
  const setSystemThemeAction = useAction(setSystemTheme)
  const loadThemeModeAction = useAction(loadThemeMode)
  const updateThemeBasedOnModeAction = useAction(updateThemeBasedOnMode)
  const isLight = currentTheme.background === LightTheme.background

  useEffect(() => {
    updateCOLORS(ctx)
  }, [currentTheme, ctx])

  useEffect(() => {
    void loadThemeModeAction()
  }, [loadThemeModeAction])

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setSystemThemeAction(colorScheme as 'dark' | 'light')
    })
    return () => subscription.remove()
  }, [setSystemThemeAction])

  useEffect(() => {
    void updateThemeBasedOnModeAction()
  }, [themeMode, updateThemeBasedOnModeAction])

  useEffect(() => {
    RNStatusBar.setTranslucent(true)
    RNStatusBar.setBackgroundColor('transparent')
  }, [])

  return (
    <ThemeContext.Provider value={{ currentTheme, isLight, themeMode }}>
      <StatusBar style='auto' />
      {children}
    </ThemeContext.Provider>
  )
}
