import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from 'shared/ui/themed'
import type { SharedValue } from 'react-native-reanimated'

interface UseCollapsingListHeaderProps {
  scrollY: SharedValue<number>
  title: string
  titleAppearThreshold: SharedValue<number>
}

export const useCollapsingListHeader = ({
  scrollY,
  title,
  titleAppearThreshold,
}: UseCollapsingListHeaderProps) => {
  const navigation = useNavigation()
  const { currentTheme } = useTheme()
  const [headerBgOpacity, setHeaderBgOpacity] = useState(0)

  const updateHeaderTitle = useCallback(
    (shouldShowTitle: boolean) => {
      navigation.setOptions({ headerTitle: shouldShowTitle ? title : '' })
    },
    [navigation, title],
  )

  const wasAboveThreshold = useSharedValue<boolean | null>(null)

  // Navbar bg darkens over [0, titleAppearThreshold] and the title appears at the threshold:
  // both complete together, when the content title fully slides under the navbar.
  useDerivedValue(() => {
    const opacity = interpolate(scrollY.value, [0, titleAppearThreshold.value], [0, 1], 'clamp')
    scheduleOnRN(setHeaderBgOpacity, opacity)
    const crossed = scrollY.value > titleAppearThreshold.value
    if (wasAboveThreshold.value !== crossed) {
      wasAboveThreshold.value = crossed
      scheduleOnRN(updateHeaderTitle, crossed)
    }
  }, [scrollY, titleAppearThreshold, updateHeaderTitle])

  useEffect(() => {
    wasAboveThreshold.value = null
  }, [title])

  const headerBackground = useMemo(() => {
    const innerStyle = StyleSheet.create({
      bg: { backgroundColor: currentTheme.background, flex: 1, opacity: headerBgOpacity },
    })
    return () => <View style={innerStyle.bg} />
  }, [headerBgOpacity, currentTheme.background])

  useEffect(() => {
    navigation.setOptions({ headerBackground })
    return () => {
      navigation.setOptions({ headerBackground: undefined })
    }
  }, [navigation, headerBackground])
}
