import { action } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/sermon/@x/search-history'
import { commitSearchHistory } from '../model/commitSearchHistory'
import { searchHistoryAtom } from '../model/searchHistoryAtom'
import { sortAndCapSearchEntries } from './sortAndCapSearchEntries'

export const addSearchEntryAction = action(async (ctx, sermon: AudioPlayerData) => {
  const entry = { savedAt: Date.now(), sermon }
  const next = sortAndCapSearchEntries([entry, ...ctx.get(searchHistoryAtom)])

  await commitSearchHistory(ctx, next)
}, 'addSearchEntry')
