import { useNavigation } from 'expo-router'
import { useEffect, useRef } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { useCollapsingNavbarDriver } from 'shared/ui/collapsing-navbar-driver'
import { COLORS, useTheme } from 'shared/ui/theme'
import type { SharedValue } from 'react-native-reanimated'

interface UsePlaylistHeaderProps {
  scrollY: SharedValue<number>
  title: string
  titleAppearThreshold: number
}

// Navbar bg darkens over the last 80px before the title-appear threshold (cover-screen darkening window).
const DARKEN_START_OFFSET = 80
const ICON_DARK_THRESHOLD = 0.7
const ICON_LIGHT_THRESHOLD = 0.4

export const usePlaylistHeader = ({
  scrollY,
  title,
  titleAppearThreshold,
}: UsePlaylistHeaderProps) => {
  const { currentTheme, isLight } = useTheme()

  // Bridge the plain-number threshold into SharedValues consumed by the shared driver.
  const threshold = useSharedValue(titleAppearThreshold)
  const darkenStart = useSharedValue(titleAppearThreshold - DARKEN_START_OFFSET)
  useEffect(() => {
    threshold.value = titleAppearThreshold
    darkenStart.value = titleAppearThreshold - DARKEN_START_OFFSET
  }, [titleAppearThreshold, threshold, darkenStart])

  const { headerBgOpacity } = useCollapsingNavbarDriver({ darkenStart, scrollY, threshold, title })

  const navigation = useNavigation()
  const iconModeRef = useRef<'cover' | 'header'>('cover')

  /* eslint-disable react-hooks/refs -- intentional: hysteresis state machine uses ref as mutable render-time state to avoid re-renders */
  if (iconModeRef.current === 'cover' && headerBgOpacity >= ICON_DARK_THRESHOLD)
    iconModeRef.current = 'header'
  else if (iconModeRef.current === 'header' && headerBgOpacity <= ICON_LIGHT_THRESHOLD)
    iconModeRef.current = 'cover'

  const iconMode = iconModeRef.current
  /* eslint-enable react-hooks/refs -- re-enabling after hysteresis ref block */

  const headerIconColor = iconMode === 'cover' ? COLORS.white : currentTheme.text
  const statusBarStyle: 'dark' | 'light' =
    iconMode === 'cover' ? 'light' : isLight ? 'dark' : 'light'

  useEffect(() => {
    navigation.setOptions({ headerTintColor: headerIconColor })
  }, [navigation, headerIconColor])

  return { headerBgOpacity, headerIconColor, statusBarStyle }
}
