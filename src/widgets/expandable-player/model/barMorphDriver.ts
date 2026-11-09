import { type Ctx } from '@reatom/framework'
import { makeMutable, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isMiniPillCollapsedAtom } from './barMorph'

type BarMorphListener = (isTarget: boolean) => void

/**
 * 0→1 progress of the collapsed mini pill, shared by every surface of the
 * bottom-bar morph. Lives outside React (like `keyboardBottomInsetSv`) so the
 * pill, the shade and any other surface read ONE animated value instead of each
 * owning a `withTiming` that micro-drifts from the others.
 */
export const barMorphProgressSv = makeMutable(0)

const startListeners = new Set<BarMorphListener>()
const settleListeners = new Set<BarMorphListener>()

let detachAtomSubscription: (() => void) | null = null

const notify = (listeners: Set<BarMorphListener>, isTarget: boolean) => {
  for (const listener of listeners) listener(isTarget)
}

/**
 * Attaches the one atom subscription that drives every bottom-bar morph.
 * Idempotent: later callers only add their listeners, so a second hook mount
 * never starts a second `withTiming`. Like the keyboard-inset sync, the
 * subscription stays attached for the app lifetime, so a component remount
 * cannot lose a morph mid-flight.
 *
 * The subscription fires once on attach with the current atom value; that first
 * callback mirrors it into the shared value instead of animating from a stale
 * module default. Later flips start the timing and dispatch start/settle events
 * with the same contract as `useAtomMorphProgress`: an interrupted animation
 * reports no settle, and start fires before the timing starts.
 * @param ctx - Reatom context the atom subscription runs in.
 */
export const ensureBarMorphDriver = (ctx: Ctx) => {
  if (detachAtomSubscription) return

  let isFirstCallback = true
  let lastTarget = barMorphProgressSv.value === 1

  detachAtomSubscription = ctx.subscribe(isMiniPillCollapsedAtom, isTarget => {
    if (isFirstCallback) {
      isFirstCallback = false
      lastTarget = isTarget
      barMorphProgressSv.value = isTarget ? 1 : 0

      return
    }

    if (isTarget === lastTarget) return

    lastTarget = isTarget
    notify(startListeners, isTarget)
    barMorphProgressSv.value = withTiming(
      isTarget ? 1 : 0,
      { duration: BAR_MORPH_DURATION_MS },
      finished => {
        if (finished) scheduleOnRN(notify, settleListeners, isTarget)
      },
    )
  })
}

/**
 * Runs on every real morph start, before its timing begins.
 * @param listener - Called with the morph target (true = collapsed).
 */
export const registerBarMorphStartListener = (listener: BarMorphListener) => {
  startListeners.add(listener)

  return () => {
    startListeners.delete(listener)
  }
}

/**
 * Runs when a morph lands; interrupted animations report nothing.
 * @param listener - Called with the morph target (true = collapsed).
 */
export const registerBarMorphSettleListener = (listener: BarMorphListener) => {
  settleListeners.add(listener)

  return () => {
    settleListeners.delete(listener)
  }
}

/**
 * Test-only: detaches the shared subscription and drops every listener. The
 * module-level driver outlives the per-test Reatom contexts and mounts.
 */
export const resetBarMorphDriver = () => {
  detachAtomSubscription?.()
  detachAtomSubscription = null
  startListeners.clear()
  settleListeners.clear()
  barMorphProgressSv.value = 0
}
