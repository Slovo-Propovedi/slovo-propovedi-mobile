import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect } from 'react'
import {
  resolvePlaylist,
  SearchGroupedResults,
  SearchPlaylistRow,
  SearchPreacherRow,
} from 'features/sermon-search'
import { usePlayNewSermon } from 'entities/player'
import { type PlaylistData } from 'entities/playlist'
import { type SermonData } from 'entities/sermon'
import { useHeaderTitle } from 'shared/routing/useHeaderTitle'
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
  const playNewSermon = usePlayNewSermon()

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

  const handleSermonPress = useCallback(
    (sermon: SermonData) => void playNewSermon({ playlist: resolvePlaylist(sermon), sermon }),
    [playNewSermon],
  )

  const handlePlaylistPress = useCallback(
    (playlist: PlaylistData) => {
      router.push({ params: { playlist: playlist.id }, pathname: '/listen/playlist' })
    },
    [router],
  )

  const handlePreacherPress = useCallback(
    (artist: string) => {
      router.push({
        params: { query: artist, type: 'sermons' },
        pathname: '/listen/search-results',
      })
    },
    [router],
  )

  if (!parsedType) return null

  if (isLoading)
    return (
      <SearchGroupedResults.GroupSkeleton rowKind={parsedType === 'sermons' ? 'track' : 'list'} />
    )

  if (parsedType === 'sermons')
    return (
      <ResultsList
        data={sermons}
        keyExtractor={sermon => sermon.id}
        renderItem={({ item }) => <SermonResultRow sermon={item} onPress={handleSermonPress} />}
      />
    )

  if (parsedType === 'playlists')
    return (
      <ResultsList
        data={playlists}
        keyExtractor={playlist => playlist.id}
        renderItem={({ item }) => (
          <SearchPlaylistRow playlist={item} onPress={handlePlaylistPress} />
        )}
      />
    )

  return (
    <ResultsList
      data={preachers}
      keyExtractor={artist => artist}
      renderItem={({ item }) => <SearchPreacherRow artist={item} onPress={handlePreacherPress} />}
    />
  )
}
