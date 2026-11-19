import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { sermonProgressAtom } from '../model/progressAtom'
import { getEntrySermon } from './getEntrySermon'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { removeProgressRecords } from './progressStorage'

/**
 * Removes several sermons from listening history in a single write.
 *
 * - Empty input → no-op (no writeHistory call).
 * - Filters out entries whose sermon id is in the set; if nothing was removed
 *   → no-op return (no writeHistory call).
 * - Otherwise one `commitHistory` (sync atom set + write), progress records of
 *   the removed sermons are dropped (atom + storage — parity with
 *   removeHistoryEntryAction), one clearLiveProgressSnapshot.
 */
export const removeSermonsFromHistoryAction = action(async (ctx, sermonIds: string[]) => {
  if (sermonIds.length === 0) return

  const idSet = new Set(sermonIds)
  const current = ctx.get(historyAtom)
  const removedIds = current.flatMap(entry => {
    const sermon = getEntrySermon(entry)

    if (!sermon || !idSet.has(sermon.id)) return []

    return [sermon.id]
  })
  const next = current.filter(e => !idSet.has(getEntrySermon(e)?.id ?? ''))

  if (next.length === current.length) return

  const progress = { ...ctx.get(sermonProgressAtom) }
  for (const sermonId of removedIds) delete progress[sermonId]
  sermonProgressAtom(ctx, progress)

  await commitHistory(ctx, next)
  await removeProgressRecords(removedIds)
  clearLiveProgressSnapshot()
}, 'removeSermonsFromHistory')
