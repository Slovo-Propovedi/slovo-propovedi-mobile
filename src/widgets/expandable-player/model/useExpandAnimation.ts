import { useCallback } from 'react'
import { Dimensions, useWindowDimensions } from 'react-native'
import { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { getContainerGeometryStyle } from '../lib/getContainerGeometryStyle'
import { getContainerOpacity } from '../lib/getContainerOpacity'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'
import { type getRestingContainerStyle } from '../lib/getRestingContainerStyle'
import { useAppStateSnap } from './useAppStateSnap'
import { useBarMorphProgress } from './useBarMorphProgress'
import { useGeometrySharedValues } from './useGeometrySharedValues'
import { useOpacityStyles } from './useOpacityStyles'
import { useProgressAnimation } from './useProgressAnimation'
import { useRestingStyles } from './useRestingStyles'

interface UseExpandAnimationResult {
  backdropStyle: ReturnType<typeof useAnimatedStyle>
  backgroundImageStyle: ReturnType<typeof useAnimatedStyle>
  /** Resting mini top while the bar is collapsed to one row (morph progress 1). */
  barCollapsedTop: number
  /** Resting mini top while the bar is expanded / detached (morph progress 0). */
  barExpandedTop: number
  containerStyle: ReturnType<typeof useAnimatedStyle>
  /** Stable reference — forces containerStyle worklet to re-run on the UI thread. */
  forceGeometryReapply: () => void
  fullStyle: ReturnType<typeof useAnimatedStyle>
  miniBarRestingStyle: ReturnType<typeof getMiniBarStyle>
  miniBarStyle: ReturnType<typeof useAnimatedStyle>
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
  // UI-thread mirror of the bar collapse (see `useBarMorphProgress`).
  const barMorph = useBarMorphProgress()
  const geometryReapplyTick = useSharedValue(0)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  // On web `Dimensions.get('screen')` is the physical `window.screen.height`,
  // larger than the viewport; absolute player geometry would overshoot and spawn
  // a document-level scrollbar. Clamp to the viewport (native window == screen).
  const fullScreenHeight = Math.min(Dimensions.get('screen').height, screenHeight)
  const { fullScreenHeightShared, screenWidthShared, tabBarHeightShared } = useGeometrySharedValues(
    { fullScreenHeight, screenWidth, tabBarHeight },
  )
  const { settledExpanded, settleOnSnap } = useProgressAnimation(expanded, progress)
  useAppStateSnap(expanded, progress, settleOnSnap)
  // Resting geometry follows the SETTLED expand state (like `settledCollapsed`).
  const { barCollapsedTop, barExpandedTop, miniBarRestingStyle, restingContainerStyle } =
    useRestingStyles({
      barCollapsed: barMorph.settledCollapsed,
      expanded: settledExpanded,
      fullScreenHeight,
      screenWidth,
      tabBarHeight,
    })

  const containerStyle = useAnimatedStyle(() => {
    // Register dependency: any write to geometryReapplyTick re-runs this worklet,
    // re-applying all returned props natively — the heal channel for Issue #63.
    // Alternating sign (±0.01dp) defeats no-diff skip while keeping the offset
    // permanently bounded — no monotonic accumulation.
    const reapply = geometryReapplyTick.value % 2 === 1 ? 0.01 : -0.01
    // Interpolates from the CURRENT mini geometry (expanded or collapsed pill),
    // so expanding out of the collapsed bottom line stays continuous.
    const style = getContainerGeometryStyle({
      barProgress: barMorph.progress.value,
      fullScreenHeight: fullScreenHeightShared.value,
      progress: progress.value,
      screenWidth: screenWidthShared.value,
      tabBarHeight: tabBarHeightShared.value,
    })

    // At rest the container is invisible: its solid `surface` would sit exactly
    // under the translucent mini pill and make the glass read as opaque (the
    // pill's BlurView would only see a solid rectangle). Any animation frame
    // keeps it visible for the morph.
    return { ...style, opacity: getContainerOpacity(progress.value), top: style.top + reapply }
  })
  const miniBarStyle = useAnimatedStyle(() =>
    getMiniBarStyle({
      barProgress: barMorph.progress.value,
      fullScreenHeight: fullScreenHeightShared.value,
      screenWidth: screenWidthShared.value,
      tabBarHeight: tabBarHeightShared.value,
    }),
  )
  const { backdropStyle, backgroundImageStyle, fullStyle, miniOverlayStyle, miniStyle } =
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
    barCollapsedTop,
    barExpandedTop,
    containerStyle,
    forceGeometryReapply,
    fullStyle,
    miniBarRestingStyle,
    miniBarStyle,
    miniOverlayStyle,
    miniStyle,
    progress,
    restingContainerStyle,
    screenHeight,
    screenWidth,
  }
}
