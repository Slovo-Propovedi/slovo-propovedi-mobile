import { action } from '@reatom/framework'
import { historyAtom } from '../model/history'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { clearLiveProgressSnapshot } from './liveProgressStorage'

/**
 * Removes several sermons from listening history in a single write.
 *
 * - Empty input → no-op (no writeHistory call).
 * - Filters out entries whose sermon id is in the set; if nothing was removed
 *   → no-op return (no writeHistory call).
 * - Otherwise one `commitHistory` (sync atom set + write), one
 *   clearLiveProgressSnapshot
 *   (mirrors removeHistoryEntryAction in model/history.ts).
 */
export const removeSermonsFromHistoryAction = action(async (ctx, sermonIds: string[]) => {
  if (sermonIds.length === 0) return

  const idSet = new Set(sermonIds)
  const current = ctx.get(historyAtom)
  const next = current.filter(e => !idSet.has(getEntrySermon(e)?.id ?? ''))

  if (next.length === current.length) return

  await writeHistory(next)
  await ctx.schedule(() => {
    historyAtom(ctx, next)
  })
  clearLiveProgressSnapshot()
}, 'removeSermonsFromHistory')
