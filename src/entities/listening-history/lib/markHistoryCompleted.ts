import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { getEntrySermon } from './getEntrySermon'

// Player-internal completion of an existing entry (no-op without one);
// the user-initiated upsert lives in lib/markSermonListened.ts.
export const markHistoryCompletedAction = action(
  async (ctx, sermonId: string, durationMs?: number) => {
    const current = ctx.get(historyAtom)
    const index = current.findIndex(e => getEntrySermon(e)?.id === sermonId)
    if (index === -1) return

    const entry = current[index]
    const finalDurationMs =
      durationMs !== undefined && durationMs > 0 ? durationMs : entry.durationMs
    if (finalDurationMs === 0) return

    const updated = { ...entry, durationMs: finalDurationMs, positionMs: finalDurationMs }
    const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

    await commitHistory(ctx, next)
  },
  'markHistoryCompleted',
)
