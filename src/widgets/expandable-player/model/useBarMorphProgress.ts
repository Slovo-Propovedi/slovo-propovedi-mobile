import { useAtom, useCtx } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { isMiniPillCollapsedAtom } from './barMorph'
import {
  barMorphProgressSv,
  ensureBarMorphDriver,
  registerBarMorphSettleListener,
  registerBarMorphStartListener,
} from './barMorphDriver'

/**
 * Shared 0→1 progress of the bottom-bar morph (0 = detached mini pill above the
 * row, 1 = pill inside the collapsed bottom line). The animation is owned by the
 * module-level driver ({@link ensureBarMorphDriver}), so every hook instance —
 * pill, backdrop shade, any other surface — reads the same shared value and one
 * `withTiming`, instead of each starting its own timing that drifts.
 *
 * `settledCollapsed` lags the bar state until the morph lands: it is the state
 * the React shadow tree may commit resting geometry for. Committing the target
 * geometry on the flip itself paints the pill at its destination for a frame —
 * before Reanimated asserts the start-of-morph animated value — then the pill
 * snaps back and visibly morphs again (the one-frame search-open flash).
 *
 * A new flip immediately commits `settledCollapsed` to the START state of the
 * new animation (`!isTarget`), so an interrupted morph can never leave the flag
 * lagging behind: even if a completion callback is lost or delivered late, the
 * committed resting geometry matches where the new animation starts.
 */
export const useBarMorphProgress = () => {
  const ctx = useCtx()
  const [isCollapsed] = useAtom(isMiniPillCollapsedAtom)
  const [isMorphing, setIsMorphing] = useState(false)
  const [settledCollapsed, setSettledCollapsed] = useState(isCollapsed)
  const handleStart = useCallback((isTarget: boolean) => {
    setIsMorphing(true)
    setSettledCollapsed(!isTarget)
  }, [])
  const handleSettled = useCallback((isTarget: boolean) => {
    setIsMorphing(false)
    setSettledCollapsed(isTarget)
  }, [])

  useEffect(() => {
    const detachStart = registerBarMorphStartListener(handleStart)
    const detachSettle = registerBarMorphSettleListener(handleSettled)

    ensureBarMorphDriver(ctx)

    return () => {
      detachStart()
      detachSettle()
    }
  }, [ctx, handleStart, handleSettled])

  return { isMorphing, progress: barMorphProgressSv, settledCollapsed }
}
