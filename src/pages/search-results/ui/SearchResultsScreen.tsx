import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'
import {
  SearchGroupedResults,
  SearchPlaylistRow,
  SearchPreacherRow,
  useSermonPlayback,
} from 'features/sermon-search'
import { useHistoryProgressMap } from 'entities/listening-history'
import { type PlaylistData } from 'entities/playlist'
import { useNavigationGuard } from 'shared/routing'
import { useHeaderTitle } from 'shared/routing/useHeaderTitle'
import { BLUR_TARGET_ROUTES, BlurBackdrop } from 'shared/ui'
import { parseSearchResultsParams } from '../lib/parseSearchResultsParams'
import { buildSearchResultsTitle } from '../lib/searchResultsTitle'
import { useSearchResults } from '../lib/useSearchResults'
import { ResultsList } from './ResultsList'
import { SermonResultRow } from './SermonResultRow'

const FALLBACK_TYPE = 'sermons'

export const SearchResultsScreen = () => {
  const params = useLocalSearchParams<{ query?: string; type?: string }>()
  const parsed = parseSearchResultsParams(params)
  const setHeaderTitle = useHeaderTitle()
  const router = useRouter()
  const runGuarded = useNavigationGuard()
  const { modal, onSermonPress } = useSermonPlayback()
  const progressMap = useHistoryProgressMap()

  const parsedType = parsed?.type
  const parsedQuery = parsed?.query
  const { isLoading, playlists, preachers, sermons } = useSearchResults(
    parsedType ?? FALLBACK_TYPE,
    parsedQuery ?? '',
  )

  useEffect(() => {
    if (!parsedType || !parsedQuery) return
    setHeaderTitle(buildSearchResultsTitle(parsedType, parsedQuery))
  }, [parsedQuery, parsedType, setHeaderTitle])

  const handlePlaylistPress = useCallback(
    (playlist: PlaylistData) => {
      runGuarded(() => {
        router.push({ params: { playlist: playlist.id }, pathname: '/listen/playlist' })
      })
    },
    [router, runGuarded],
  )

  const handlePreacherPress = useCallback(
    (artist: string) => {
      runGuarded(() => {
        router.push({
          params: { query: artist, type: 'sermons' },
          pathname: '/listen/search-results',
        })
      })
    },
    [router, runGuarded],
  )

  if (!parsedType) return null

  if (isLoading)
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.searchResults}>
        <SearchGroupedResults.GroupSkeleton />
      </BlurBackdrop>
    )

  if (parsedType === 'sermons')
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.searchResults}>
        <ResultsList
          data={sermons}
          keyExtractor={sermon => sermon.id}
          renderItem={({ item }) => (
            <SermonResultRow
              sermon={item}
              onPress={onSermonPress}
              progress={progressMap.get(item.id)}
            />
          )}
        />
        {modal}
      </BlurBackdrop>
    )

  if (parsedType === 'playlists')
    return (
      <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.searchResults}>
        <ResultsList
          data={playlists}
          keyExtractor={playlist => playlist.id}
          renderItem={({ item }) => (
            <SearchPlaylistRow playlist={item} onPress={handlePlaylistPress} />
          )}
        />
      </BlurBackdrop>
    )

  return (
    <BlurBackdrop routeKey={BLUR_TARGET_ROUTES.searchResults}>
      <ResultsList
        data={preachers}
        keyExtractor={artist => artist}
        renderItem={({ item }) => <SearchPreacherRow artist={item} onPress={handlePreacherPress} />}
      />
    </BlurBackdrop>
  )
}
