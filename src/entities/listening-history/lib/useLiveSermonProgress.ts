import { type Atom, atom } from '@reatom/framework'
import { useAtom } from '@reatom/npm-react'
import { currentAudioAtom, durationAtom, positionAtom } from 'entities/player'

const LIVE_PROGRESS_PRECISION = 100

/**
 * Per-sermonId derived atoms, cached for app lifetime.
 * The Map holds ~100s of tiny atoms at most (bounded by distinct sermons rendered);
 * acceptable memory footprint.
 */
const liveProgressAtoms = new Map<string, Atom<number | undefined>>()

/**
 * Get-or-create a derived atom that computes live progress for a specific sermon.
 * Returns undefined when currentAudio?.id !== sermonId or duration <= 0;
 * else Math.min(position/duration, 1) floored to 2 decimals.
 * Reatom dedupes when a computed value is reference-equal (undefined === undefined)
 * → non-current rows stop re-rendering entirely; only the current row's atom changes.
 * @param sermonId - The sermon to compute live progress for.
 */
export const getLiveProgressAtom = (sermonId: string) => {
  const existing = liveProgressAtoms.get(sermonId)
  if (existing) return existing

  const derived = atom(ctx => {
    const currentAudio = ctx.spy(currentAudioAtom)
    const duration = ctx.spy(durationAtom)
    const position = ctx.spy(positionAtom)

    if (!currentAudio || currentAudio.id !== sermonId || duration <= 0) return undefined

    const ratio = Math.min(position / duration, 1)

    // Round down to 2 decimals: 0.00, 0.01, ..., 1.00
    // Consumers re-render at most ~50 times per full listen.
    return Math.floor(ratio * LIVE_PROGRESS_PRECISION) / LIVE_PROGRESS_PRECISION
  }, `liveProgressAtom:${sermonId}`)

  liveProgressAtoms.set(sermonId, derived)

  return derived
}

/**
 * Live progress ONLY while the given sermon is the current one and playing.
 * @param sermonId - The sermon to track live progress for.
 */
export const useLiveSermonProgress = (sermonId: string): number | undefined =>
  useAtom(getLiveProgressAtom(sermonId))[0]
