import { useLayoutEffect, useRef } from 'react'
import { type SharedValue } from 'react-native-reanimated'
import { useLayoutEffectSharedValue } from 'shared/lib/hooks/useLayoutEffectSharedValue'

interface UseGeometrySharedValuesInput {
  fullScreenHeight: number
  /** Alternating ±0.01dp heal tick (Issue #63), written by `forceGeometryReapply`. */
  geometryReapplyTick: SharedValue<number>
  screenWidth: number
}

/**
 * Pre-paint mirrors of the window geometry the player's animated worklets read.
 *
 * A worklet closure re-registered from a passive phase would animate one frame
 * with the previous window (crooked chrome after a rotation), so the animated
 * layer reads these channels instead. A dimension change also bumps the heal
 * tick in the same layout effect, forcing worklets whose props match the cached
 * ones to re-derive and re-apply.
 * @param input - Current window geometry and the heal tick shared value.
 * @param input.fullScreenHeight - Full device screen height (web-clamped).
 * @param input.geometryReapplyTick - Alternating heal tick shared value.
 * @param input.screenWidth - Current window width.
 */
export const useGeometrySharedValues = ({
  fullScreenHeight,
  geometryReapplyTick,
  screenWidth,
}: UseGeometrySharedValuesInput) => {
  const fullScreenHeightShared = useLayoutEffectSharedValue(fullScreenHeight)
  const screenWidthShared = useLayoutEffectSharedValue(screenWidth)
  const previousDimensionsRef = useRef({ fullScreenHeight, screenWidth })

  // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: pre-paint heal tick so cached worklets re-derive on resize
  useLayoutEffect(() => {
    const previous = previousDimensionsRef.current
    const dimensionsChanged =
      previous.fullScreenHeight !== fullScreenHeight || previous.screenWidth !== screenWidth

    if (!dimensionsChanged) return

    previousDimensionsRef.current = { fullScreenHeight, screenWidth }
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: pre-paint heal tick so cached worklets re-derive on resize
    geometryReapplyTick.value += 1
  }, [fullScreenHeight, geometryReapplyTick, screenWidth])

  return { fullScreenHeightShared, screenWidthShared }
}
