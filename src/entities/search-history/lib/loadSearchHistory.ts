import { action } from '@reatom/framework'
import { reportError } from 'shared/model/error-dialog'
import { isSearchHistoryLoadedAtom, searchHistoryAtom } from '../model/searchHistoryAtom'
import { type SearchHistory } from '../model/types'
import { readSearchHistory } from './searchHistoryStorage'
import { sortAndCapSearchEntries } from './sortAndCapSearchEntries'

// Hydration can race with a search backfill or a backup import that already
// updated the atom: merge in-memory first so equal timestamps keep the fresher
// copy (sortAndCapSearchEntries keeps the first entry on a tie).
const mergeHydrated = (stored: SearchHistory, inMemory: SearchHistory): SearchHistory =>
  sortAndCapSearchEntries([...inMemory, ...stored])

export const loadSearchHistoryAction = action(async ctx => {
  try {
    const stored = sortAndCapSearchEntries(await readSearchHistory())
    // After the first hydration the atom is authoritative: reloads are explicit
    // writes to disk (backup import) and must not blend in the previous state.
    const next = ctx.get(isSearchHistoryLoadedAtom)
      ? stored
      : mergeHydrated(stored, ctx.get(searchHistoryAtom))

    await ctx.schedule(() => {
      searchHistoryAtom(ctx, next)
    })
  } catch (error) {
    console.error('Failed to load search history:', error)
    reportError(error, 'Не удалось загрузить историю поиска')
  } finally {
    await ctx.schedule(() => {
      isSearchHistoryLoadedAtom(ctx, true)
    })
  }
}, 'loadSearchHistory')
