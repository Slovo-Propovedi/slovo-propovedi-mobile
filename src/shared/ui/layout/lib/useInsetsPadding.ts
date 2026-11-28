import { useLayoutEffect } from 'react'
import { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

/**
 * Shared-value mirror of an inset-derived size, assigned before paint.
 *
 * Every delivery is written DIRECTLY, so the paddings it feeds snap: the
 * content lands on the new value in the commit that carries the inset, with no
 * tween. A rotation on Android hides and restores the system bars, so the
 * insets arrive in two waves and the content jumps twice; that sharp reflow is
 * deliberate — it exposes the real rotation shift instead of masking it behind
 * an animation.
 * @param inset - Inset-derived size in dp (safe-area padding or chrome reserve).
 * @returns Shared value the animated style reads on the UI thread.
 */
const useInsetMirror = (inset: number): SharedValue<number> => {
  const mirror = useSharedValue(inset)

  useLayoutEffect(() => {
    mirror.value = inset
  }, [inset, mirror])

  return mirror
}

interface Insets {
  /** Safe-area left inset; 0 by default. */
  left?: number
  /** Safe-area right inset; 0 by default. */
  right?: number
  /** Safe-area top inset, or the resolved value a screen uses. */
  top: number
}

/**
 * Safe-area padding for a screen root that snaps on every inset change, lateral
 * edges included. Replaces a native `SafeAreaView edges={['left', 'right']}`.
 * @param insets - Target padding per edge in dp.
 */
export const useInsetsPadding = (insets: Insets) => {
  const top = useInsetMirror(insets.top)
  const left = useInsetMirror(insets.left ?? 0)
  const right = useInsetMirror(insets.right ?? 0)

  return useAnimatedStyle(() => ({
    paddingLeft: left.value,
    paddingRight: right.value,
    paddingTop: top.value,
  }))
}

/**
 * Bottom chrome reserve for a trailing spacer that snaps on every change.
 * @param space - Bottom chrome reserve in dp.
 */
export const useInsetsSpace = (space: number) => {
  const mirror = useInsetMirror(space)

  return useAnimatedStyle(() => ({ height: mirror.value }))
}
