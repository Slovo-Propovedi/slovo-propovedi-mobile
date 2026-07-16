import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from 'shared/ui/themed'
import type { SharedValue } from 'react-native-reanimated'

interface UseCollapsingNavbarDriverOptions {
  // Scroll offset where the navbar background STARTS darkening; it reaches full opacity at `threshold`.
  darkenStart: SharedValue<number>
  // Shared scroll offset driven by the screen's scroll handler.
  scrollY: SharedValue<number>
  // Navbar title appears when scrollY > threshold.
  threshold: SharedValue<number>
  // Text shown in the navbar once scroll crosses the threshold.
  title: string
}

interface UseCollapsingNavbarDriverResult {
  // Current navbar background opacity (0..1) as React state — useful for icon/statusbar color coupling.
  headerBgOpacity: number
}

// Drives a collapsing navbar: fades the header background over [darkenStart, threshold] and toggles the
// header title (the SOLE writer of headerTitle via navigation.setOptions) when scroll crosses the threshold.
export const useCollapsingNavbarDriver = ({
  darkenStart,
  scrollY,
  threshold,
  title,
}: UseCollapsingNavbarDriverOptions): UseCollapsingNavbarDriverResult => {
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
  const prevTitleSv = useSharedValue(title)

  useDerivedValue(() => {
    // Reset threshold tracking when title changes (guard clause)
    if (prevTitleSv.value !== title) {
      prevTitleSv.value = title
      wasAboveThreshold.value = null
    }

    const opacity = interpolate(
      scrollY.value,
      [darkenStart.value, threshold.value],
      [0, 1],
      'clamp',
    )
    scheduleOnRN(setHeaderBgOpacity, opacity)
    const crossed = scrollY.value > threshold.value
    if (wasAboveThreshold.value !== crossed) {
      wasAboveThreshold.value = crossed
      scheduleOnRN(updateHeaderTitle, crossed)
    }
  }, [darkenStart, scrollY, threshold, updateHeaderTitle, title])

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

  return { headerBgOpacity }
}
