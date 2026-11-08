import { action, atom } from '@reatom/framework'
import { myPlaylistsAtom, type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { collectMatchingPreachers } from './lib/composeSearchResults'
import { mergePlaylistMatches, selectLocalPlaylistMatches } from './lib/localPlaylistSearch'
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

// Last query a fetch was started for; lets `useDebouncedSearch` skip a duplicate
// debounced fetch when the query was already fetched (e.g. web deep-link seed).
export const lastFetchedQueryAtom = atom('', 'lastFetchedQueryAtom')
// External request to type text into the visible search input (the onboarding
// tour simulates typing through it). `SearchBar` mirrors every request into its
// local input state; `nonce` makes each request distinct so identical text can be
// applied twice. Kept apart from `searchQueryAtom` because the input's local
// state must not follow async query updates (controlled-input race).
export const searchInputRequestAtom = atom<{ nonce: number; text: string } | null>(
  null,
  'searchInputRequestAtom',
)

let latestRequestId = 0

export const cancelInFlightFetches = (): void => {
  latestRequestId += 1
}

const isCurrentRequest = (requestId: number): boolean => requestId === latestRequestId

export const resetSearchResults = action(async ctx => {
  cancelInFlightFetches()
  await ctx.schedule(() => {
    searchResultsAtom(ctx, [])
    searchPlaylistsAtom(ctx, [])
    searchPreachersAtom(ctx, [])
    isSearchingAtom(ctx, false)
    lastFetchedQueryAtom(ctx, '')
  })
}, 'resetSearchResults')

// Simulates a keystroke: sets the canonical query (which drives the fetch) and
// asks the visible `SearchBar` input to adopt the same text, so the onboarding
// tour's typed demo query shows up in the field while results keep flowing from
// `searchQueryAtom`.
export const typeSearchInput = action((ctx, text: string) => {
  const previous = ctx.get(searchInputRequestAtom)

  searchQueryAtom(ctx, text)
  searchInputRequestAtom(ctx, { nonce: (previous?.nonce ?? 0) + 1, text })
}, 'typeSearchInput')

export const fetchSearchResults = action(async (ctx, rawQuery: string) => {
  const query = rawQuery.trim()
  const requestId = ++latestRequestId

  // Mark synchronously: a caller that already fetched this query (deep-link
  // seed) prevents `useDebouncedSearch` from scheduling a duplicate fetch.
  lastFetchedQueryAtom(ctx, query)

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
    const localMatches = selectLocalPlaylistMatches(ctx.get(myPlaylistsAtom), query)
    const mergedPlaylists = mergePlaylistMatches(localMatches, playlistResult.data)

    await ctx.schedule(() => {
      searchResultsAtom(ctx, sermonResult.data)
      searchPlaylistsAtom(ctx, mergedPlaylists)
      searchPreachersAtom(ctx, collectMatchingPreachers(sermonResult.data, query))
    })
  } finally {
    if (isCurrentRequest(requestId))
      await ctx.schedule(() => {
        isSearchingAtom(ctx, false)
      })
  }
}, 'fetchSearchResults')
