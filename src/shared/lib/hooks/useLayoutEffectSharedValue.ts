import { useLayoutEffect } from 'react'
import { type SharedValue, useSharedValue } from 'react-native-reanimated'

/**
 * Mirror of a render-time number on the UI thread, written BEFORE paint.
 *
 * Worklet closures are re-registered in a passive phase after the commit, so a
 * value captured from render reaches the animated layer one frame late (a
 * rotated window animates at the old width while the React resting layer
 * already carries the new one). A shared value written in a layout effect is
 * visible to dependent worklets in the same commit; the equality guard keeps
 * equal values from hopping to the UI thread.
 * @param value - Current render value to mirror.
 */
export const useLayoutEffectSharedValue = (value: number): SharedValue<number> => {
  const sharedValue = useSharedValue(value)

  useLayoutEffect(() => {
    if (sharedValue.value === value) return

    sharedValue.value = value
  }, [sharedValue, value])

  return sharedValue
}
