import { action, atom } from '@reatom/framework'
import { mapAllSermonsResponse, sermonsApi } from 'shared/api'
import type { SermonData } from 'shared/model'
import { getCachedSearchResults, setCachedSearchResults } from './lib/searchCache'

export const MIN_QUERY_LENGTH = 2
const SEARCH_TAKE = 20

export const searchQueryAtom = atom('', 'searchQueryAtom')
export const searchResultsAtom = atom<SermonData[]>([], 'searchResultsAtom')
export const isSearchingAtom = atom(false, 'isSearchingAtom')
export const isSearchOpenAtom = atom(false, 'isSearchOpenAtom')

let latestRequestId = 0

const cancelInFlightFetches = (): void => {
  latestRequestId += 1
}

export const openSearch = action(async ctx => {
  await ctx.schedule(() => {
    isSearchOpenAtom(ctx, true)
  })
}, 'openSearch')

export const resetSearchResults = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    searchResultsAtom(ctx, [])
    isSearchingAtom(ctx, false)
  })
}, 'resetSearchResults')

export const closeSearch = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    searchQueryAtom(ctx, '')
    searchResultsAtom(ctx, [])
    isSearchingAtom(ctx, false)
    isSearchOpenAtom(ctx, false)
  })
}, 'closeSearch')

export const fetchSearchResults = action(async (ctx, rawQuery: string) => {
  const query = rawQuery.trim()
  const requestId = ++latestRequestId

  if (!query) {
    await ctx.schedule(() => {
      searchResultsAtom(ctx, [])
      isSearchingAtom(ctx, false)
    })
    return
  }

  await ctx.schedule(() => {
    isSearchingAtom(ctx, true)
  })

  try {
    const response = await sermonsApi.getSermons().sermonControllerFindAll({
      search: query,
      take: SEARCH_TAKE,
    })
    if (requestId !== latestRequestId) return

    const sermons = mapAllSermonsResponse(response)
    void setCachedSearchResults(query, sermons).catch(error =>
      console.error('Search cache write failed:', error),
    )
    await ctx.schedule(() => {
      searchResultsAtom(ctx, sermons)
    })
  } catch (error) {
    console.error('fetchSearchResults network failed:', error)
    if (requestId !== latestRequestId) return

    let cachedSermons: SermonData[] | undefined
    try {
      cachedSermons = await getCachedSearchResults(query)
    } catch (cacheError) {
      console.error('Search cache read failed:', cacheError)
    }
    if (requestId !== latestRequestId) return

    await ctx.schedule(() => {
      searchResultsAtom(ctx, cachedSermons ?? [])
    })
  } finally {
    if (requestId === latestRequestId)
      await ctx.schedule(() => {
        isSearchingAtom(ctx, false)
      })
  }
}, 'fetchSearchResults')
