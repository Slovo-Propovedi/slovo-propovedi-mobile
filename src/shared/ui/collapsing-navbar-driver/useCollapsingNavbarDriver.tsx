import { useNavigation } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated'
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

// React state only needs coarse steps: consumers (icon tint hysteresis at 0.7/0.4) act on
// thresholds, not on per-frame values. Quantizing to 0.05 collapses ~95% of state updates.
const OPACITY_STATE_STEP = 0.05

// Drives a collapsing navbar: fades the header background over [darkenStart, threshold] and toggles the
// header title (the SOLE writer of headerTitle via navigation.setOptions) when scroll crosses the threshold.
// The background opacity itself is animated on the UI thread (useAnimatedStyle) — the previous
// per-frame scheduleOnRN → setState → setOptions chain was the visible darkening lag.
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
  // Last quantized step reported to React state; skips scheduleOnRN when the step is unchanged.
  const lastReportedStep = useSharedValue(-1)

  const bgOpacity = useDerivedValue(() => {
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
    // Coarse state update only: state feeds consumer coupling (icon hysteresis), the visible
    // opacity runs on the UI thread via bgOpacity → useAnimatedStyle.
    const step = Math.round(opacity / OPACITY_STATE_STEP)
    if (step !== lastReportedStep.value) {
      lastReportedStep.value = step
      if (isMountedSv.value) scheduleOnRN(updateHeaderBgOpacity, step * OPACITY_STATE_STEP)
    }
    const crossed = scrollY.value > threshold.value
    if (wasAboveThreshold.value !== crossed) {
      wasAboveThreshold.value = crossed
      if (isMountedSv.value) scheduleOnRN(setHeaderTitle, crossed ? title : '')
    }
    return opacity
  }, [darkenStart, scrollY, threshold, setHeaderTitle, title, updateHeaderBgOpacity])

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }), [bgOpacity])

  const bgStyles = useMemo(
    () => StyleSheet.create({ bg: { backgroundColor: currentTheme.background, flex: 1 } }),
    [currentTheme.background],
  )
  // Stable identity: navigation.setOptions fires only on theme change / unmount, never per frame.
  // Animated.View is required for useAnimatedStyle to drive opacity on the UI thread (plain View
  // ignores animated styles). No hooks inside — safe whether react-navigation renders it as a
  // component or calls it as a function.
  const headerBackground = useCallback(
    () => <Animated.View style={[bgStyles.bg, bgStyle]} />,
    [bgStyles, bgStyle],
  )

  useEffect(() => {
    navigation.setOptions({ headerBackground })
    return () => {
      navigation.setOptions({ headerBackground: undefined })
    }
  }, [navigation, headerBackground])

  return { headerBgOpacity }
}
