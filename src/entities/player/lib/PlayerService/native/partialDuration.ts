import { getEntrySermon, historyAtom } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, setDurationAction } from '../../../model'

/**
 * Shows the full file's length on the timeline while a partial plays: the
 * player reports the truncated duration, so the authoritative full length is
 * taken from listening history when known; falls back to the partial's own
 * length when history has no record. Always writes exactly one duration.
 * @param partialDurationMs - Duration reported by the player for the partial.
 */
export const applyPartialDuration = (partialDurationMs: number): void => {
  const audio = ctx.get(currentAudioAtom)
  if (!audio) return
  const entry = ctx.get(historyAtom).find(e => getEntrySermon(e)?.id === audio.id)
  const fullDurationMs = entry?.durationMs ?? 0
  void setDurationAction(ctx, fullDurationMs > 0 ? fullDurationMs : partialDurationMs)
}
