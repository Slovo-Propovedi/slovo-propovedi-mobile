import { action } from '@reatom/framework'
import { commitSearchHistory } from '../model/commitSearchHistory'
import { searchHistoryAtom } from '../model/searchHistoryAtom'

export const removeSearchEntryAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(searchHistoryAtom)
  const next = current.filter(entry => entry.sermon.id !== sermonId)

  if (next.length === current.length) return

  await commitSearchHistory(ctx, next)
}, 'removeSearchEntry')
