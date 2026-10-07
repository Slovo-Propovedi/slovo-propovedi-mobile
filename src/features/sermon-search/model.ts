import { action, atom } from '@reatom/framework'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { collectMatchingPreachers, mergePlaylistResults } from './lib/composeSearchResults'
import {
  fetchPlaylistTitleMatches,
  fetchSermonResults,
  persistSearchResults,
} from './lib/searchSources'

export const MIN_QUERY_LENGTH = 2

export const searchQueryAtom = atom('', 'searchQueryAtom')
export const searchResultsAtom = atom<SermonData[]>([], 'searchResultsAtom')
export const searchPlaylistsAtom = atom<PlaylistData[]>([], 'searchPlaylistsAtom')
export const searchPreachersAtom = atom<string[]>([], 'searchPreachersAtom')
export const isSearchingAtom = atom(false, 'isSearchingAtom')
export const isSearchOpenAtom = atom(false, 'isSearchOpenAtom')

let latestRequestId = 0

const cancelInFlightFetches = (): void => {
  latestRequestId += 1
}

const isCurrentRequest = (requestId: number): boolean => requestId === latestRequestId

export const openSearch = action(async ctx => {
  await ctx.schedule(() => {
    isSearchOpenAtom(ctx, true)
  })
}, 'openSearch')

export const resetSearchResults = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    searchResultsAtom(ctx, [])
    searchPlaylistsAtom(ctx, [])
    searchPreachersAtom(ctx, [])
    isSearchingAtom(ctx, false)
  })
}, 'resetSearchResults')

export const closeSearch = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    searchQueryAtom(ctx, '')
    searchResultsAtom(ctx, [])
    searchPlaylistsAtom(ctx, [])
    searchPreachersAtom(ctx, [])
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
      searchPlaylistsAtom(ctx, [])
      searchPreachersAtom(ctx, [])
      isSearchingAtom(ctx, false)
    })
    return
  }

  await ctx.schedule(() => {
    isSearchingAtom(ctx, true)
  })

  try {
    const [sermonResult, playlistResult] = await Promise.all([
      fetchSermonResults(query),
      fetchPlaylistTitleMatches(query),
    ])
    if (!isCurrentRequest(requestId)) return

    persistSearchResults(query, sermonResult, playlistResult)

    await ctx.schedule(() => {
      searchResultsAtom(ctx, sermonResult.data)
      searchPlaylistsAtom(ctx, mergePlaylistResults(playlistResult.data, sermonResult.data))
      searchPreachersAtom(ctx, collectMatchingPreachers(sermonResult.data, query))
    })
  } finally {
    if (isCurrentRequest(requestId))
      await ctx.schedule(() => {
        isSearchingAtom(ctx, false)
      })
  }
}, 'fetchSearchResults')
