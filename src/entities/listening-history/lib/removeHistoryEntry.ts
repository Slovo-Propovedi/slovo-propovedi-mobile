import { action } from '@reatom/framework'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { getEntrySermon } from './getEntrySermon'
import { clearLiveProgressSnapshot } from './liveProgressStorage'

export const removeHistoryEntryAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const next = current.filter(e => getEntrySermon(e)?.id !== sermonId)

  if (next.length === current.length) return

  await commitHistory(ctx, next)
  clearLiveProgressSnapshot()
}, 'removeHistoryEntry')
