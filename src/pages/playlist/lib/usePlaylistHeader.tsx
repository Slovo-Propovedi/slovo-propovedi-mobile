import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, runOnJS, useDerivedValue } from 'react-native-reanimated'
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

  useDerivedValue(() => {
    const opacity = interpolate(
      scrollY.value,
      [titleAppearThreshold - DARKEN_START_OFFSET, titleAppearThreshold],
      [0, 1],
      'clamp',
    )
    runOnJS(setHeaderBgOpacity)(opacity)
    runOnJS(updateHeaderTitle)(scrollY.value > titleAppearThreshold)
  }, [scrollY, titleAppearThreshold, updateHeaderTitle])

  const [iconMode, setIconMode] = useState<'cover' | 'header'>('cover')
  const iconModeRef = useRef(iconMode)
  iconModeRef.current = iconMode

  useEffect(() => {
    if (iconModeRef.current === 'cover' && headerBgOpacity >= ICON_DARK_THRESHOLD)
      setIconMode('header')
    else if (iconModeRef.current === 'header' && headerBgOpacity <= ICON_LIGHT_THRESHOLD)
      setIconMode('cover')
  }, [headerBgOpacity])

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
    navigation.setOptions({ headerBackground, headerTitle: '' })
    return () => {
      navigation.setOptions({ headerBackground: undefined, headerTitle: 'Плейлист' })
    }
  }, [navigation, headerBackground])

  useEffect(() => {
    navigation.setOptions({ headerTintColor: headerIconColor })
  }, [navigation, headerIconColor])

  return { headerBgOpacity, headerIconColor, statusBarStyle }
}
