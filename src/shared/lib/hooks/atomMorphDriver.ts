import { type Atom, type Ctx } from '@reatom/framework'
import { type FrameInfo, type SharedValue } from 'react-native-reanimated'
import { createAtomMorphClock, type MorphFrameHost } from './atomMorphClock'

/**
 * One module-level 0→1 progress shared by every surface of an atom-driven
 * morph. The frame clock starts in the atom subscription (same tick as the atom
 * flip), so no surface has to wait for a React commit before it starts moving.
 */
export interface AtomMorphDriver {
  atom: Atom<boolean>
  /** First attached surface steps the morph; the rest are standby hosts. */
  attachFrameHost: (host: MorphFrameHost) => () => void
  /**
   * Attaches the one atom subscription; idempotent until reset, and latched to
   * the FIRST ctx it receives (a ctx swap needs `reset()` first).
   */
  ensure: (ctx: Ctx) => void
  /** UI-thread step the React surface registers with `useFrameCallback`. */
  frameStep: (frameInfo: FrameInfo) => void
  /** Whether the shared atom subscription is attached. */
  isAttached: () => boolean
  progress: SharedValue<number>
  /** Runs on every real flip, before the clock starts. */
  registerSettleListener: (listener: MorphListener) => () => void
  /** Runs when a morph lands; interrupted animations report nothing. */
  registerStartListener: (listener: MorphListener) => () => void
  /** Test-only: detaches the subscription, drops listeners and zeroes the value. */
  reset: () => void
  /** Seeds the shared value from the atom without animating (first render). */
  seed: (ctx: Ctx) => void
  /** Seeds the value and commits the settle without animating. */
  snap: (ctx: Ctx) => void
}

interface AtomMorphDriverConfig {
  atom: Atom<boolean>
  durationMs: number
}

type MorphListener = (isTarget: boolean) => void

/**
 * Creates a shared morph driver for one atom-driven boolean.
 * @param config - Target atom and the morph duration shared by its surfaces.
 * @param config.atom - Boolean atom whose flips drive the progress.
 * @param config.durationMs - Morph duration in milliseconds.
 */
export const createAtomMorphDriver = ({
  atom,
  durationMs,
}: AtomMorphDriverConfig): AtomMorphDriver => {
  const startListeners = new Set<MorphListener>()
  const settleListeners = new Set<MorphListener>()

  let detachAtomSubscription: (() => void) | null = null
  // Gates the subscription callback against a queued listener firing after
  // `reset()`: teardown ignores the flip instead of re-arming the clock.
  let isSubscriptionLive = false

  const notify = (listeners: Set<MorphListener>, isTarget: boolean) => {
    for (const listener of listeners) listener(isTarget)
  }

  const clock = createAtomMorphClock({
    durationMs,
    onSettled: isTarget => notify(settleListeners, isTarget),
  })

  // Starts on the atom flip tick, so it does not wait for a React commit.
  const ensure = (ctx: Ctx) => {
    if (detachAtomSubscription) return

    isSubscriptionLive = true
    let isFirstCallback = true
    let lastTarget = clock.progress.value === 1

    detachAtomSubscription = ctx.subscribe(atom, isTarget => {
      if (!isSubscriptionLive) return

      if (isFirstCallback) {
        isFirstCallback = false
        lastTarget = isTarget
        clock.snapTo(isTarget ? 1 : 0)

        return
      }

      if (isTarget === lastTarget) return

      lastTarget = isTarget
      notify(startListeners, isTarget)
      clock.start(isTarget ? 1 : 0)
    })
  }

  const registerListener = (listeners: Set<MorphListener>, listener: MorphListener) => {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  return {
    atom,
    attachFrameHost: clock.attachFrameHost,
    ensure,
    frameStep: clock.frameStep,
    isAttached: () => detachAtomSubscription !== null,
    progress: clock.progress,
    registerSettleListener: listener => registerListener(settleListeners, listener),
    registerStartListener: listener => registerListener(startListeners, listener),
    reset: () => {
      isSubscriptionLive = false
      detachAtomSubscription?.()
      detachAtomSubscription = null
      startListeners.clear()
      settleListeners.clear()
      clock.reset()
    },
    seed: ctx => clock.snapTo(ctx.get(atom) ? 1 : 0),
    snap: ctx => {
      const value = ctx.get(atom) ? 1 : 0
      clock.snapTo(value)
      notify(settleListeners, value === 1)
    },
  }
}
