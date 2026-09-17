import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { interpolate, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useHeaderTitle } from 'shared/routing'
import { useTheme } from 'shared/ui/theme'
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
  const setHeaderTitle = useHeaderTitle()

  // Worklet-side mount guard: worklets can only read shared values, so the JS-side
  // isMountedRef inside the callbacks is invisible to them. This shared value is
  // flipped to true in useEffect (post-mount) and read inside the derived value.
  const isMountedSv = useSharedValue(false)
  // Execution-side guard: an already-scheduled callback no-ops after unmount.
  const isMountedRef = useRef(false)

  useEffect(() => {
    isMountedSv.value = true
    isMountedRef.current = true
    return () => {
      isMountedSv.value = false
      isMountedRef.current = false
    }
  }, [isMountedSv])

  const updateHeaderBgOpacity = useCallback((opacity: number) => {
    if (!isMountedRef.current) return
    setHeaderBgOpacity(opacity)
  }, [])

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
    if (isMountedSv.value) scheduleOnRN(updateHeaderBgOpacity, opacity)
    const crossed = scrollY.value > threshold.value
    if (wasAboveThreshold.value !== crossed) {
      wasAboveThreshold.value = crossed
      if (isMountedSv.value) scheduleOnRN(setHeaderTitle, crossed ? title : '')
    }
  }, [darkenStart, scrollY, threshold, setHeaderTitle, title, updateHeaderBgOpacity])

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
