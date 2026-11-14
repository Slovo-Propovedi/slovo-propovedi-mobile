import { createAtomMorphDriver } from 'shared/lib/hooks/atomMorphDriver'
import { BAR_MORPH_DURATION_MS } from 'shared/ui/layout'
import { isMiniPillCollapsedAtom } from './barMorph'

/**
 * Axis D of the bottom-chrome morph: the collapsed mini pill. One module-level
 * driver shared by the pill, the backdrop shade and every other surface, so the
 * morph starts from the atom flip and every surface reads one animated value.
 */
export const barMorphDriver = createAtomMorphDriver({
  atom: isMiniPillCollapsedAtom,
  durationMs: BAR_MORPH_DURATION_MS,
})

/**
 * 0→1 progress of the collapsed mini pill, shared by every surface of the
 * bottom-bar morph. Lives outside React (like `keyboardBottomInsetSv`) so the
 * pill, the shade and any other surface read ONE animated value instead of each
 * owning a `withTiming` that micro-drifts from the others.
 */
export const barMorphProgressSv = barMorphDriver.progress

/**
 * Attaches the one atom subscription that drives every bottom-bar morph.
 * Idempotent until {@link resetBarMorphDriver}; the subscription stays attached
 * for the app lifetime, so a component remount cannot lose a morph mid-flight.
 * @param ctx - Reatom context the atom subscription runs in.
 */
export const ensureBarMorphDriver = barMorphDriver.ensure

/**
 * Runs on every real morph start, before its timing begins.
 * @param listener - Called with the morph target (true = collapsed).
 */
export const registerBarMorphStartListener = barMorphDriver.registerStartListener

/**
 * Runs when a morph lands; interrupted animations report nothing.
 * @param listener - Called with the morph target (true = collapsed).
 */
export const registerBarMorphSettleListener = barMorphDriver.registerSettleListener

/**
 * Test-only: detaches the shared subscription and drops every listener. The
 * module-level driver outlives the per-test Reatom contexts and mounts.
 */
export const resetBarMorphDriver = barMorphDriver.reset
