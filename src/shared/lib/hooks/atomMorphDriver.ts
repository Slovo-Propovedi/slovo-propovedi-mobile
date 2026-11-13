import { type Atom, type Ctx } from '@reatom/framework'
import { makeMutable, type SharedValue, withTiming } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

/**
 * One module-level 0→1 progress shared by every surface of an atom-driven
 * morph. The in-repo bar morph (`barMorphDriver`) is built on this factory: the
 * timing starts in the atom subscription (same tick as the atom flip), so no
 * surface has to wait for a React commit before it starts moving.
 */
export interface AtomMorphDriver {
  atom: Atom<boolean>
  /**
   * Attaches the one atom subscription; idempotent until {@link AtomMorphDriver.reset}.
   *
   * Latches to the FIRST ctx it receives and stays latched for the app
   * lifetime: later calls ignore their ctx. Swapping the Reatom context
   * therefore requires {@link AtomMorphDriver.reset} first (driver tests reset
   * in `beforeEach`).
   */
  ensure: (ctx: Ctx) => void
  /** Whether the shared atom subscription is attached. */
  isAttached: () => boolean
  progress: SharedValue<number>
  /** Runs on every real flip, before the timing starts. */
  registerSettleListener: (listener: MorphListener) => () => void
  /** Runs when a morph lands; interrupted animations report nothing. */
  registerStartListener: (listener: MorphListener) => () => void
  /** Test-only: detaches the subscription, drops listeners and zeroes the value. */
  reset: () => void
  /** Seeds the shared value from the atom without animating (first render). */
  seed: (ctx: Ctx) => void
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
  const progress = makeMutable(0)
  const startListeners = new Set<MorphListener>()
  const settleListeners = new Set<MorphListener>()

  let detachAtomSubscription: (() => void) | null = null

  const notify = (listeners: Set<MorphListener>, isTarget: boolean) => {
    for (const listener of listeners) listener(isTarget)
  }

  /**
   * Attaches the one atom subscription; idempotent until `reset`.
   *
   * The subscription latches to the FIRST ctx it receives: a later call with a
   * different ctx is a no-op, so a ctx swap requires `reset()` first (drivers'
   * tests reset in `beforeEach`).
   * @param ctx - Reatom context the atom subscription runs in.
   */
  const ensure = (ctx: Ctx) => {
    if (detachAtomSubscription) return

    let isFirstCallback = true
    let lastTarget = progress.value === 1

    detachAtomSubscription = ctx.subscribe(atom, isTarget => {
      if (isFirstCallback) {
        isFirstCallback = false
        lastTarget = isTarget
        progress.value = isTarget ? 1 : 0

        return
      }

      if (isTarget === lastTarget) return

      lastTarget = isTarget
      notify(startListeners, isTarget)
      progress.value = withTiming(isTarget ? 1 : 0, { duration: durationMs }, finished => {
        if (finished) scheduleOnRN(notify, settleListeners, isTarget)
      })
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
    ensure,
    isAttached: () => detachAtomSubscription !== null,
    progress,
    registerSettleListener: listener => registerListener(settleListeners, listener),
    registerStartListener: listener => registerListener(startListeners, listener),
    reset: () => {
      detachAtomSubscription?.()
      detachAtomSubscription = null
      startListeners.clear()
      settleListeners.clear()
      progress.value = 0
    },
    seed: ctx => {
      progress.value = ctx.get(atom) ? 1 : 0
    },
  }
}
