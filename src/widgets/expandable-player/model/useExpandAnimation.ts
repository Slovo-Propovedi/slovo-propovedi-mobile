import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Dimensions, useWindowDimensions } from 'react-native'
import { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { getColumnSideInset } from 'shared/ui/layout'
import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/theme'
import type { SharedValue } from 'react-native-reanimated'
import { getMiniPlayerBottom } from '../lib/getMiniPlayerBottom'
import { getRestingContainerStyle } from '../lib/getRestingContainerStyle'
import { useAppStateSnap } from './useAppStateSnap'
import { useGeometrySharedValues } from './useGeometrySharedValues'
import { useOpacityStyles } from './useOpacityStyles'

const MINI_H = PLAYER_SIZES.miniPlayerHeight

interface UseExpandAnimationResult {
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  backgroundImageStyle: ReturnType<typeof useAnimatedStyle>
  blurStyle: ReturnType<typeof useAnimatedStyle>
  collapsedRestingContainerStyle: ReturnType<typeof getRestingContainerStyle>
  containerStyle: ReturnType<typeof useAnimatedStyle>
  /** Stable reference — forces containerStyle worklet to re-run on the UI thread. */
  forceGeometryReapply: () => void
  fullStyle: ReturnType<typeof useAnimatedStyle>
  miniOverlayStyle: ReturnType<typeof useAnimatedStyle>
  miniStyle: ReturnType<typeof useAnimatedStyle>
  progress: SharedValue<number>
  restingContainerStyle: ReturnType<typeof getRestingContainerStyle>
  screenHeight: number
  screenWidth: number
}

export const useExpandAnimation = (
  expanded: boolean,
  tabBarHeight: number,
): UseExpandAnimationResult => {
  const progress = useSharedValue(0)
  const geometryReapplyTick = useSharedValue(0)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  const fullScreenHeight = Dimensions.get('screen').height
  const miniBottom = getMiniPlayerBottom(tabBarHeight)
  const { fullScreenHeightShared, miniBottomShared, screenWidthShared } = useGeometrySharedValues(
    miniBottom,
    screenWidth,
    fullScreenHeight,
  )
  const restingContainerStyle = useMemo(
    () => getRestingContainerStyle({ expanded, fullScreenHeight, miniBottom, screenWidth }),
    [expanded, fullScreenHeight, miniBottom, screenWidth],
  )
  const collapsedRestingContainerStyle = useMemo(
    () => getRestingContainerStyle({ expanded: false, fullScreenHeight, miniBottom, screenWidth }),
    [fullScreenHeight, miniBottom, screenWidth],
  )
  // On first mount, assign directly (no withTiming) to force the shared value
  // onto the UI thread and re-trigger dependent worklets. Subsequent expanded
  // changes animate normally with withTiming.
  const isFirstRunRef = useRef(true)

  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      progress.value = expanded ? 1 : 0
      return
    }
    progress.value = withTiming(expanded ? 1 : 0, { duration: expanded ? 300 : 250 })
  }, [expanded, progress])

  useAppStateSnap(expanded, progress)

  const containerStyle = useAnimatedStyle(() => {
    // Register dependency: any write to geometryReapplyTick re-runs this worklet,
    // re-applying all returned props natively — the heal channel for Issue #63.
    // Alternating sign (±0.01dp) defeats no-diff skip while keeping the offset
    // permanently bounded — no monotonic accumulation.
    const reapply = geometryReapplyTick.value % 2 === 1 ? 0.01 : -0.01
    const b = interpolate(progress.value, [0, 1], [miniBottomShared.value, 0])
    const t = interpolate(
      progress.value,
      [0, 1],
      [fullScreenHeightShared.value - miniBottomShared.value - MINI_H, 0],
    )
    // Desktop-web: collapsed bar is centered in a capped column; expanded is full width.
    const inset = getColumnSideInset(screenWidthShared.value, INDENTS.low)
    const w = interpolate(
      progress.value,
      [0, 1],
      [screenWidthShared.value - inset * 2, screenWidthShared.value],
    )
    return {
      borderBottomLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderBottomRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderTopLeftRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      borderTopRightRadius: interpolate(progress.value, [0, 1], [RADIUSES.middle, 0]),
      bottom: b,
      left: interpolate(progress.value, [0, 1], [inset, 0]),
      top: t + reapply,
      width: w,
    }
  })
  const { backdropStyle, backgroundImageStyle, blurStyle, fullStyle, miniOverlayStyle, miniStyle } =
    useOpacityStyles(progress)

  /**
   * Forces the containerStyle worklet to re-run and re-apply current (correct)
   * geometry on the UI thread — the heal channel for the cached-props stomp
   * (Issue #63). Alternating ±0.01dp offset defeats no-diff cache while keeping
   * drift permanently bounded. Programmatic equivalent of a user interaction,
   * which was empirically proven to always fix the stale geometry.
   */
  const forceGeometryReapply = useCallback(() => {
    geometryReapplyTick.value += 1
    // eslint-disable-next-line react-hooks/exhaustive-deps -- geometryReapplyTick is a stable shared-value ref
  }, [])

  return {
    backdropStyle,
    backgroundImageStyle,
    blurStyle,
    collapsedRestingContainerStyle,
    containerStyle,
    forceGeometryReapply,
    fullStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    restingContainerStyle,
    screenHeight,
    screenWidth,
  }
}
