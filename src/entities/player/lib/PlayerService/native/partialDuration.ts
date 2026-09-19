import { getEntrySermon, historyAtom } from 'entities/listening-history/@x/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { currentAudioAtom, setDurationAction } from '../../../model'

/**
 * Keeps the full file's length on the timeline while a partial plays: the
 * player reports the truncated duration, so the authoritative full length is
 * taken from listening history when known. When history has no record the
 * previous known duration is kept — the timeline never shows the truncated
 * partial length nor jumps.
 */
export const applyPartialDuration = (): void => {
  const audio = ctx.get(currentAudioAtom)
  if (!audio) return
  const entry = ctx.get(historyAtom).find(e => getEntrySermon(e)?.id === audio.id)
  const fullDurationMs = entry?.durationMs ?? 0
  if (fullDurationMs > 0) void setDurationAction(ctx, fullDurationMs)
}
