import { type SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useIsWideLayout } from 'shared/ui/layout'
import { getContainerGeometryStyle } from '../lib/getContainerGeometryStyle'
import { getContainerOpacity } from '../lib/getContainerOpacity'
import { getMiniBarStyle } from '../lib/getMiniBarStyle'

interface GeometryAnimatedStylesInput {
  barProgress: SharedValue<number>
  fullScreenHeight: number
  /** Alternating ±0.01dp heal tick (Issue #63), written by `forceGeometryReapply`. */
  geometryReapplyTick: SharedValue<number>
  progress: SharedValue<number>
  screenWidth: number
  tabBarHeightShared: SharedValue<number>
  /** The chrome's bottom padding, the wide pill's rest line. */
  wideBottomInset: number
}

/**
 * Animated geometry styles of the container and the mini pill.
 * Extracted from useExpandAnimation to keep the main hook within the 130-line
 * limit, and so both styles obtain the wide-layout flag from one place.
 *
 * In the wide layout the bottom-bar morph is pinned to the expanded pose: the
 * tab island is anchored to the top, so the pill never folds into a bottom row
 * (the same force the tab island applies to its own progress).
 * @param input - Shared values and render-time geometry driving the worklets.
 * @param input.barProgress - Bottom-bar morph progress (0 = expanded pill, 1 = collapsed row).
 * @param input.geometryReapplyTick - Alternating heal tick for the Issue #63 re-apply channel.
 * @param input.fullScreenHeight - Full device screen height.
 * @param input.progress - Expand/collapse progress (0 = mini pill, 1 = fullscreen).
 * @param input.screenWidth - Current window width.
 * @param input.tabBarHeightShared - Measured height of the floating tab row.
 * @param input.wideBottomInset - The chrome's bottom padding, the wide pill's rest line.
 */
export const useGeometryAnimatedStyles = ({
  barProgress,
  fullScreenHeight,
  geometryReapplyTick,
  progress,
  screenWidth,
  tabBarHeightShared,
  wideBottomInset,
}: GeometryAnimatedStylesInput) => {
  const isWideLayout = useIsWideLayout()

  const containerStyle = useAnimatedStyle(() => {
    // Register dependency: any write to geometryReapplyTick re-runs this worklet,
    // re-applying all returned props natively — the heal channel for Issue #63.
    // Alternating sign (±0.01dp) defeats no-diff skip while keeping the offset
    // permanently bounded — no monotonic accumulation.
    const reapply = geometryReapplyTick.value % 2 === 1 ? 0.01 : -0.01
    // Interpolates from the CURRENT mini geometry (expanded or collapsed pill),
    // so expanding out of the collapsed bottom line stays continuous.
    const style = getContainerGeometryStyle({
      barProgress: isWideLayout ? 0 : barProgress.value,
      fullScreenHeight,
      isWideLayout,
      progress: progress.value,
      screenWidth,
      tabBarHeight: tabBarHeightShared.value,
      wideBottomInset,
    })

    // At rest the container is invisible: its solid `surface` would sit exactly
    // under the translucent mini pill and make the glass read as opaque (the
    // pill's BlurView would only see a solid rectangle). Any animation frame
    // keeps it visible for the morph.
    return { ...style, opacity: getContainerOpacity(progress.value), top: style.top + reapply }
  })
  const miniBarStyle = useAnimatedStyle(() => {
    // Same heal channel as the container: a tick write re-runs this worklet and
    // re-applies the pill's geometry natively, so a post-measurement correction
    // (the collapsed row's 80→102dp) cannot be dropped or overwritten. The
    // alternating ±0.01dp offset defeats no-diff skip; `- reapply` moves the pill
    // in the same screen direction as the container's `top + reapply`, and the
    // collapsed container shares the pill's rect, so the guard then heals both.
    const reapply = geometryReapplyTick.value % 2 === 1 ? 0.01 : -0.01
    const style = getMiniBarStyle({
      barProgress: isWideLayout ? 0 : barProgress.value,
      fullScreenHeight,
      isWideLayout,
      screenWidth,
      tabBarHeight: tabBarHeightShared.value,
      wideBottomInset,
    })

    return { ...style, bottom: style.bottom - reapply }
  })

  return { containerStyle, miniBarStyle }
}
