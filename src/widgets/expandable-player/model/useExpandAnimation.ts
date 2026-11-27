import { useCallback } from 'react'
import { Dimensions, useWindowDimensions } from 'react-native'
import { type SharedValue, type useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { oneLineBarMorphDriver } from 'widgets/tab-bar/@x/morph'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { useLayoutEffectSharedValue } from 'shared/lib/hooks/useLayoutEffectSharedValue'
import { useBarBottomPadding, useLayoutBaseWidth } from 'shared/ui/layout'
import { type getMiniBarStyle } from '../lib/getMiniBarStyle'
import { type getRestingContainerStyle } from '../lib/getRestingContainerStyle'
import { useAppStateSnap } from './useAppStateSnap'
import { useGeometryAnimatedStyles } from './useGeometryAnimatedStyles'
import { useGeometrySharedValues } from './useGeometrySharedValues'
import { useOpacityStyles } from './useOpacityStyles'
import { useProgressAnimation } from './useProgressAnimation'
import { useRestingStyles } from './useRestingStyles'
import { useTabBarHeightShared } from './useTabBarHeightShared'

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
  // UI-thread mirror of the bar collapse (axis D).
  const { progress: barProgress, settled: settledCollapsed } =
    useAtomMorphDriver(oneLineBarMorphDriver)
  const geometryReapplyTick = useSharedValue(0)
  const { height: screenHeight, width: screenWidth } = useWindowDimensions()
  // The compact pill is sized from the orientation-independent layout base, so
  // a phone rotation moves it without resizing it. `screenWidth` stays live: it
  // centres the pill and spans the fullscreen sheet.
  const contentWidth = useLayoutBaseWidth()
  // On web `Dimensions.get('screen')` is the physical `window.screen.height`,
  // larger than the viewport; absolute player geometry would overshoot and spawn
  // a document-level scrollbar. Clamp to the viewport (native window == screen).
  const fullScreenHeight = Math.min(Dimensions.get('screen').height, screenHeight)
  // Pre-paint window channels: the animated worklets must not run on a closure
  // that is re-registered after the commit (one stale frame after a rotation).
  const { contentWidthShared, fullScreenHeightShared, screenWidthShared } = useGeometrySharedValues(
    {
      contentWidth,
      fullScreenHeight,
      geometryReapplyTick,
      screenWidth,
    },
  )
  const tabBarHeightShared = useTabBarHeightShared(tabBarHeight)
  // Mirrors `expanded` (1 = expanded, 0 = collapsed), not the pill's real mount
  // flag: on expand the pill unmounts with the tap, while the sheet must stay
  // transparent only at collapsed rest and solid from the first expand frame.
  const expandedShared = useLayoutEffectSharedValue(expanded ? 1 : 0)
  const { settledExpanded, settleOnSnap } = useProgressAnimation(expanded, progress)
  useAppStateSnap(expanded, progress, settleOnSnap)
  // One authority for the wide pill's rest line: the same chrome bottom padding
  // the islands row uses, threaded to the pure geometry as a plain number.
  const wideBottomInset = useBarBottomPadding()
  // Resting geometry follows the SETTLED expand state (like `settledCollapsed`).
  const { barCollapsedTop, barExpandedTop, miniBarRestingStyle, restingContainerStyle } =
    useRestingStyles({
      barCollapsed: settledCollapsed,
      contentWidth,
      expanded: settledExpanded,
      fullScreenHeight,
      screenWidth,
      tabBarHeight,
      wideBottomInset,
    })
  const { containerStyle, miniBarStyle } = useGeometryAnimatedStyles({
    barProgress,
    contentWidthShared,
    expandedShared,
    fullScreenHeightShared,
    geometryReapplyTick,
    progress,
    screenWidthShared,
    tabBarHeightShared,
    wideBottomInset,
  })
  const { backdropStyle, backgroundImageStyle, fullStyle, miniStyle } = useOpacityStyles(progress)

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
    miniStyle,
    progress,
    restingContainerStyle,
    screenHeight,
    screenWidth,
  }
}
