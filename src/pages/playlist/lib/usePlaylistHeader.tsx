import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { COLORS, useTheme } from 'shared/ui/themed'
import type { SharedValue } from 'react-native-reanimated'

interface UsePlaylistHeaderProps {
  scrollY: SharedValue<number>
  title: string
  titleAppearThreshold: number
}

export const usePlaylistHeader = ({
  scrollY,
  title,
  titleAppearThreshold,
}: UsePlaylistHeaderProps) => {
  const navigation = useNavigation()
  const [headerBgOpacity, setHeaderBgOpacity] = useState(0)
  const { currentTheme, isLight } = useTheme()
  const DARKEN_START_OFFSET = 80
  const ICON_DARK_THRESHOLD = 0.7
  const ICON_LIGHT_THRESHOLD = 0.4

  const updateHeaderTitle = useCallback(
    (shouldShowTitle: boolean) => {
      navigation.setOptions({
        headerTitle: shouldShowTitle ? title : '',
      })
    },
    [navigation, title],
  )

  const wasAboveThreshold = useSharedValue<boolean | null>(null)

  useDerivedValue(() => {
    const opacity = interpolate(
      scrollY.value,
      [titleAppearThreshold - DARKEN_START_OFFSET, titleAppearThreshold],
      [0, 1],
      'clamp',
    )
    scheduleOnRN(setHeaderBgOpacity, opacity)
    const crossed = scrollY.value > titleAppearThreshold
    if (wasAboveThreshold.value !== crossed) {
      wasAboveThreshold.value = crossed
      scheduleOnRN(updateHeaderTitle, crossed)
    }
  }, [scrollY, titleAppearThreshold, updateHeaderTitle])

  // Re-apply title when the title prop changes (the transition guard would otherwise skip it)
  useEffect(() => {
    wasAboveThreshold.value = null
  }, [title])

  const iconModeRef = useRef<'cover' | 'header'>('cover')

  // Hysteresis logic: different thresholds for icon mode transitions prevent flickering
  if (iconModeRef.current === 'cover' && headerBgOpacity >= ICON_DARK_THRESHOLD)
    iconModeRef.current = 'header'
  else if (iconModeRef.current === 'header' && headerBgOpacity <= ICON_LIGHT_THRESHOLD)
    iconModeRef.current = 'cover'

  const iconMode = iconModeRef.current

  const headerIconColor = iconMode === 'cover' ? COLORS.white : currentTheme.text
  const statusBarStyle: 'dark' | 'light' =
    iconMode === 'cover' ? 'light' : isLight ? 'dark' : 'light'

  const headerBackground = useMemo(() => {
    const innerStyle = StyleSheet.create({
      bg: {
        backgroundColor: currentTheme.background,
        flex: 1,
        opacity: headerBgOpacity,
      },
    })
    return () => <View style={innerStyle.bg} />
  }, [headerBgOpacity, currentTheme.background])

  useEffect(() => {
    navigation.setOptions({ headerBackground })
    return () => {
      navigation.setOptions({ headerBackground: undefined })
    }
  }, [navigation, headerBackground])

  useEffect(() => {
    navigation.setOptions({ headerTintColor: headerIconColor })
  }, [navigation, headerIconColor])

  return { headerBgOpacity, headerIconColor, statusBarStyle }
}
