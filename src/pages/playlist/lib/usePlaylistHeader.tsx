import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, runOnJS, useDerivedValue } from 'react-native-reanimated'
import { COLORS } from 'shared/ui/themed'
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
  const DARKEN_START_OFFSET = 80

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

  const headerBackground = useMemo(() => {
    const innerStyle = StyleSheet.create({
      bg: {
        backgroundColor: COLORS.background,
        flex: 1,
        opacity: headerBgOpacity,
      },
    })
    return () => <View style={innerStyle.bg} />
  }, [headerBgOpacity])

  useEffect(() => {
    navigation.setOptions({ headerBackground, headerTitle: '' })
    return () => {
      navigation.setOptions({ headerBackground: undefined, headerTitle: 'Плейлист' })
    }
  }, [navigation, headerBackground])

  return { headerBgOpacity }
}
