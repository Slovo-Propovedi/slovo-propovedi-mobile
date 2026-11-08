import { type Atom } from '@reatom/framework'
import { useCtx } from '@reatom/npm-react'
import { useEffect } from 'react'
import { type SharedValue, useSharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

type SettleHandler = (isTarget: boolean) => void

/**
 * 0→1 Reanimated progress driven by a Reatom atom.
 *
 * The animation starts in the atom subscription, not in a render effect: on
 * Android a dev-build React commit sits ~130 ms between the atom flip and the
 * effect that used to call `withTiming`, so the bar visibly froze before the
 * morph began. The subscription runs in the same tick as the atom change and
 * dispatches the animation to the UI thread immediately; the later React render
 * only catches up with the resting state.
 *
 * The first subscription callback mirrors the current atom value, so it is
 * skipped when it agrees with the value already seeded into `progress`.
 * @param targetAtom - Atom whose boolean value selects the target (false = 0, true = 1).
 * @param durationMs - Morph duration, shared by every surface of one bar morph.
 * @param onSettled - Runs on the JS thread when the animation completes; an
 * interrupted animation reports nothing so the replacement owns the commit.
 * @param onStart - Runs on the JS thread on every real flip, before the timing
 * starts (used to commit the start state of the new animation).
 */
export const useAtomMorphProgress = (
  targetAtom: Atom<boolean>,
  durationMs: number,
  onSettled?: SettleHandler,
  onStart?: SettleHandler,
): SharedValue<number> => {
  const ctx = useCtx()
  const progress = useSharedValue(ctx.get(targetAtom) ? 1 : 0)

  useEffect(() => {
    let isFirstCallback = true
    let lastTarget = progress.value === 1

    return ctx.subscribe(targetAtom, isTarget => {
      if (isFirstCallback) {
        isFirstCallback = false
        // The subscription calls back once on subscribe with the current value.
        if (isTarget === lastTarget) return
      }

      lastTarget = isTarget
      onStart?.(isTarget)
      progress.value = withTiming(isTarget ? 1 : 0, { duration: durationMs }, finished => {
        if (finished && onSettled) scheduleOnRN(onSettled, isTarget)
      })
    })
  }, [ctx, durationMs, onSettled, onStart, progress, targetAtom])

  return progress
}
